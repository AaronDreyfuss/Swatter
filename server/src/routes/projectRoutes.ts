import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware';
import projectController from '../controllers/projectController';

const router = Router();

router.use(authMiddleware);

router.post(
  '/',
  projectController.createProject,
  (_req, res) => res.status(res.locals.status as number).json(res.locals.data)
);

export default router;
