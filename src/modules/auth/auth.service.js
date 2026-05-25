import bcrypt from 'bcrypt';
import { createUser } from './auth.repository.js';
import { User } from '../../models/user.models.js';
import AppError from '../../utils/AppError.js';
import { signToken } from '../../utils/jwt.js';
import { Plan } from '../../models/plan.models.js';
import { createSubscription } from '../subscriptions/subscription.repository.js';
import { emailQueue } from '../../queues/email.queue.js';
import { createEmailLog, deleteEmailLog } from '../../models/email.model.js';
import pool from '../../config/db.js';

export const processUserRegistration = async (userData) => {
      const userExists = await User.findByEmail(userData.email);
      if (userExists) {
            throw new AppError('User already exists', 400);
      }

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(userData.password, salt);
      const { password, ...otherData } = userData;

      const client = await pool.connect();

      try {
            await client.query('BEGIN');

            const user = await createUser({
                  ...otherData,
                  password_hash: hash,
                  client
            });

            const { plan_id, price_id } = await Plan.getPlanIdAndPlanPriceIdForFreePlan();

            const subscription = await createSubscription({
                  user_id: user.id,
                  plan_id,
                  plan_price_id: price_id,
                  source: "sign_up_free_auto",
                  client
            });

            const emailLog = await createEmailLog({
                  userId: user.id,
                  type: "welcome email",
                  email: user.email,
                  client
            });

            await client.query('COMMIT');

            try {
                  await emailQueue.add(
                        "email",
                        {
                              email: emailLog.recipient_email,
                              userId: user.id,
                              type: emailLog.type,
                              name: user.name,
                              emailLogId: emailLog.id
                        },
                        {
                              attempts: 3,
                              backoff: { type: "exponential", delay: 1000 },
                              removeOnComplete: { age: 3600, count: 100 },
                              removeOnFail: { age: 86400, count: 50 }
                        }
                  );
            } catch (queueError) {
                  console.error(`Failed to queue welcome email for user ${user.id}:`, queueError);
            }

            return { user, subscription };

      } catch (dbError) {
            console.error("DEBUGGING ACTUAL TRANSACTION ERROR:", dbError);

            if (client) {
                  await client.query('ROLLBACK');
            }

            if (dbError instanceof AppError) throw dbError;
            throw new AppError("Registration failed. Please try again.", 500);

      } finally {
            client.release();
      }
};

export const processLoginUser = async ({ email, password }) => {
      const user = await User.findByEmail(email);

      if (!user) {
            throw new AppError('Invalid email or password', 401);
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);

      if (!isMatch) {
            throw new AppError('Invalid email or password', 401);
      }

      const token = signToken({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
      });

      const safeUser = { ...user };
      delete safeUser.password_hash;

      return { user: safeUser, token: token };
}
