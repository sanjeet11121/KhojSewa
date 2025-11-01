import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import matchingEngine from '../services/matchingEngine.service.js';
import { Post } from '../models/post.model.js';

// Initialize matching engine
export const initializeMatchingEngine = asyncHandler(async (req, res) => {
    const result = await matchingEngine.initialize();
    
    return res.status(200).json(
        new ApiResponse(200, result, "Matching engine initialized successfully")
    );
});

// Find matches for a post
export const findPostMatches = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { 
        limit = 10, 
        type = 'cross',
        minScore = 0.1 
    } = req.query;

    if (!postId) {
        throw new ApiError(400, "Post ID is required");
    }

    // Fetch the post, ensuring the 'user' field is selected to get the owner ID
    const post = await Post.findById(postId).select('+user');
    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    // CRITICAL: Extract the owner's ID for exclusion
    const excludeUserId = post.user;

    const options = {
        topK: parseInt(limit),
        minScore: parseFloat(minScore),
        excludeUserId: excludeUserId // Pass the owner ID to the engine
    };

    let matches;
    if (type === 'cross') {
        matches = matchingEngine.findCrossTypeMatches(post, options);
    } else {
        matches = matchingEngine.findMatches(post, options);
    }

    return res.status(200).json(
        new ApiResponse(200, {
            queryPost: {
                id: post._id,
                title: post.title,
                type: post.type,
                category: post.category,
                location: post.location
            },
            matches: matches.map(match => ({
                post: {
                    id: match.post._id,
                    title: match.post.title,
                    description: match.post.description,
                    category: match.post.category,
                    location: match.post.location,
                    type: match.post.type,
                    date: match.post.date,
                    createdAt: match.post.createdAt
                },
                score: match.score,
                breakdown: match.breakdown
            })),
            totalMatches: matches.length
        }, "Matches found successfully")
    );
});

// Refresh matching engine training
export const refreshMatchingEngine = asyncHandler(async (req, res) => {
    await matchingEngine.refreshTraining();
    
    return res.status(200).json(
        new ApiResponse(200, null, "Matching engine refreshed successfully")
    );
});

// Get matching engine status
export const getMatchingEngineStatus = asyncHandler(async (req, res) => {
    const status = {
        isTrained: matchingEngine.isTrained,
        totalPosts: matchingEngine.posts.length,
        lastTraining: new Date().toISOString()
    };

    return res.status(200).json(
        new ApiResponse(200, status, "Matching engine status fetched successfully")
    );
});

// Auto-match for new posts
export const autoMatchNewPost = asyncHandler(async (req, res) => {
    const { postId } = req.body;

    if (!postId) {
        throw new ApiError(400, "Post ID is required");
    }

    // Fetch the post, ensuring the 'user' field is selected to get the owner ID
    const post = await Post.findById(postId).select('+user');
    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    // CRITICAL: Extract the owner's ID for exclusion
    const excludeUserId = post.user;

    // Ensure engine is trained
    if (!matchingEngine.isTrained) {
        await matchingEngine.initialize();
    }

    const options = { 
        topK: 5,
        excludeUserId: excludeUserId // Pass the owner ID to the engine
    };

    const matches = matchingEngine.findCrossTypeMatches(post, options);

    return res.status(200).json(
        new ApiResponse(200, {
            postId: post._id,
            matches: matches.map(match => ({
                postId: match.post._id,
                score: match.score,
                confidence: match.score > 0.7 ? 'high' : match.score > 0.4 ? 'medium' : 'low'
            })),
            topMatch: matches.length > 0 ? matches[0] : null
        }, "Auto-matching completed successfully")
    );
});
