import pool from '../config/db.js';

export const Plan = {
      findByName: async (name) => {
            const query = 'SELECT * FROM plans WHERE name = $1;'
            const result = await pool.query(query, [name])
            return result.rows[0]
      },
}