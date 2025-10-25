import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import cosineMatchingEngine from '../../services/cosineMatching.service.js';
import notificationService from '../../services/notifications.service.js';
import { FoundPost } from '../../models/foundPost.model.js';
import { LostPost } from '../../models/lostPost.model.js';

// Initialize cosine matching engine
export const initializeCosineMatching = asyncHandler(async (req, res) => {
    const result = await cosineMatchingEngine.initialize();
    
    return res.status(200).json(
        new ApiResponse(200, result, "Cosine matching engine initialized successfully")
    );
});

// Find cosine matches for a lost post
export const findCosineMatchesForLostPost = asyncHandler(async (req, res) => {
    const { lostPostId } = req.params;
    const { 
        limit = 10, 
        minScore = 0.1 
    } = req.query;

    if (!lostPostId) {
        throw new ApiError(400, "Lost post ID is required");
    }

    const matches = await cosineMatchingEngine.findMatchesForLostPost(lostPostId, {
        topK: parseInt(limit),
        minScore: parseFloat(minScore)
    });

    const lostPost = await LostPost.findById(lostPostId)
        .select('title description category locationLost lostDate itemName user')
        .populate('user', 'fullName email');

    return res.status(200).json(
        new ApiResponse(200, {
            queryPost: {
                id: lostPost._id,
                title: lostPost.title,
                type: 'lost',
                category: lostPost.category,
                location: lostPost.locationLost,
                date: lostPost.lostDate,
                user: lostPost.user
            },
            matches: matches.map(match => ({
                post: {
                    id: match.post._id,
                    title: match.post.title,
                    description: match.post.description,
                    category: match.post.category,
                    location: match.post.locationFound,
                    date: match.post.foundDate,
                    itemName: match.post.itemName,
                    user: match.post.user,
                    type: 'found'
                },
                score: match.score,
                confidence: match.confidence,
                breakdown: match.breakdown
            })),
            totalMatches: matches.length,
            matchingAlgorithm: 'cosine_similarity'
        }, "Cosine matches for lost post found successfully")
    );
});

// Find cosine matches for a found post
export const findCosineMatchesForFoundPost = asyncHandler(async (req, res) => {
    const { foundPostId } = req.params;
    const { 
        limit = 10, 
        minScore = 0.1 
    } = req.query;

    if (!foundPostId) {
        throw new ApiError(400, "Found post ID is required");
    }

    const matches = await cosineMatchingEngine.findMatchesForFoundPost(foundPostId, {
        topK: parseInt(limit),
        minScore: parseFloat(minScore)
    });

    const foundPost = await FoundPost.findById(foundPostId)
        .select('title description category locationFound foundDate itemName user')
        .populate('user', 'fullName email');

    return res.status(200).json(
        new ApiResponse(200, {
            queryPost: {
                id: foundPost._id,
                title: foundPost.title,
                type: 'found',
                category: foundPost.category,
                location: foundPost.locationFound,
                date: foundPost.foundDate,
                user: foundPost.user
            },
            matches: matches.map(match => ({
                post: {
                    id: match.post._id,
                    title: match.post.title,
                    description: match.post.description,
                    category: match.post.category,
                    location: match.post.locationLost,
                    date: match.post.lostDate,
                    itemName: match.post.itemName,
                    user: match.post.user,
                    type: 'lost'
                },
                score: match.score,
                confidence: match.confidence,
                breakdown: match.breakdown
            })),
            totalMatches: matches.length,
            matchingAlgorithm: 'cosine_similarity'
        }, "Cosine matches for found post found successfully")
    );
});

// Refresh cosine matching engine
export const refreshCosineMatching = asyncHandler(async (req, res) => {
    await cosineMatchingEngine.refreshTraining();
    
    return res.status(200).json(
        new ApiResponse(200, null, "Cosine matching engine refreshed successfully")
    );
});

// Get cosine matching engine status
export const getCosineMatchingStatus = asyncHandler(async (req, res) => {
    const stats = cosineMatchingEngine.getStats();

    return res.status(200).json(
        new ApiResponse(200, stats, "Cosine matching engine status fetched successfully")
    );
});

// Calculate direct cosine similarity between two posts
export const calculateDirectCosineSimilarity = asyncHandler(async (req, res) => {
    const { postAId, postAType, postBId, postBType } = req.body;

    if (!postAId || !postAType || !postBId || !postBType) {
        throw new ApiError(400, "All post IDs and types are required");
    }

    // Fetch both posts
    const [postA, postB] = await Promise.all([
        postAType === 'lost' 
            ? LostPost.findById(postAId).lean()
            : FoundPost.findById(postAId).lean(),
        postBType === 'lost' 
            ? LostPost.findById(postBId).lean()
            : FoundPost.findById(postBId).lean()
    ]);

    if (!postA || !postB) {
        throw new ApiError(404, "One or both posts not found");
    }

    // Extract features
    const featuresA = textProcessor.extractFeatures(postA, postAType);
    const featuresB = textProcessor.extractFeatures(postB, postBType);

    // Calculate cosine similarity
    const textSimilarity = cosineMatchingEngine.calculateTextSimilarity(featuresA, featuresB);

    return res.status(200).json(
        new ApiResponse(200, {
            postA: { id: postA._id, title: postA.title, type: postAType },
            postB: { id: postB._id, title: postB.title, type: postBType },
            cosineSimilarity: parseFloat(textSimilarity.toFixed(4)),
            interpretation: textSimilarity >= 0.7 ? 'Highly Similar' : 
                           textSimilarity >= 0.4 ? 'Moderately Similar' : 
                           'Low Similarity'
        }, "Direct cosine similarity calculated successfully")
    );
});

export const findRealTimeMatchesAndNotify = asyncHandler(async (req, res) => {
    const { lostPostId } = req.params;
    const { 
        limit = 10, 
        minScore = 0.1,
        sendNotifications = true 
    } = req.query;

    if (!lostPostId) {
        throw new ApiError(400, "Lost post ID is required");
    }

    const matches = await realTimeMatching.findMatchesForLostPost(lostPostId, {
        limit: parseInt(limit),
        minScore: parseFloat(minScore)
    });

    // Send notifications for good matches
    if (sendNotifications && matches.length > 0) {
        try {
            const lostPost = await LostPost.findById(lostPostId)
                .populate('user', 'email fullName notificationPreferences');
            
            // Only send if user has notifications enabled
            if (lostPost.user.notificationPreferences?.email) {
                const notificationMatches = matches.filter(match => match.score > 0.3);
                
                for (const match of notificationMatches) {
                    await notificationService.sendMatchNotification(
                        lostPost,
                        match.post,
                        match.score,
                        'real_time_cosine_similarity'
                    );
                }
            }
        } catch (notificationError) {
            console.error('Failed to send match notifications:', notificationError);
            // Don't fail the request if notifications fail
        }
    }

    return res.status(200).json(
        new ApiResponse(200, {
            queryPostId: lostPostId,
            searchType: 'lost_to_found',
            matches: matches.map(match => ({
                post: {
                    id: match.post._id,
                    title: match.post.title,
                    description: match.post.description,
                    category: match.post.category,
                    location: match.post.locationFound,
                    date: match.post.foundDate,
                    itemName: match.post.itemName,
                    user: match.post.user,
                    type: 'found',
                    images: match.post.images,
                    createdAt: match.post.createdAt
                },
                score: match.score,
                confidence: match.confidence,
                breakdown: match.breakdown
            })),
            totalMatches: matches.length,
            searchMethod: 'real_time_cosine_similarity',
            notificationsSent: sendNotifications
        }, "Real-time matches found and notifications sent successfully")
    );
});