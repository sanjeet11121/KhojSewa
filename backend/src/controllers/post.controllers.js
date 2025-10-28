import { FoundPost } from "../models/foundPost.model.js";
import { LostPost } from "../models/lostPost.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, uploadBufferToCloudinary } from "../utils/cloudinary.js";

// Common utility functions
const validatePostOwnership = (post, userId) => {
    if (post.user.toString() !== userId.toString()) {
        throw new ApiError(403, "You don't have permission to modify this post");
    }
};

// Found Post Controllers
const createFoundPost = asyncHandler(async(req, res) => {
    console.log('FoundPost req.body:', req.body);
    console.log('FoundPost req.files:', req.files);
    
    const { 
        title, 
        description, 
        locationFound, 
        foundDate, 
        category,
        location // This comes as a JSON string from FormData
    } = req.body;
    
    const userId = req.user._id;

    if (!title || !description || !locationFound || !foundDate || !category) {
        throw new ApiError(400, "All fields are required");
    }

    // FIX: Parse location from string to object
    let locationData;
    try {
        locationData = typeof location === 'string' ? JSON.parse(location) : location;
        console.log('🔍 Parsed location data:', locationData);
    } catch (parseError) {
        console.error('❌ Error parsing location:', parseError);
        throw new ApiError(400, "Invalid location data format");
    }

    // Validate location data AFTER parsing
    if (!locationData || !locationData.coordinates || locationData.coordinates.length !== 2) {
        console.log('❌ Location validation failed:', locationData);
        throw new ApiError(400, "Please select a location on the map");
    }

    // Accept up to 3 images
    if (!req.files || req.files.length === 0) {
        throw new ApiError(400, "At least one image is required for found posts");
    }
    if (req.files.length > 3) {
        throw new ApiError(400, "Maximum 3 images allowed");
    }

    // Upload all images to Cloudinary
    const imageUrls = [];
    for (const file of req.files) {
        try {
            const cloudinaryResponse = await uploadBufferToCloudinary(file.buffer, file.originalname);
            if (!cloudinaryResponse || !cloudinaryResponse.url) {
                throw new Error('Cloudinary upload failed');
            }
            imageUrls.push(cloudinaryResponse.url);
        } catch (err) {
            console.error('Error uploading image to Cloudinary:', err);
            throw new ApiError(500, "Image upload failed. Please try again.");
        }
    }

    console.log('FoundPost images to save:', req.files.map(f => f.originalname), 'Cloudinary URLs:', imageUrls);

    const post = await FoundPost.create({
        title,
        description,
        images: imageUrls,
        locationFound, // Keep original text field for backward compatibility
        location: {    // New GeoJSON location field
            type: 'Point',
            coordinates: locationData.coordinates, // [longitude, latitude]
            address: locationData.address,
            addressDetails: locationData.addressDetails
        },
        foundDate,
        category: category.toLowerCase(),
        user: userId
    });
    
    console.log('✅ Saved found post:', post._id);

    return res.status(201).json(
        new ApiResponse(201, post, "Found post created successfully")
    );
});
// Lost Post Controllers
const createLostPost = asyncHandler(async(req, res) => {
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    
    const { 
        title, 
        description, 
        locationLost, 
        lostDate, 
        category,
        location // This comes as a JSON string from FormData
    } = req.body;
    
    const userId = req.user._id;

    if (!title || !description || !locationLost || !lostDate) {
        throw new ApiError(400, "All fields are required");
    }

    // FIX: Parse location from string to object
    let locationData;
    try {
        locationData = typeof location === 'string' ? JSON.parse(location) : location;
        console.log('🔍 Parsed location data:', locationData);
    } catch (parseError) {
        console.error('❌ Error parsing location:', parseError);
        throw new ApiError(400, "Invalid location data format");
    }

    // Validate location data AFTER parsing
    if (!locationData || !locationData.coordinates || locationData.coordinates.length !== 2) {
        console.log('❌ Location validation failed:', locationData);
        throw new ApiError(400, "Please select a location on the map");
    }

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
        for (const file of req.files) {
            const cloudinaryResponse = await uploadBufferToCloudinary(file.buffer, file.originalname);
            if (cloudinaryResponse && cloudinaryResponse.url) {
                imageUrls.push(cloudinaryResponse.url);
            }
        }
    }

    const post = await LostPost.create({
        title,
        description,
        images: imageUrls,
        locationLost, // Keep original text field for backward compatibility
        location: {   // New GeoJSON location field
            type: 'Point',
            coordinates: locationData.coordinates, // [longitude, latitude]
            address: locationData.address,
            addressDetails: locationData.addressDetails
        },
        lostDate,
        category: category || 'Other',
        user: userId
    });
    
    console.log('✅ Created lost post:', post._id);

    return res.status(201).json(
        new ApiResponse(201, post, "Lost post created successfully")
    );
});

