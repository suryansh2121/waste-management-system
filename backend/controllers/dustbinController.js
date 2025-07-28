const { supabase } = require("../config/db");
const locationService = require("../services/locationServices");
const { execFile } = require("child_process");
const util = require("util");
const path = require("path");
const fs = require("fs");

const execFilePromise = util.promisify(execFile);


const sortByIds = (dataArray, orderedIds) => {
  const map = {};
  dataArray.forEach(item => map[item.id] = item);
  return orderedIds.map(id => map[id]).filter(Boolean);
};

const getPrioritizedIds = async (dustbins, reverse = false) => {
  const binaryName = process.platform === "win32" ? "priority_queue.exe" : "priority_queue";
  const binaryPath = path.join(process.cwd(), "bin", binaryName);

  if (!fs.existsSync(binaryPath)) {
    throw new Error(`Priority binary not found at: ${binaryPath}`);
  }

  const dustbinsJson = JSON.stringify(dustbins);
  console.log("Executing priority queue at:", binaryPath, "with input:", dustbinsJson);
  
  const { stdout } = await execFilePromise(binaryPath, [dustbinsJson], { cwd: process.cwd() });

  let ids = JSON.parse(stdout);
  if (!Array.isArray(ids)) throw new Error("Invalid output from priority_queue");

  return reverse ? ids.reverse() : ids;
};

exports.getNearbyDustbins = async (req, res) => {
  const { latitude, longitude, radius } = req.query;
  try {
    const dustbins = await locationService.findNearbyDustbins(latitude, longitude, radius);
    res.json(dustbins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.updateDustbinStatus = async (req, res) => {
  const { id, fill_level } = req.body;
  try {
    const { data, error } = await supabase
      .from("dustbins")
      .update({ fill_level, last_updated: new Date() })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ error: "Dustbin not found" });

    req.io.emit("dustbinUpdate", data); // Real-time update
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to update dustbin" });
  }
};

exports.addDustbin = async (req, res) => {
  const { latitude, longitude, type } = req.body;
  try {
    const { data, error } = await supabase
      .from("dustbins")
      .insert({ latitude, longitude, fill_level: 0, type })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to add dustbin" });
  }
};

exports.getPrioritizedDustbins = async (req, res) => {
  try {
    const { data: dustbins, error } = await supabase
      .from("dustbins")
      .select("id, fill_level");

    if (error) throw new Error(`Supabase error: ${error.message}`);
    if (!dustbins || dustbins.length === 0) return res.status(200).json([]);

    const prioritizedIds = await getPrioritizedIds(dustbins); // full → empty

    const { data: resultDustbins, error: fetchError } = await supabase
      .from("dustbins")
      .select("id, latitude, longitude, fill_level, type")
      .in("id", prioritizedIds);

    if (fetchError) throw new Error(`Supabase fetch error: ${fetchError.message}`);

    const sorted = sortByIds(resultDustbins, prioritizedIds);
    res.json(sorted);
  } catch (error) {
    console.error("Error in getPrioritizedDustbins:", error);
    res.status(500).json({ error: `Failed to prioritize dustbins: ${error.message}` });
  }
};


exports.getAvailableDustbins = async (req, res) => {
  try {
    const { data: dustbins, error } = await supabase
      .from("dustbins")
      .select("id, fill_level");

    if (error) throw new Error(`Supabase error: ${error.message}`);
    if (!dustbins || dustbins.length === 0) return res.status(200).json([]);

    const prioritizedIds = await getPrioritizedIds(dustbins, true); // empty → full

    const { data: resultDustbins, error: fetchError } = await supabase
      .from("dustbins")
      .select("id, latitude, longitude, fill_level, type")
      .in("id", prioritizedIds);

    if (fetchError) throw new Error(`Supabase fetch error: ${fetchError.message}`);

    const sorted = sortByIds(resultDustbins, prioritizedIds);
    res.json(sorted);
  } catch (error) {
    console.error("Error in getAvailableDustbins:", error);
    res.status(500).json({ error: `Failed to get available dustbins: ${error.message}` });
  }
};

exports.subscribeToDustbinUpdates = (io) => {
  supabase
    .channel("public:dustbins")
    .on("postgres_changes", {
      event: "UPDATE",
      schema: "public",
      table: "dustbins"
    }, (payload) => {
      io.emit("dustbinUpdate", payload.new);
    })
    .subscribe();
};
