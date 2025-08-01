const { pool } = require("../config/db");
const { execFile } = require("child_process");
const path = require("path");
const util = require("util");
const execFilePromise = util.promisify(execFile);

exports.findNearbyDustbins = async (latitude, longitude, radius) => {
  try {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const rad = parseFloat(radius);
    if (isNaN(lat) || isNaN(lon) || isNaN(rad) || rad <= 0) {
      throw new Error("Invalid latitude, longitude, or radius");
    }

    const result = await pool.query(
      "SELECT id, latitude, longitude, fill_level, type FROM dustbins"
    );
    const dustbins = result.rows;
    if (!dustbins.length) return [];

    const binsJson = JSON.stringify(
      dustbins.map((d) => ({
        id: d.id,
        latitude: d.latitude,
        longitude: d.longitude,
      }))
    );

    const quadtreeBinary =
      process.platform === "win32" ? "quadtree.exe" : "quadtree";
    const quadtreePath = path.join(process.cwd(), "bin", quadtreeBinary);
    console.log("Executing quadtree at:", quadtreePath);
    const { stdout } = await execFilePromise(
      quadtreePath,
      [lat.toString(), lon.toString(), rad.toString(), binsJson],
      { cwd: process.cwd() }
    );

    let dustbinIds;
    try {
      dustbinIds = JSON.parse(stdout);
      if (!Array.isArray(dustbinIds))
        throw new Error("Invalid output from quadtree.exe");
    } catch (e) {
      throw new Error(`Failed to parse quadtree output: ${e.message}`);
    }

    if (dustbinIds.length === 0) return [];
    const nearbyResult = await pool.query(
      `SELECT id, latitude, longitude, fill_level, type 
       FROM dustbins 
       WHERE id = ANY($1)`,
      [dustbinIds]
    );

    return nearbyResult.rows;
  } catch (error) {
    console.error("Error in findNearbyDustbins:", error.message);
    throw new Error(`Failed to find nearby dustbins: ${error.message}`);
  }
};