// Common Post Operations
const getPostById = asyncHandler(async(req, res) => {
    const { postId, type } = req.params;

    let post;
    if (type === 'found') {
        post = await FoundPost.findById(postId)
            .populate('user', 'fullName username email avatar')
            .populate('likes', 'username avatar')
            .populate('claims.user', 'username avatar');
    } else if (type === 'lost') {
        post = await LostPost.findById(postId)
            .populate('user', 'fullName username email avatar')
            .populate('likes', 'username avatar')
            .populate('claims.user', 'username avatar');
    } else {
        throw new ApiError(400, "Invalid post type");
    }

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    return res.status(200).json(
        new ApiResponse(200, post, "Post retrieved successfully")
    );
});

const deletePost = asyncHandler(async(req, res) => {
    const { postId, type } = req.params;
    const userId = req.user._id;

    let post;
    if (type === 'found') {
        post = await FoundPost.findById(postId);
    } else if (type === 'lost') {
        post = await LostPost.findById(postId);
    } else {
        throw new ApiError(400, "Invalid post type");
    }

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    validatePostOwnership(post, userId);

    if (type === 'found') {
        await FoundPost.findByIdAndDelete(postId);
    } else {
        await LostPost.findByIdAndDelete(postId);
    }

    return res.status(200).json(
        new ApiResponse(200, null, "Post deleted successfully")
    );
});

// Claim Management
const createClaim = asyncHandler(async(req, res) => {
    const { postId, type } = req.params;
    const { message } = req.body;
    const userId = req.user._id;

    let post;
    if (type === 'found') {
        post = await FoundPost.findById(postId);
    } else if (type === 'lost') {
        post = await LostPost.findById(postId);
    } else {
        throw new ApiError(400, "Invalid post type");
    }

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    // Check if user already has a pending claim
    const existingClaim = post.claims.find(function(claim) {
        return claim.user.toString() === userId.toString() && claim.status === 'pending';
    });

    if (existingClaim) {
        throw new ApiError(400, "You already have a pending claim for this post");
    }

    post.claims.push({
        user: userId,
        message: message,
        status: 'pending'
    });

    await post.save();

    return res.status(200).json(
        new ApiResponse(200, post, "Claim submitted successfully")
    );
});

// Get all lost posts for main page
const getAllLostPosts = asyncHandler(async(req, res) => {
    const posts = await LostPost.find({ isFound: false })
        .populate('user', 'fullName email avatar')
        .sort({ createdAt: -1 })
        .limit(10);

    return res.status(200).json(
        new ApiResponse(200, posts, "Lost posts retrieved successfully")
    );
});

// Get all found posts for main page
const getAllFoundPosts = asyncHandler(async(req, res) => {
    const posts = await FoundPost.find({ isReturned: false })
        .populate('user', 'fullName email avatar')
        .sort({ createdAt: -1 })
        .limit(10);

    return res.status(200).json(
        new ApiResponse(200, posts, "Found posts retrieved successfully")
    );
});

