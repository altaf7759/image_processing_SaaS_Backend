import pool from '../../config/db.js'

export const createSubscription = async ({
      client = pool,
      user_id,
      plan_id,
      plan_price_id,
      expires_at = null,
      auto_renew = false,
      source = "manual_upgrade"
}) => {

      const query = `
            INSERT INTO subscriptions (
                  user_id,
                  plan_id,
                  plan_price_id,
                  expires_at,
                  auto_renew,
                  source
            )
            VALUES (
                  $1,
                  $2,
                  $3,
                  $4,
                  $5,
                  $6
            )
            RETURNING
                  id,
                  status,
                  started_at,
                  expires_at,
                  auto_renew,
                  created_at
      `;

      const values = [
            user_id,
            plan_id,
            plan_price_id,
            expires_at,
            auto_renew,
            source
      ];

      const result = await client.query(
            query,
            values
      );

      return result.rows[0];
};

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