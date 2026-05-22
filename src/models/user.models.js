import pool from "../config/db.js"

export const User = {
      findByEmail: async (email) => {
            const query = 'SELECT * FROM users WHERE email = $1;'
            const result = await pool.query(query, [email])
            return result.rows[0]
      },

      findActivePlanByUserId: async (
            userId
      ) => {

            const query = `
            SELECT
                  p.daily_jobs_limit,
                  p.max_file_size_bytes,
                  p.priority_level,
                  p.storage_limit_bytes,
                  p.is_active,

                  u.storage_used_bytes,

                  s.plan_id,
                  s.status,
                  s.expires_at

            FROM subscriptions AS s

            JOIN plans AS p
                  ON p.id = s.plan_id

            JOIN users AS u
                  ON u.id = s.user_id

            WHERE s.user_id = $1
            AND s.status = 'active'

            LIMIT 1;
      `;

            const result =
                  await pool.query(
                        query,
                        [userId]
                  );

            return result.rows[0];
      }
}