// Update Post Controller
const updatePost = asyncHandler(async (req, res) => {
    const { postId, type } = req.params;
    const userId = req.user._id;

    let post;
    if (type === 'found') {
        post = await FoundPost.findById(postId);
    } else if (type === 'lost') {
        post = await LostPost.findById(postId);
    } else {
        throw new ApiError(400, "Invalid post type");
    }

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    validatePostOwnership(post, userId);

    // Update fields
    const updateData = {
        title: req.body.title || post.title,
        description: req.body.description || post.description,
        category: req.body.category || post.category
    };

    // Handle location update
    if (req.body.location) {
        updateData.location = {
            type: 'Point',
            coordinates: req.body.location.coordinates,
            address: req.body.location.address,
            addressDetails: req.body.location.addressDetails
        };
        
        // Also update the text location field
        if (type === 'found') {
            updateData.locationFound = req.body.location.address || post.locationFound;
        } else {
            updateData.locationLost = req.body.location.address || post.locationLost;
        }
    }

    // Handle date update
    if (req.body.foundDate && type === 'found') {
        updateData.foundDate = req.body.foundDate;
    }
    if (req.body.lostDate && type === 'lost') {
        updateData.lostDate = req.body.lostDate;
    }

    // Handle image update
    if (req.files && req.files.length > 0) {
        let imageUrls = [];
        for (const file of req.files) {
            const cloudinaryResponse = await uploadBufferToCloudinary(file.buffer, file.originalname);
            if (cloudinaryResponse && cloudinaryResponse.url) {
                imageUrls.push(cloudinaryResponse.url);
            }
        }
        updateData.images = imageUrls;
    }

    let updatedPost;
    if (type === 'found') {
        updatedPost = await FoundPost.findByIdAndUpdate(postId, updateData, { new: true });
    } else {
        updatedPost = await LostPost.findByIdAndUpdate(postId, updateData, { new: true });
    }

    return res.status(200).json(new ApiResponse(200, updatedPost, "Post updated successfully"));
});

// Get only lost posts for the authenticated user
const getMyLostPosts = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const lostPosts = await LostPost.find({ user: userId })
        .populate('user', 'fullName email avatar')
        .sort({ createdAt: -1 });
    
    return res.status(200).json(
        new ApiResponse(200, lostPosts, "User's lost posts fetched successfully")
    );
});

// Get only found posts for the authenticated user
const getMyFoundPosts = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const foundPosts = await FoundPost.find({ user: userId })
        .populate('user', 'fullName email avatar')
        .sort({ createdAt: -1 });
    
    return res.status(200).json(
        new ApiResponse(200, foundPosts, "User's found posts fetched successfully")
    );
});

// Get all posts (lost and found) for the authenticated user
const getMyPosts = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    const [lostPosts, foundPosts] = await Promise.all([
        LostPost.find({ user: userId })
            .populate('user', 'fullName email avatar')
            .sort({ createdAt: -1 }),
        FoundPost.find({ user: userId })
            .populate('user', 'fullName email avatar')
            .sort({ createdAt: -1 })
    ]);

    // Add type field for frontend filtering
    const lost = lostPosts.map(post => ({ 
        ...post.toObject(), 
        type: 'lost',
        locationData: post.location ? {
            latitude: post.location.coordinates[1],
            longitude: post.location.coordinates[0],
            address: post.location.address
        } : null
    }));
    
    const found = foundPosts.map(post => ({ 
        ...post.toObject(), 
        type: 'found',
        locationData: post.location ? {
            latitude: post.location.coordinates[1],
            longitude: post.location.coordinates[0],
            address: post.location.address
        } : null
    }));

    return res.status(200).json(
        new ApiResponse(200, [...lost, ...found], "User's posts fetched successfully")
    );
});

