import { Router } from 'express';
import { updateProfile } from '../controllers/settingsController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
router.patch('/profile', requireAuth, updateProfile);

export default router;
