import jwt from 'jsonwebtoken';
import config from '../config/config';

export const generateToken = (userId: number): string => {
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

export const verifyToken = (token: string): { userId: number } => {
  return jwt.verify(token, config.jwt.secret) as { userId: number };
};

export default { generateToken, verifyToken };
