import AppError from '../utils/appError.js';
import { verifyToken } from '../utils/jwt.js';

export const validateToken = (req, res, next) => {
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
            req.user = decoded;
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