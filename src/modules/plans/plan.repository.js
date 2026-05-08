import pool from "../../config/db.js";

export const createPlan = async (planData) => {
      const query = 'INSERT INTO plans (name, daily_jobs_limit, max_file_size_mb, priority_level, storage_limit_mb, watermark_enabled, price, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *';
      const values = [planData.name, planData.daily_jobs_limit, planData.max_file_size_mb, planData.priority_level, planData.storage_limit_mb, planData.watermark_enabled || false, planData.price, planData.is_active || true];
      const { rows } = await pool.query(query, values);
      return rows[0];
}

export const getPlans = async () => {
      const query = 'SELECT * FROM plans';
      const { rows } = await pool.query(query);
      return rows;
}