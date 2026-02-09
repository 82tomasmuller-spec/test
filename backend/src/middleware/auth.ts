import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import config from '../config/config';

export interface AuthRequest extends Request {
  user?: User;
  userId?: number;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Přístup zamítnut. Token nebyl poskytnut.' });
    }

    const decoded = jwt.verify(token, config.jwt.secret) as { userId: number };

    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Uživatel nenalezen.' });
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Neplatný token.' });
  }
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret) as { userId: number };
      const user = await User.findByPk(decoded.userId);

      if (user) {
        req.user = user;
        req.userId = user.id;
      }
    }

    next();
  } catch (error) {
    next();
  }
};

export default { authenticate, optionalAuth };
