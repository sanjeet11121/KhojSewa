import { FoundPost } from "../models/foundPost.model.js";
import { LostPost } from "../models/lostPost.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Common utility functions
const validatePostOwnership = (post, userId) => {
    if (post.user.toString() !== userId.toString()) {
        throw new ApiError(403, "You don't have permission to modify this post");
    }
};

// Found Post Controllers
const createFoundPost = asyncHandler(async(req, res) => {
    const { title, description, locationFound, foundDate } = req.body;
    const userId = req.user._id;

    if (!title || !description || !locationFound || !foundDate) {
        throw new ApiError(400, "All fields are required");
    }

    if (!req.file) {
        throw new ApiError(400, "Image is required for found posts");
    }

    const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
    const imageUrl = cloudinaryResponse && cloudinaryResponse.url;

    const post = await FoundPost.create({
        title,
        description,
        image: imageUrl,
        locationFound,
        foundDate,
        user: userId
    });

    return res.status(201).json(
        new ApiResponse(201, post, "Found post created successfully")
    );
});

// Lost Post Controllers
const createLostPost = asyncHandler(async(req, res) => {
    const { title, description, locationLost, lostDate } = req.body;
    const userId = req.user._id;

    if (!title || !description || !locationLost || !lostDate) {
        throw new ApiError(400, "All fields are required");
    }

    let imageUrl;
    if (req.file) {
        const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
        imageUrl = cloudinaryResponse && cloudinaryResponse.url;
    }

    const post = await LostPost.create({
        title,
        description,
        image: imageUrl,
        locationLost,
        lostDate,
        user: userId
    });

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
            .populate('user', 'username email avatar')
            .populate('likes', 'username avatar')
            .populate('claims.user', 'username avatar');
    } else if (type === 'lost') {
        post = await LostPost.findById(postId)
            .populate('user', 'username email avatar')
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

export {
    createClaim,
    createFoundPost,
    createLostPost,
    deletePost,
    getPostById
};