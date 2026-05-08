import bcrypt from 'bcrypt';
import { createUser } from './auth.repository.js';
import { User } from '../../models/user.models.js';
import AppError from '../../utils/AppError.js';
import { signToken } from '../../utils/jwt.js';

export const processUserRegistration = async (userData) => {

      const userExists = await User.findByEmail(userData.email);

      if (userExists) {
            throw new AppError('User already exists', 400);
      }

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(userData.password, salt);

      const { password, ...otherData } = userData;

      return await createUser({
            ...otherData,
            password_hash: hash
      });
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
