import pool from "../../config/db.js";

export const createUser = async ({ name, email, password_hash, timezone = "UTC" }) => {
      const query = `INSERT INTO users (name, email, password_hash, timezone) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, is_verified, timezone`;
      const values = [name, email, password_hash, timezone];
      const { rows } = await pool.query(query, values);
      return rows[0];
};