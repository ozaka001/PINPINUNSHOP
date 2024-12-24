import express from 'express';
import { getDashboardStatsHandler, getRecentOrdersHandler, getSalesDataHandler, getVisitorDataHandler } from '../controllers/dashboardController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Protect all dashboard routes with authentication and admin middleware
router.use(auth.auth, auth.adminAuth);

router.get('/stats', getDashboardStatsHandler);
router.get('/orders', getRecentOrdersHandler);
router.get('/sales', getSalesDataHandler);
router.get('/visitors', getVisitorDataHandler);

export default router;
