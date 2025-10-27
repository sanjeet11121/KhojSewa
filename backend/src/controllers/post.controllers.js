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
    getPostsForMap
};