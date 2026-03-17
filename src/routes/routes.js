import express from 'express';
import authRoutes from '../models/auth/auth.routes.js';



const router = express.Router();
router.use('/auth', authRoutes);
router.use('/user')

export default router;