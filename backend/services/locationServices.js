const { supabase } = require('../config/db');
const { execFile } = require('child_process');
const path = require('path');
const util = require('util');
const execFilePromise = util.promisify(execFile);

exports.findNearbyDustbins = async (latitude, longitude, radius) => {
  try {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const rad = parseFloat(radius);
    if (isNaN(lat) || isNaN(lon) || isNaN(rad) || rad <= 0) {
      throw new Error('Invalid latitude, longitude, or radius');
    }

    const { data: dustbins, error } = await supabase
      .from('dustbins')
      .select('id, latitude, longitude, fill_level, type');
    if (error) throw new Error(`Supabase error: ${error.message}`);
    if (!dustbins.length) return [];

    const binsJson = JSON.stringify(dustbins.map(d => ({
      id: d.id,
      latitude: d.latitude,
      longitude: d.longitude
    })));

    const quadtreeBinary = process.platform === 'win32' ? 'quadtree.exe' : 'quadtree';
    const quadtreePath = path.join(process.cwd(), 'bin', quadtreeBinary); // Remove extra 'backend'
    console.log('Executing quadtree at:', quadtreePath); // Debug log
    const { stdout } = await execFilePromise(
      quadtreePath,
      [lat.toString(), lon.toString(), rad.toString(), binsJson],
      { cwd: process.cwd() } // Set cwd to backend root
    );

    let dustbinIds;
    try {
      dustbinIds = JSON.parse(stdout);
      if (!Array.isArray(dustbinIds)) throw new Error('Invalid output from quadtree.exe');
    } catch (e) {
      throw new Error(`Failed to parse quadtree output: ${e.message}`);
    }

    if (dustbinIds.length === 0) return [];
    const { data: nearbyDustbins, error: fetchError } = await supabase
      .from('dustbins')
      .select('id, latitude, longitude, fill_level, type')
      .in('id', dustbinIds);
    if (fetchError) throw new Error(`Supabase fetch error: ${fetchError.message}`);

    return nearbyDustbins;
  } catch (error) {
    console.error('Error in findNearbyDustbins:', error.message);
    throw new Error(`Failed to find nearby dustbins: ${error.message}`);
  }
};