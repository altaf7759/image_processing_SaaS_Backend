import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET

export function signToken(payload) {
      return jwt.sign(
            { id: payload.id, name: payload.name, email: payload.email, role: payload.role },
            JWT_SECRET,
            { expiresIn: '24h' }
      );
};

export function verifyToken(token) {
      return jwt.verify(token, JWT_SECRET);
};