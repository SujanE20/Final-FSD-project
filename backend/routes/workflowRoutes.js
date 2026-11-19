import { Router } from 'express';
import {
  createWorkflow,
  deleteWorkflow,
  getWorkflow,
  listWorkflows,
  triggerWorkflow,
  updateWorkflow,
  validateWorkflow,
} from '../controllers/workflowController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
router.use(requireAuth);
router.get('/', listWorkflows);
router.post('/', createWorkflow);
router.post('/validate', validateWorkflow);
router.get('/:id', getWorkflow);
router.put('/:id', updateWorkflow);
router.delete('/:id', deleteWorkflow);
router.post('/:id/trigger', triggerWorkflow);

export default router;