// New: Find posts near a location
const findPostsNearLocation = asyncHandler(async (req, res) => {
    const { latitude, longitude, radius = 5, type = 'both', limit = 20 } = req.query;

    if (!latitude || !longitude) {
        throw new ApiError(400, "Latitude and longitude are required");
    }

    const coordinates = [parseFloat(longitude), parseFloat(latitude)];
    const maxDistance = parseFloat(radius) * 1000; // Convert km to meters

    let query = {
        location: {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: coordinates
                },
                $maxDistance: maxDistance
            }
        }
    };

    let posts = [];

    if (type === 'both' || type === 'lost') {
        const lostPosts = await LostPost.find({
            ...query,
            isFound: false
        })
        .populate('user', 'fullName email avatar')
        .limit(parseInt(limit))
        .lean();

        posts = [...posts, ...lostPosts.map(post => ({ 
            ...post, 
            type: 'lost',
            locationData: post.location ? {
                latitude: post.location.coordinates[1],
                longitude: post.location.coordinates[0],
                address: post.location.address
            } : null
        }))];
    }

    if (type === 'both' || type === 'found') {
        const foundPosts = await FoundPost.find({
            ...query,
            isReturned: false
        })
        .populate('user', 'fullName email avatar')
        .limit(parseInt(limit))
        .lean();

        posts = [...posts, ...foundPosts.map(post => ({ 
            ...post, 
            type: 'found',
            locationData: post.location ? {
                latitude: post.location.coordinates[1],
                longitude: post.location.coordinates[0],
                address: post.location.address
            } : null
        }))];
    }

    return res.status(200).json(
        new ApiResponse(200, {
            posts,
            searchLocation: { latitude, longitude },
            radius,
            totalResults: posts.length
        }, "Nearby posts found successfully")
    );
});

// New: Get posts with location data for map view
const getPostsForMap = asyncHandler(async (req, res) => {
    const { type = 'both', bounds } = req.query;

    let lostPosts = [];
    let foundPosts = [];

    // Base queries
    const lostQuery = { isFound: false };
    const foundQuery = { isReturned: false };

    // Add bounding box filter if provided
    if (bounds) {
        const { north, south, east, west } = JSON.parse(bounds);
        const bboxFilter = {
            location: {
                $geoWithin: {
                    $box: [
                        [west, south],
                        [east, north]
                    ]
                }
            }
        };
        
        Object.assign(lostQuery, bboxFilter);
        Object.assign(foundQuery, bboxFilter);
    }

    if (type === 'both' || type === 'lost') {
        lostPosts = await LostPost.find(lostQuery)
            .populate('user', 'fullName email avatar')
            .select('title location images category createdAt')
            .lean();
    }

    if (type === 'both' || type === 'found') {
        foundPosts = await FoundPost.find(foundQuery)
            .populate('user', 'fullName email avatar')
            .select('title location images category createdAt')
            .lean();
    }

    const posts = [
        ...lostPosts.map(post => ({
            ...post,
            type: 'lost',
            mapData: post.location ? {
                latitude: post.location.coordinates[1],
                longitude: post.location.coordinates[0],
                address: post.location.address
            } : null
        })),
        ...foundPosts.map(post => ({
            ...post,
            type: 'found',
            mapData: post.location ? {
                latitude: post.location.coordinates[1],
                longitude: post.location.coordinates[0],
                address: post.location.address
            } : null
        }))
    ];

    return res.status(200).json(
        new ApiResponse(200, { posts }, "Posts for map retrieved successfully")
    );
});

// Post Statistics Functions

// Get total posts count for a specific user
const getUserPostStats = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const [totalLostPosts, totalFoundPosts, activeLostPosts, activeFoundPosts] = await Promise.all([
        LostPost.countDocuments({ user: userId }),
        FoundPost.countDocuments({ user: userId }),
        LostPost.countDocuments({ user: userId, isFound: false }),
        FoundPost.countDocuments({ user: userId, isReturned: false })
    ]);

    const totalPosts = totalLostPosts + totalFoundPosts;
    const activePosts = activeLostPosts + activeFoundPosts;

    return res.status(200).json(new ApiResponse(200, {
        userId,
        userInfo: {
            fullName: user.fullName,
            email: user.email,
            joinDate: user.createdAt
        },
        postStats: {
            totalPosts,
            totalLostPosts,
            totalFoundPosts,
            activePosts,
            activeLostPosts,
            activeFoundPosts,
            resolvedPosts: totalPosts - activePosts,
            resolutionRate: totalPosts > 0 ? (((totalPosts - activePosts) / totalPosts) * 100).toFixed(1) : 0
        }
    }, "User post statistics fetched successfully"));
});

