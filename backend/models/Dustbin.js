const { pool } = require("../config/db");

exports.create = async ({ latitude, longitude, type }) => {
  try {
    const result = await pool.query(
      `INSERT INTO dustbins (latitude, longitude, fill_level, type) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, latitude, longitude, fill_level, type, last_updated`,
      [latitude, longitude, 0, type]
    );
    return result.rows[0];
  } catch (error) {
    throw new Error("Failed to create dustbin");
  }
};

exports.updateFillLevel = async (id, fill_level) => {
  try {
    const result = await pool.query(
      `UPDATE dustbins 
       SET fill_level = $1, last_updated = $2 
       WHERE id = $3 
       RETURNING id, latitude, longitude, fill_level, type, last_updated`,
      [fill_level, new Date(), id]
    );
    if (result.rowCount === 0) {
      throw new Error("Dustbin not found");
    }
    return result.rows[0];
  } catch (error) {
    throw new Error(error.message || "Failed to update dustbin");
  }
};

exports.findAll = async () => {
  try {
    const result = await pool.query(
      "SELECT id, latitude, longitude, fill_level, type, last_updated FROM dustbins"
    );
    return result.rows;
  } catch (error) {
    throw new Error("Failed to fetch dustbins");
  }
};

exports.findById = async (id) => {
  try {
    const result = await pool.query(
      "SELECT id, latitude, longitude, fill_level, type, last_updated FROM dustbins WHERE id = $1",
      [id]
    );
    if (result.rowCount === 0) {
      throw new Error("Dustbin not found");
    }
    return result.rows[0];
  } catch (error) {
    throw new Error(error.message || "Failed to find dustbin");
  }
};