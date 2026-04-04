import { Router } from 'express';
import { handleAIChat, handleKpiInsight, handleDashboardInsights } from '../controllers/ai.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Apply authentication middleware to all AI routes
router.use(verifyJWT);

// Routes
router.post('/chat', handleAIChat);
router.post('/kpi-insight', handleKpiInsight);
router.post('/dashboard-insights', handleDashboardInsights);

export default router;
