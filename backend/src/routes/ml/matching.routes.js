import { Router } from 'express';
import {
    initializeMatchingEngine,
    findPostMatches,
    refreshMatchingEngine,
    getMatchingEngineStatus,
    autoMatchNewPost
} from '../controllers/matching.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Apply JWT verification to all routes
router.use(authenticate);

router.post('/initialize', initializeMatchingEngine);
router.get('/status', getMatchingEngineStatus);
router.post('/refresh', refreshMatchingEngine);
router.get('/post/:postId', findPostMatches);
router.post('/auto-match', autoMatchNewPost);

export default router;