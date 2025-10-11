// Get only lost posts for the authenticated user
const getMyLostPosts = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const lostPosts = await LostPost.find({ user: userId });
    return res.status(200).json(new ApiResponse(200, lostPosts, "User's lost posts fetched successfully"));
});

// Get only found posts for the authenticated user
const getMyFoundPosts = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const foundPosts = await FoundPost.find({ user: userId });
    return res.status(200).json(new ApiResponse(200, foundPosts, "User's found posts fetched successfully"));
});
// Get all posts (lost and found) for the authenticated user
const getMyPosts = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const lostPosts = await LostPost.find({ user: userId });
    const foundPosts = await FoundPost.find({ user: userId });
    // Add type field for frontend filtering
    const lost = lostPosts.map(post => ({ ...post.toObject(), type: 'lost' }));
    const found = foundPosts.map(post => ({ ...post.toObject(), type: 'found' }));
    return res.status(200).json(new ApiResponse(200, [...lost, ...found], "User's posts fetched successfully"));
});
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
    // Debug log: print req.body and req.files
    console.log('FoundPost req.body:', req.body);
    console.log('FoundPost req.files:', req.files);
    const { title, description, locationFound, foundDate, category } = req.body;
    const userId = req.user._id;

    if (!title || !description || !locationFound || !foundDate || !category) {
        throw new ApiError(400, "All fields are required");
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
    // Log after imageUrls is initialized and populated
    console.log('FoundPost images to save:', req.files.map(f => f.originalname), 'Cloudinary URLs:', imageUrls);

    const post = await FoundPost.create({
        title,
        description,
        images: imageUrls,
        locationFound,
        foundDate,
        category: category.toLowerCase(),
        user: userId
    });
    console.log('Saved found post:', post);

    return res.status(201).json(
        new ApiResponse(201, post, "Found post created successfully")
    );
});

// Lost Post Controllers
const createLostPost = asyncHandler(async(req, res) => {
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    
    // Extract fields with correct names from request body
    const { title, description, locationLost, lostDate, category } = req.body;
    const userId = req.user._id;

    if (!title || !description || !locationLost || !lostDate) {
        throw new ApiError(400, "All fields are required");
    }

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
        for (const file of req.files) {
            // Upload buffer directly to Cloudinary
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
        locationLost,
        lostDate,
        category: category || 'Other',
        user: userId
    });
    
    console.log('Created post:', post);

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
    if (type === 'found') {
        post.title = req.body.title || post.title;
        post.description = req.body.description || post.description;
        post.locationFound = req.body.locationFound || post.locationFound;
        post.foundDate = req.body.foundDate || post.foundDate;
        post.category = req.body.category || post.category;
        // Handle image update
        if (req.file) {
            const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
            post.image = cloudinaryResponse && cloudinaryResponse.url ? cloudinaryResponse.url : post.image;
        }
    } else {
        post.title = req.body.title || post.title;
        post.description = req.body.description || post.description;
        post.locationLost = req.body.locationLost || post.locationLost;
        post.lostDate = req.body.lostDate || post.lostDate;
        post.category = req.body.category || post.category;
        // Handle images update
        if (req.files && req.files.length > 0) {
            let imageUrls = [];
            for (const file of req.files) {
                const cloudinaryResponse = await uploadBufferToCloudinary(file.buffer, file.originalname);
                if (cloudinaryResponse && cloudinaryResponse.url) {
                    imageUrls.push(cloudinaryResponse.url);
                }
            }
            post.images = imageUrls;
        }
    }

    await post.save();
    return res.status(200).json(new ApiResponse(200, post, "Post updated successfully"));
});

export {
    createClaim,
    createFoundPost,
    createLostPost,
    deletePost,
    getPostById,
    getAllLostPosts,
    getMyPosts,
    getMyLostPosts,
    getMyFoundPosts,
    updatePost
};