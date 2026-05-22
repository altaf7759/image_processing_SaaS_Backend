import bcrypt from 'bcrypt';
import { createUser } from './auth.repository.js';
import { User } from '../../models/user.models.js';
import AppError from '../../utils/AppError.js';
import { signToken } from '../../utils/jwt.js';
import { Plan } from '../../models/plan.models.js';
import { createSubscription } from '../subscriptions/subscription.repository.js';

export const processUserRegistration = async (userData) => {

      const userExists = await User.findByEmail(userData.email);

      if (userExists) {
            throw new AppError('User already exists', 400);
      }

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(userData.password, salt);

      const { password, ...otherData } = userData;

      const user = await createUser({
            ...otherData,
            password_hash: hash
      });

      const { plan_id, price_id } = await Plan.getPlanIdAndPlanPriceIdForFreePlan()

      const subscription = await createSubscription({
            user_id: user.id,
            plan_id,
            plan_price_id: price_id,
            source: "sign_up_free_auto"
      })

      return { user, subscription }
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
