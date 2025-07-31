const { pool } = require("../config/db");
const bcrypt = require("bcryptjs");

exports.create = async ({ username, password, role }) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role",
      [username, hashedPassword, role]
    );
    return result.rows[0];
  } catch (error) {
    throw new Error("Failed to create user");
  }
};

exports.findByUsername = async (username) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    return result.rows[0];
  } catch (error) {
    throw new Error("Failed to find user");
  }
};
