import { Router, Request, Response } from 'express';
import { authController } from '../controllers/authController';

const router = Router();

// Auth routes
router.post('/auth/login', authController.login);
router.get('/auth/me', authController.me);

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default router;