// Get top contributors (users with most posts)
const getTopContributors = asyncHandler(async (req, res) => {
    const { limit = 10, timeframe = 'all' } = req.query;
    
    let dateFilter = {};
    if (timeframe !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        switch (timeframe) {
            case 'day':
                startDate.setDate(now.getDate() - 1);
                break;
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                startDate = null;
        }
        
        if (startDate) {
            dateFilter = { createdAt: { $gte: startDate } };
        }
    }

    // Get users with their post counts
    const [lostPostStats, foundPostStats] = await Promise.all([
        LostPost.aggregate([
            { $match: dateFilter },
            { $group: { 
                _id: '$user', 
                lostPosts: { $sum: 1 },
                activeLostPosts: { 
                    $sum: { $cond: [{ $eq: ['$isFound', false] }, 1, 0] } 
                }
            }}
        ]),
        FoundPost.aggregate([
            { $match: dateFilter },
            { $group: { 
                _id: '$user', 
                foundPosts: { $sum: 1 },
                activeFoundPosts: { 
                    $sum: { $cond: [{ $eq: ['$isReturned', false] }, 1, 0] } 
                }
            }}
        ])
    ]);

    // Combine the results
    const userStatsMap = new Map();

    // Process lost posts
    lostPostStats.forEach(stat => {
        userStatsMap.set(stat._id.toString(), {
            userId: stat._id,
            lostPosts: stat.lostPosts,
            foundPosts: 0,
            activeLostPosts: stat.activeLostPosts,
            activeFoundPosts: 0
        });
    });

    // Process found posts and combine
    foundPostStats.forEach(stat => {
        const userId = stat._id.toString();
        if (userStatsMap.has(userId)) {
            const existing = userStatsMap.get(userId);
            existing.foundPosts = stat.foundPosts;
            existing.activeFoundPosts = stat.activeFoundPosts;
        } else {
            userStatsMap.set(userId, {
                userId: stat._id,
                lostPosts: 0,
                foundPosts: stat.foundPosts,
                activeLostPosts: 0,
                activeFoundPosts: stat.activeFoundPosts
            });
        }
    });

    // Convert to array and calculate totals
    const userStats = Array.from(userStatsMap.values()).map(stat => ({
        ...stat,
        totalPosts: stat.lostPosts + stat.foundPosts,
        activePosts: stat.activeLostPosts + stat.activeFoundPosts,
        resolutionRate: (stat.lostPosts + stat.foundPosts) > 0 
            ? (((stat.lostPosts + stat.foundPosts) - (stat.activeLostPosts + stat.activeFoundPosts)) / 
               (stat.lostPosts + stat.foundPosts) * 100).toFixed(1)
            : 0
    }));

    // Sort by total posts and limit
    const topContributors = userStats
        .sort((a, b) => b.totalPosts - a.totalPosts)
        .slice(0, parseInt(limit));

    // Populate user details
    const userIds = topContributors.map(stat => stat.userId);
    const users = await User.find({ _id: { $in: userIds } })
        .select('fullName email avatar isVerified createdAt lastActive');

    // Combine user details with stats
    const contributorsWithDetails = topContributors.map(stat => {
        const user = users.find(u => u._id.toString() === stat.userId.toString());
        return {
            ...stat,
            user: user ? {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                avatar: user.avatar,
                isVerified: user.isVerified,
                joinDate: user.createdAt,
                lastActive: user.lastActive
            } : null
        };
    });

    return res.status(200).json(new ApiResponse(200, {
        timeframe,
        topContributors: contributorsWithDetails,
        totalUsers: userStats.length
    }, "Top contributors fetched successfully"));
});

