import { Router } from 'express';
import {
    initializeCosineMatching,
    findCosineMatchesForLostPost,
    findCosineMatchesForFoundPost,
    refreshCosineMatching,
    getCosineMatchingStatus,
    calculateDirectCosineSimilarity
} from '../../controllers/ml/cosineMatching.controller.js'; // <-- fix path here
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

// Apply JWT verification to all routes
router.use(authenticate);

router.post('/initialize', initializeCosineMatching);
router.get('/status', getCosineMatchingStatus);
router.post('/refresh', refreshCosineMatching);
router.get('/lost/:lostPostId', findCosineMatchesForLostPost);
router.get('/found/:foundPostId', findCosineMatchesForFoundPost);
router.post('/direct-similarity', calculateDirectCosineSimilarity);

export default router;