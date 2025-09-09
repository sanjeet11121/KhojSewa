// src/controllers/recommend.controllers.js (or append to post.controllers.js)
import axios from 'axios';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const ML_SERVICE_URL = 'http://127.0.0.1:9000'; // Adjust for production

export const getRecommendationsForLost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/recommend/lost/${postId}`);
    res.status(200).json(new ApiResponse(200, response.data, 'Recommendations fetched'));
  } catch (error) {
    throw new ApiError(500, 'Failed to fetch recommendations', error.message);
  }
});

export const getRecommendationsForFound = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/recommend/found/${postId}`);
    res.status(200).json(new ApiResponse(200, response.data, 'Recommendations fetched'));
  } catch (error) {
    throw new ApiError(500, 'Failed to fetch recommendations', error.message);
  }
});