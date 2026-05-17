import pool from "../../config/db.js";
import { Plan } from "../../models/plan.models.js";
import { Subscription } from "../../models/subscription.model.js";
import AppError from "../../utils/AppError.js";
import { createBillingTransaction, createSubscription } from "./subscription.repository.js";

export const processSubscription = async (userId, planPriceId, autoRenew) => {
      const client = await pool.connect();

      try {
            await client.query("BEGIN");

            const priceQuery = await Plan.getPlanPrices(client, planPriceId);

            if (priceQuery.length === 0) {
                  throw new AppError("Invalid subscription option selected", 400);
            }

            const selectedPlan = priceQuery[0];

            const currentSubQuery = await Subscription.getActiveSubscriptionByUserId(client, userId);

            if (currentSubQuery.length > 0) {
                  await Subscription.expireActiveSubscription(client, userId);
            }

            const transactionQuery = await createBillingTransaction({
                  client: client,
                  user_id: userId,
                  plan_id: selectedPlan.plan_id,
                  plan_price_id: selectedPlan.plan_price_id,
                  price: selectedPlan.price,
                  currency: selectedPlan.currency
            });

            const transaction = transactionQuery.rows[0];

            const expiryQuery = await client.query(
                  `SELECT NOW() + ($1 || ' months')::interval AS expires_at`,
                  [selectedPlan.duration_months]
            );

            const expiresAt = expiryQuery?.rows[0]?.expires_at;

            const subQuery = await createSubscription({
                  client: client,
                  user_id: userId,
                  plan_id: selectedPlan.plan_id,
                  plan_price_id: selectedPlan.plan_price_id,
                  expires_at: expiresAt,
                  auto_renew: autoRenew
            });

            const subscription = subQuery.rows[0];

            await client.query("COMMIT");

            return {
                  success: true,
                  message: `${selectedPlan.name} plan activated successfully`,

                  subscription: {
                        id: subscription.id,
                        status: subscription.status,
                        startedAt: subscription.started_at,
                        expiresAt: subscription.expires_at,
                        autoRenew: subscription.auto_renew
                  },

                  plan: {
                        id: selectedPlan.plan_id,
                        name: selectedPlan.name,
                        interval: selectedPlan.interval,
                        durationMonths: selectedPlan.duration_months,
                        price: Number(selectedPlan.price),
                        currency: selectedPlan.currency
                  },

                  transaction: {
                        id: transaction.id,
                        status: transaction.status,
                        amount: Number(selectedPlan.price),
                        currency: selectedPlan.currency,
                        externalReference: transaction.external_reference
                  },

                  meta: {
                        serverTime: new Date().toISOString()
                  }
            };
      } catch (error) {
            await client.query("ROLLBACK");
            throw error;
      } finally {
            client.release();
      }
};