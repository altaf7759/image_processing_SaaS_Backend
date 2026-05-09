import pool from '../../config/db.js'

export const createSubscription = async ({ client, user_id, plan_id, plan_price_id, expires_at, auto_renew = false }) => {
      const query = `
                  INSERT INTO subscriptions (
                        user_id,
                        plan_id,
                        plan_price_id,
                        status,
                        started_at,
                        expires_at,
                        auto_renew,
                        source
                  )
                  VALUES (
                  $1, $2, $3,
                  'active',
                  NOW(),
                  $4,
                  $5,
                  'manual_upgrade'
                  )
                  RETURNING
                  id,
                  status,
                  started_at,
                  expires_at,
                  auto_renew,
                  created_at
            `
      const result = await client.query(query, [user_id, plan_id, plan_price_id, expires_at, auto_renew])
      return result
}

export const createBillingTransaction = async ({ client, user_id, plan_id, plan_price_id, price, currency = 'INR' }) => {
      const query = `
                  INSERT INTO billing_transactions (
                        user_id,
                        plan_id,
                        plan_price_id,
                        amount,
                        currency,
                        status,
                        external_reference
                  )
                  VALUES (
                        $1, $2, $3, $4, $5,
                        'completed',
                        gen_random_uuid()::text
                  )
                  RETURNING id, status, external_reference
            `
      const result = await client.query(query, [user_id, plan_id, plan_price_id, price, currency])
      return result
}