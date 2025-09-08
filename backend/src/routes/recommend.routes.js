// src/routes/post.routes.js (or a new recommend.routes.js)
import express from 'express';
import { getRecommendationsForLost, getRecommendationsForFound } from '../controllers/recommend.controllers.js';

const recommendRouter = express.Router();

recommendRouter.get('/recommend/lost/:postId', getRecommendationsForLost);
recommendRouter.get('/recommend/found/:postId', getRecommendationsForFound);

export default recommendRouter;