// Get post statistics for admin dashboard
 const getPostStatistics = asyncHandler(async (req, res) => {
    const { timeframe = 'all' } = req.query;
    
    let dateFilter = {};
    if (timeframe !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        switch (timeframe) {
            case 'today':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                startDate = null;
        }
        
        if (startDate) {
            dateFilter = { createdAt: { $gte: startDate } };
        }
    }

    const [
        totalLostPosts,
        totalFoundPosts,
        activeLostPosts,
        activeFoundPosts,
        newLostPostsToday,
        newFoundPostsToday,
        postsWithClaims,
        resolvedPosts
    ] = await Promise.all([
        LostPost.countDocuments(dateFilter),
        FoundPost.countDocuments(dateFilter),
        LostPost.countDocuments({ ...dateFilter, isFound: false }),
        FoundPost.countDocuments({ ...dateFilter, isReturned: false }),
        LostPost.countDocuments({ 
            createdAt: { 
                $gte: new Date(new Date().setHours(0, 0, 0, 0)) 
            } 
        }),
        FoundPost.countDocuments({ 
            createdAt: { 
                $gte: new Date(new Date().setHours(0, 0, 0, 0)) 
            } 
        }),
        // Posts with at least one claim
        LostPost.countDocuments({ 
            ...dateFilter, 
            'claims.0': { $exists: true } 
        }) + FoundPost.countDocuments({ 
            ...dateFilter, 
            'claims.0': { $exists: true } 
        }),
        // Resolved posts (found items that are returned or lost items that are found)
        LostPost.countDocuments({ ...dateFilter, isFound: true }) + 
        FoundPost.countDocuments({ ...dateFilter, isReturned: true })
    ]);

    const totalPosts = totalLostPosts + totalFoundPosts;
    const activePosts = activeLostPosts + activeFoundPosts;
    const newPostsToday = newLostPostsToday + newFoundPostsToday;

    return res.status(200).json(new ApiResponse(200, {
        timeframe,
        overview: {
            totalPosts,
            totalLostPosts,
            totalFoundPosts,
            activePosts,
            resolvedPosts,
            resolutionRate: totalPosts > 0 ? ((resolvedPosts / totalPosts) * 100).toFixed(1) : 0,
            newPostsToday
        },
        detailed: {
            lostPosts: {
                total: totalLostPosts,
                active: activeLostPosts,
                resolved: totalLostPosts - activeLostPosts,
                resolutionRate: totalLostPosts > 0 ? 
                    (((totalLostPosts - activeLostPosts) / totalLostPosts) * 100).toFixed(1) : 0
            },
            foundPosts: {
                total: totalFoundPosts,
                active: activeFoundPosts,
                resolved: totalFoundPosts - activeFoundPosts,
                resolutionRate: totalFoundPosts > 0 ? 
                    (((totalFoundPosts - activeFoundPosts) / totalFoundPosts) * 100).toFixed(1) : 0
            },
            engagement: {
                postsWithClaims,
                claimRate: totalPosts > 0 ? ((postsWithClaims / totalPosts) * 100).toFixed(1) : 0
            }
        }
    }, "Post statistics fetched successfully"));
});

// Get user posting activity over time
 const getUserPostingActivity = asyncHandler(async (req, res) => {
    const { userId, period = 'month' } = req.query;
    
    let groupByFormat, dateRange;
    const now = new Date();
    
    switch (period) {
        case 'week':
            groupByFormat = '%Y-%m-%d';
            dateRange = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            groupByFormat = '%Y-%m-%d';
            dateRange = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            break;
        case 'year':
            groupByFormat = '%Y-%m';
            dateRange = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            break;
        default:
            groupByFormat = '%Y-%m-%d';
            dateRange = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const matchStage = { 
        createdAt: { $gte: dateRange } 
    };
    
    if (userId) {
        matchStage.user = new mongoose.Types.ObjectId(userId);
    }

    const [lostPostActivity, foundPostActivity] = await Promise.all([
        LostPost.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: groupByFormat, date: "$createdAt" } }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.date": 1 } }
        ]),
        FoundPost.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: groupByFormat, date: "$createdAt" } }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.date": 1 } }
        ])
    ]);

    return res.status(200).json(new ApiResponse(200, {
        period,
        userId: userId || 'all',
        activity: {
            lostPosts: lostPostActivity,
            foundPosts: foundPostActivity
        }
    }, "User posting activity fetched successfully"));
});

export {
    createClaim,
    createFoundPost,
    createLostPost,
    deletePost,
    getPostById,
    getAllLostPosts,
    getAllFoundPosts,
    getMyPosts,
    getMyLostPosts,
    getMyFoundPosts,
    updatePost,
    findPostsNearLocation,
    getPostsForMap,
    getUserPostStats,
    getTopContributors,
    getPostStatistics,
    getUserPostingActivity

};