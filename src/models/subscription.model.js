import pool from "../config/db.js"

export const Subscription = {
      getActiveSubscriptionByUserId: async (client, userId) => {
            const query = `
                  SELECT id
                  FROM subscriptions
                  WHERE user_id = $1
                        AND status = 'active'
                  FOR UPDATE`

            const result = await client.query(query, [userId])
            return result.rows
      },

      expireActiveSubscription: async (client, userId) => {
            const query = `
                  UPDATE subscriptions
                  SET
                    status = 'expired',
                    updated_at = NOW()
                  WHERE user_id = $1
                    AND status = 'active'`

            const result = await client.query(query, [userId])
            return result.rows
      }
}

