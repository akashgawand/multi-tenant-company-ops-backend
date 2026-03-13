import express from 'express';
import { register,login } from './auth.controller.js';
import authMiddleware from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = express.Router();


router.post('/register', authMiddleware, requirePermission("user.create") ,register)
router.post('/login',login)



export default router;