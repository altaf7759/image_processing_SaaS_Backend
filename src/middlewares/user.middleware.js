import { User } from '../models/user.models.js';
import AppError from '../utils/AppError.js';
import { verifyToken } from '../utils/jwt.js';

export const validateToken = async (req, res, next) => {
      try {
            let token;

            if (req.cookies && req.cookies.jwt) {
                  token = req.cookies.jwt;
            }
            else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
                  token = req.headers.authorization.split(" ")[1];
            }

            if (!token) {
                  throw new AppError('Unauthorized: No token provided', 401);
            }

            const decoded = verifyToken(token);

            const subscription = await User.findActivePlanByUserId(decoded.id);

            if (!subscription) {
                  throw new AppError("Subscription not found", 404);
            }

            req.user = {
                  id: decoded.id,
                  name: decoded.name,
                  email: decoded.email,
                  role: decoded.role,
                  subscription,
            }

            next();
      } catch (error) {
            next(error);
      }
};

export const validateRole = (...roles) => {
      return (req, res, next) => {
            if (!req.user) {
                  throw new AppError('Unauthorized: No user information found', 401);
            }

            if (!roles.includes(req.user.role)) {
                  throw new AppError(`Access denied. Required role: ${roles.join(" or ")}`, 403);
            }

            next();
      };
};