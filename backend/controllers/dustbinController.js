const { pool } = require("../config/db");
const locationService = require("../services/locationServices");
const { execFile } = require("child_process");
const util = require("util");
const path = require("path");
const fs = require("fs");

const execFilePromise = util.promisify(execFile);

const sortByIds = (dataArray, orderedIds) => {
  const map = {};
  dataArray.forEach((item) => (map[item.id] = item));
  return orderedIds.map((id) => map[id]).filter(Boolean);
};

const getPrioritizedIds = async (dustbins, reverse = false) => {
  const binaryName =
    process.platform === "win32" ? "priority_queue.exe" : "priority_queue";
  const binaryPath = path.join(process.cwd(), "bin", binaryName);

  if (!fs.existsSync(binaryPath)) {
    throw new Error(`Priority binary not found at: ${binaryPath}`);
  }

  const dustbinsJson = JSON.stringify(dustbins);
  console.log(
    "Executing priority queue at:",
    binaryPath,
    "with input:",
    dustbinsJson
  );

  const { stdout } = await execFilePromise(binaryPath, [dustbinsJson], {
    cwd: process.cwd(),
  });

  let ids = JSON.parse(stdout);
  if (!Array.isArray(ids))
    throw new Error("Invalid output from priority_queue");

  return reverse ? ids.reverse() : ids;
};

exports.getNearbyDustbins = async (req, res) => {
  const { latitude, longitude, radius } = req.query;
  try {
    const dustbins = await locationService.findNearbyDustbins(
      latitude,
      longitude,
      radius
    );
    res.json(dustbins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateDustbinStatus = async (req, res) => {
  const { id, fill_level } = req.body;
  try {
    const result = await pool.query(
      `UPDATE dustbins 
       SET fill_level = $1, last_updated = $2 
       WHERE id = $3 
       RETURNING id, latitude, longitude, fill_level, type, last_updated`,
      [fill_level, new Date(), id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Dustbin not found" });
    }

    const data = result.rows[0];
    req.io.emit("dustbinUpdate", data);
    res.json(data);
  } catch (error) {
    console.error("Error in updateDustbinStatus:", error);
    res.status(500).json({ error: "Failed to update dustbin" });
  }
};

exports.addDustbin = async (req, res) => {
  const { latitude, longitude, type } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO dustbins (latitude, longitude, fill_level, type) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, latitude, longitude, fill_level, type, last_updated`,
      [latitude, longitude, 0, type]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error in addDustbin:", error);
    res.status(500).json({ error: "Failed to add dustbin" });
  }
};

exports.getPrioritizedDustbins = async (req, res) => {
  try {
    const result = await pool.query("SELECT id, fill_level FROM dustbins");
    const dustbins = result.rows;

    if (!dustbins || dustbins.length === 0) return res.status(200).json([]);

    const prioritizedIds = await getPrioritizedIds(dustbins);
    const resultDustbins = await pool.query(
      `SELECT id, latitude, longitude, fill_level, type 
       FROM dustbins 
       WHERE id = ANY($1)`,
      [prioritizedIds]
    );

    const sorted = sortByIds(resultDustbins.rows, prioritizedIds);
    res.json(sorted);
  } catch (error) {
    console.error("Error in getPrioritizedDustbins:", error);
    res
      .status(500)
      .json({ error: `Failed to prioritize dustbins: ${error.message}` });
  }
};

exports.getAvailableDustbins = async (req, res) => {
  try {
    const result = await pool.query("SELECT id, fill_level FROM dustbins");
    const dustbins = result.rows;

    if (!dustbins || dustbins.length === 0) return res.status(200).json([]);

    const prioritizedIds = await getPrioritizedIds(dustbins, true);
    const resultDustbins = await pool.query(
      `SELECT id, latitude, longitude, fill_level, type 
       FROM dustbins 
       WHERE id = ANY($1)`,
      [prioritizedIds]
    );

    const sorted = sortByIds(resultDustbins.rows, prioritizedIds);
    res.json(sorted);
  } catch (error) {
    console.error("Error in getAvailableDustbins:", error);
    res
      .status(500)
      .json({ error: `Failed to get available dustbins: ${error.message}` });
  }
};

exports.subscribeToDustbinUpdates = (io) => {
  
  setInterval(async () => {
    try {
      const result = await pool.query(
        `SELECT id, latitude, longitude, fill_level, type, last_updated 
         FROM dustbins 
         WHERE last_updated > NOW() - INTERVAL '5 seconds'`
      );
      result.rows.forEach((dustbin) => {
        io.emit("dustbinUpdate", dustbin);
      });
    } catch (error) {
      console.error("Error in dustbin subscription polling:", error);
    }
  }, 5000); 
};