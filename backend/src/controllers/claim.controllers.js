import { FoundPost } from "../models/foundPost.model.js";
import { LostPost } from "../models/lostPost.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create a new claim
const createClaim = asyncHandler(async (req, res) => {
    const { postId, postType, message } = req.body;
    const userId = req.user._id;

    if (!postId || !postType || !message) {
        throw new ApiError(400, "Post ID, post type, and message are required");
    }

    let post;
    if (postType === 'found') {
        post = await FoundPost.findById(postId);
    } else if (postType === 'lost') {
        post = await LostPost.findById(postId);
    } else {
        throw new ApiError(400, "Invalid post type");
    }

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    // Check if user is trying to claim their own post
    if (post.user.toString() === userId.toString()) {
        throw new ApiError(400, "You cannot claim your own post");
    }

    // Check if user already has a pending claim
    const existingClaim = post.claims.find(claim => 
        claim.user.toString() === userId.toString() && claim.status === 'pending'
    );

    if (existingClaim) {
        throw new ApiError(400, "You already have a pending claim for this post");
    }

    // Add the claim
    post.claims.push({
        user: userId,
        message: message.trim(),
        status: 'pending'
    });

    await post.save();

    // Populate the new claim with user info
    const updatedPost = await (postType === 'found' ? FoundPost : LostPost)
        .findById(postId)
        .populate('claims.user', 'fullName username email avatar');

    const newClaim = updatedPost.claims[updatedPost.claims.length - 1];

    return res.status(201).json(
        new ApiResponse(201, newClaim, "Claim submitted successfully")
    );
});

// Get claims for a specific post
const getPostClaims = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { type = 'found' } = req.query;
    const userId = req.user._id;

    let post;
    if (type === 'found') {
        post = await FoundPost.findById(postId)
            .populate('claims.user', 'fullName username email avatar verified');
    } else if (type === 'lost') {
        post = await LostPost.findById(postId)
            .populate('claims.user', 'fullName username email avatar verified');
    } else {
        throw new ApiError(400, "Invalid post type");
    }

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    // Check if user owns the post (for security)
    if (post.user.toString() !== userId.toString()) {
        throw new ApiError(403, "You don't have permission to view claims for this post");
    }

    return res.status(200).json(
        new ApiResponse(200, post.claims, "Post claims retrieved successfully")
    );
});

// Update claim status
const updateClaimStatus = asyncHandler(async (req, res) => {
    const { claimId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
        throw new ApiError(400, "Invalid status. Must be 'approved', 'rejected', or 'pending'");
    }

    // Find the post that contains this claim
    let post = await FoundPost.findOne({ "claims._id": claimId }) || 
               await LostPost.findOne({ "claims._id": claimId });

    if (!post) {
        throw new ApiError(404, "Claim not found");
    }

    // Check if user owns the post
    if (post.user.toString() !== userId.toString()) {
        throw new ApiError(403, "You don't have permission to update this claim");
    }

    // Find and update the claim
    const claim = post.claims.id(claimId);
    if (!claim) {
        throw new ApiError(404, "Claim not found");
    }

    claim.status = status;
    claim.updatedAt = new Date();

    // If approving a claim, automatically reject other pending claims for the same post
    if (status === 'approved') {
        post.claims.forEach(c => {
            if (c._id.toString() !== claimId && c.status === 'pending') {
                c.status = 'rejected';
                c.updatedAt = new Date();
            }
        });

        // Mark the post as returned if it's a found post
        if (post instanceof FoundPost) {
            post.isReturned = true;
        } else if (post instanceof LostPost) {
            post.isFound = true;
        }
    }

    await post.save();

    // Populate the updated claim
    const updatedPost = await (post instanceof FoundPost ? FoundPost : LostPost)
        .findById(post._id)
        .populate('claims.user', 'fullName username email avatar');

    const updatedClaim = updatedPost.claims.id(claimId);

    return res.status(200).json(
        new ApiResponse(200, updatedClaim, `Claim ${status} successfully`)
    );
});

// Get claims made by the current user
const getUserClaims = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Find all posts where the user has made claims
    const [foundPostsWithClaims, lostPostsWithClaims] = await Promise.all([
        FoundPost.find({ "claims.user": userId })
            .populate('user', 'fullName username avatar')
            .populate('claims.user', 'fullName username avatar'),
        LostPost.find({ "claims.user": userId })
            .populate('user', 'fullName username avatar')
            .populate('claims.user', 'fullName username avatar')
    ]);

    // Extract claims made by the user
    const userClaims = [];

    foundPostsWithClaims.forEach(post => {
        post.claims.forEach(claim => {
            if (claim.user._id.toString() === userId.toString()) {
                userClaims.push({
                    ...claim.toObject(),
                    post: {
                        _id: post._id,
                        title: post.title,
                        type: 'found',
                        user: post.user
                    }
                });
            }
        });
    });

    lostPostsWithClaims.forEach(post => {
        post.claims.forEach(claim => {
            if (claim.user._id.toString() === userId.toString()) {
                userClaims.push({
                    ...claim.toObject(),
                    post: {
                        _id: post._id,
                        title: post.title,
                        type: 'lost',
                        user: post.user
                    }
                });
            }
        });
    });

    // Sort by creation date, newest first
    userClaims.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json(
        new ApiResponse(200, userClaims, "User claims retrieved successfully")
    );
});

export {
    createClaim,
    getPostClaims,
    updateClaimStatus,
    getUserClaims
};