import { Router } from 'express';
import {
    findRealTimeMatchesForLostPost,
    findRealTimeMatchesForFoundPost,
    searchPostsByText,
    getSimilarPostsByCategory
} from '../../controllers/ml/realTimeMatching.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

// Apply JWT verification to all routes
router.use(authenticate);

// Real-time matching routes
router.get('/lost/:lostPostId', findRealTimeMatchesForLostPost);
router.get('/found/:foundPostId', findRealTimeMatchesForFoundPost);

// Search routes
router.get('/search', searchPostsByText);
router.get('/similar/category', getSimilarPostsByCategory);

export default router;