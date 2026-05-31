import pool from '../config/db.js';

export const Plan = {
      findByName: async (name) => {
            const query = 'SELECT * FROM plans WHERE name = $1;'
            const result = await pool.query(query, [name])
            return result.rows[0]
      },

      getPlanPrices: async (planId, client = pool) => {
            const query = `
                  SELECT
                        pp.id AS plan_price_id,
                        pp.interval,
                        pp.duration_months,
                        pp.price,
                        pp.currency,
                        p.id AS plan_id,
                        p.name,
                        p.is_free,
                        p.is_active
                  FROM plan_prices pp
                  INNER JOIN plans p
                        ON p.id = pp.plan_id
                  WHERE p.id = $1
                        AND pp.is_active = TRUE
                        AND p.is_active = TRUE
                  LIMIT 1
                  `;

            const result = await client.query(query, [planId]);
            return result.rows;
      },

      getPlanIdAndPlanPriceIdForFreePlan: async () => {
            const query = `
                  SELECT
                        p.id AS plan_id,
                        pp.id AS price_id
                  FROM plans AS p
                  LEFT JOIN plan_prices AS pp
                        ON pp.plan_id = p.id
                  WHERE p.name = 'Free'
                  AND p.is_active = TRUE
                  LIMIT 1
            `
            const result = await pool.query(query)
            return result.rows[0]
      },

      getPlanDetails: async () => {
            const query = `
                  SELECT
                        p.id AS plan_id,
                        p.name,
                        p.is_free,
                        p.daily_jobs_limit,
                        p.max_file_size_bytes,
                        p.priority_level,
                        p.storage_limit_bytes,
                        p.watermark_enabled,
                        p.is_active AS plan_is_active,
                        pp.id AS price_id,
                        pp.interval,
                        pp.duration_months,
                        pp.price,
                        pp.currency,
                        pp.is_active AS price_is_active
                  FROM plans AS p
                  INNER JOIN plan_prices AS pp ON p.id = pp.plan_id
                  WHERE p.is_active = TRUE
                  AND pp.is_active = TRUE;
            `
            const result = await pool.query(query)
            return result.rows
      },

      findPlanNameByPlanId: async (planId) => {
            const query = `
                  SELECT name FROM plans WHERE id = $1;
            `
            const result = await pool.query(query, [planId])
            return result.rows
      }
}