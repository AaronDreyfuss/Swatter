import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import authController from '../controllers/authController';
import respond from '../lib/respond';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skip: () => process.env.NODE_ENV === 'test', // prevent test suite from hitting rate limit
});

router.post(
  '/register',
  authLimiter,
  authController.register,
  respond
);

router.post(
  '/login',
  authLimiter,
  authController.login,
  respond
);

router.post(
  '/verify',
  authController.verify,
  respond
);

router.post(
  '/resend-code',
  authController.resendCode,
  respond
);

export default router;
