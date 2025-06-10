import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../database';
import { config } from '../config';

export const authController = {
  login: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username, password } = req.body;

      // Find user
      const user = await db('users')
        .where({ username })
        .first();

      if (!user || !user.is_active) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Check password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Generate token
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRY }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  me: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    res.json({ message: 'User profile endpoint' });
  }
};
