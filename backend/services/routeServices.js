const { supabase } = require("../config/db");
const { execFile } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const util = require("util");
const execFilePromise = util.promisify(execFile);

exports.getOptimizedRoute = async (dustbinIds) => {
  try {
    if (!Array.isArray(dustbinIds) || dustbinIds.length === 0) {
      throw new Error("Invalid or empty dustbinIds array");
    }

    const { data: dustbins, error } = await supabase
      .from("dustbins")
      .select("id, latitude, longitude, fill_level")
      .in("id", dustbinIds);
    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }
    if (!dustbins || dustbins.length === 0) {
      throw new Error("No dustbins found for provided IDs");
    }

    const idToIndex = new Map(dustbinIds.map((id, index) => [id, index]));
    const graph = dustbins.map((d1) =>
      dustbins.map((d2) => ({
        to: d2.id,
        weight:
          Math.sqrt(
            Math.pow(d1.latitude - d2.latitude, 2) +
              Math.pow(d1.longitude - d2.longitude, 2)
          ) *
          (1 + d2.fill_level / 100),
      }))
    );

    const routeData = { dustbinIds, dustbins, graph };
    const dijkstraBinary =
      process.platform === "win32" ? "dijkstra.exe" : "dijkstra";
    const dijkstraPath = path.join(process.cwd(), "bin", dijkstraBinary);
    const { stdout } = await execFilePromise(
      dijkstraPath,
      [JSON.stringify(routeData)],
      { cwd: process.cwd() }
    );

    let route;
    try {
      route = JSON.parse(stdout);
      if (!Array.isArray(route))
        throw new Error("Invalid route output from dijkstra.exe");
    } catch (e) {
      throw new Error(`Failed to parse dijkstra output: ${e.message}`);
    }

    return route;
  } catch (error) {
    throw new Error(`Failed to compute route: ${error.message}`);
  }
};
