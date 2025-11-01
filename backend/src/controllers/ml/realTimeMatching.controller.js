import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import realTimeMatching from '../../services/realTimeCosineMatching.service.js';
import notificationService from '../../services/notifications.service.js';
import { LostPost } from '../../models/lostPost.model.js';
import { FoundPost } from '../../models/foundPost.model.js'; // Ensure FoundPost is imported for the second handler

// Find real-time matches for a lost post (searches database)
export const findRealTimeMatchesForLostPost = asyncHandler(async (req, res) => {
    const { lostPostId } = req.params;
    const { 
        limit = 10, 
        minScore = 0.1 
    } = req.query;

    if (!lostPostId) {
        throw new ApiError(400, "Lost post ID is required");
    }

    // 1. Fetch the lost post to get the owner's ID
    const queryPost = await LostPost.findById(lostPostId).select('user').lean();
    if (!queryPost) {
        throw new ApiError(404, "Lost post not found");
    }
    const excludeUserId = queryPost.user;

    const matches = await realTimeMatching.findMatchesForLostPost(lostPostId, {
        limit: parseInt(limit),
        minScore: parseFloat(minScore),
        // 2. Pass the owner ID to exclude their found posts
        excludeUserId 
    });

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
            searchMethod: 'real_time_cosine_similarity'
        }, "Real-time matches for lost post found successfully")
    );
});

// Find real-time matches for a found post (searches database)
export const findRealTimeMatchesForFoundPost = asyncHandler(async (req, res) => {
    const { foundPostId } = req.params;
    const { 
        limit = 10, 
        minScore = 0.1 
    } = req.query;

    if (!foundPostId) {
        throw new ApiError(400, "Found post ID is required");
    }

    // 1. Fetch the found post to get the owner's ID
    const queryPost = await FoundPost.findById(foundPostId).select('user').lean();
    if (!queryPost) {
        throw new ApiError(404, "Found post not found");
    }
    const excludeUserId = queryPost.user;

    const matches = await realTimeMatching.findMatchesForFoundPost(foundPostId, {
        limit: parseInt(limit),
        minScore: parseFloat(minScore),
        // 2. Pass the owner ID to exclude their lost posts
        excludeUserId 
    });

    return res.status(200).json(
        new ApiResponse(200, {
            queryPostId: foundPostId,
            searchType: 'found_to_lost',
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
                    type: 'lost',
                    images: match.post.images,
                    createdAt: match.post.createdAt
                },
                score: match.score,
                confidence: match.confidence,
                breakdown: match.breakdown
            })),
            totalMatches: matches.length,
            searchMethod: 'real_time_cosine_similarity'
        }, "Real-time matches for found post found successfully")
    );
});

// Search posts by text query (real-time database search)
export const searchPostsByText = asyncHandler(async (req, res) => {
    const { query, type = 'both', limit = 10, minScore = 0.1 } = req.query;

    if (!query) {
        throw new ApiError(400, "Search query is required");
    }

    // NOTE: This search doesn't involve a specific post, so no self-exclusion is needed here.
    // If you wanted to exclude the currently logged-in user's posts, you would check req.user?._id
    // and pass it to the searchPostsByText service call.

    const results = await realTimeMatching.searchPostsByText(query, type, {
        limit: parseInt(limit),
        minScore: parseFloat(minScore)
    });

    return res.status(200).json(
        new ApiResponse(200, {
            query,
            searchType: type,
            results: results.map(result => ({
                post: {
                    id: result.post._id,
                    title: result.post.title,
                    description: result.post.description,
                    category: result.post.category,
                    location: result.post.locationFound || result.post.locationLost,
                    date: result.post.foundDate || result.post.lostDate,
                    itemName: result.post.itemName,
                    user: result.post.user,
                    type: result.type,
                    images: result.post.images,
                    createdAt: result.post.createdAt,
                    // Include status fields
                    isReturned: result.post.isReturned,
                    isFound: result.post.isFound
                },
                score: result.score,
                confidence: result.confidence
            })),
            totalResults: results.length,
            searchMethod: 'cosine_similarity_text_search'
        }, "Text search completed successfully")
    );
});

// Get similar posts by category (real-time)
export const getSimilarPostsByCategory = asyncHandler(async (req, res) => {
    const { category, type = 'both', limit = 10 } = req.query;

    if (!category) {
        throw new ApiError(400, "Category is required");
    }

    // You would typically get the currently authenticated user's ID from req.user?._id
    // to exclude their own posts here as well. Assuming req.user is available via middleware.
    const excludeUserId = req.user?._id; 

    let posts = [];
    const baseQuery = { 
        category: { $regex: category, $options: 'i' }
    };

    if (excludeUserId) {
        baseQuery.user = { $ne: excludeUserId };
    }

    if (type === 'both') {
        const [foundPosts, lostPosts] = await Promise.all([
            FoundPost.find({ 
                ...baseQuery,
                isReturned: false 
            })
            .populate('user', 'fullName email')
            .limit(parseInt(limit))
            .lean(),
            LostPost.find({ 
                ...baseQuery,
                isFound: false 
            })
            .populate('user', 'fullName email')
            .limit(parseInt(limit))
            .lean()
        ]);
        posts = [...foundPosts, ...lostPosts];
    } else if (type === 'found') {
        posts = await FoundPost.find({ 
            ...baseQuery,
            isReturned: false 
        })
        .populate('user', 'fullName email')
        .limit(parseInt(limit))
        .lean();
    } else if (type === 'lost') {
        posts = await LostPost.find({ 
            ...baseQuery,
            isFound: false 
        })
        .populate('user', 'fullName email')
        .limit(parseInt(limit))
        .lean();
    }

    return res.status(200).json(
        new ApiResponse(200, {
            category,
            type,
            posts: posts.map(post => ({
                id: post._id,
                title: post.title,
                description: post.description,
                category: post.category,
                location: post.locationFound || post.locationLost,
                date: post.foundDate || post.lostDate,
                itemName: post.itemName,
                user: post.user,
                type: post.locationFound ? 'found' : 'lost',
                images: post.images,
                createdAt: post.createdAt
            })),
            totalPosts: posts.length
        }, "Similar posts by category fetched successfully")
    );
});


//finding matches and sending notifications 
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

    const lostPost = await LostPost.findById(lostPostId).populate('user', 'email fullName notificationPreferences').lean();

    if (!lostPost) {
        throw new ApiError(404, "Lost post not found");
    }

    const excludeUserId = lostPost.user._id;

    const matches = await realTimeMatching.findMatchesForLostPost(lostPostId, {
        limit: parseInt(limit),
        minScore: parseFloat(minScore),
        excludeUserId // Pass the owner ID here
    });

    // Send notifications for good matches
    if (sendNotifications && matches.length > 0) {
        try {
            // NOTE: We already fetched lostPost above, now we just use it
            
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
