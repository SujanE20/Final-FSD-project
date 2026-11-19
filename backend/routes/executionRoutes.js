import { Router } from 'express';
import { getExecution, listExecutions } from '../controllers/executionController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
router.use(requireAuth);
router.get('/', listExecutions);
router.get('/:id', getExecution);

export default router;
