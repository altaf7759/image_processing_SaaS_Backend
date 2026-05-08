import bcrypt from 'bcrypt';
import { processUserRegistration, processLoginUser } from './auth.service.js';

export const registerUser = async (req, res, next) => {
      try {
            const user = await processUserRegistration(req.body);

            res.status(201).json({ message: 'User registered successfully', user });
      } catch (error) {
            console.error('Error registering user:', error);
            next(error);
      }
};

export async function loginUser(req, res, next) {
      try {
            const { user, token } = await processLoginUser(req.body);

            res.cookie('jwt', token, {
                  httpOnly: true,
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'strict',
                  maxAge: 24 * 60 * 60 * 1000
            });

            res.status(200).json({
                  success: true,
                  message: "Logged in successfully",
                  user
            });
      } catch (error) {
            next(error);
      }
}