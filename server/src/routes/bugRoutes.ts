import { Router } from 'express';
import { Role } from '@prisma/client';
import authMiddleware from '../middleware/authMiddleware';
import roleMiddleware from '../middleware/roleMiddleware';
import bugController from '../controllers/bugController';
import respond from '../lib/respond';

const router = Router();

router.use(authMiddleware);

router.get(
  '/:projectId/bugs',
  roleMiddleware(Role.MEMBER),
  bugController.getBugs,
  respond
);

router.get(
  '/:projectId/bugs/:bugId',
  roleMiddleware(Role.MEMBER),
  bugController.getBug,
  respond
);

router.post(
  '/:projectId/bugs',
  roleMiddleware(Role.MEMBER),
  bugController.createBug,
  respond
);

router.patch(
  '/:projectId/bugs/:bugId',
  roleMiddleware(Role.MEMBER),
  bugController.updateBug,
  respond
);

router.patch(
  '/:projectId/bugs/:bugId/assign',
  roleMiddleware(Role.MEMBER),
  bugController.assignBug,
  respond
);

router.delete(
  '/:projectId/bugs/:bugId',
  roleMiddleware(Role.MEMBER),
  bugController.deleteBug,
  respond
);

export default router;
