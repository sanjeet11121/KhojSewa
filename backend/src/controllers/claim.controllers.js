// controllers/claim.controllers.js
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { Claim } from '../models/claim.model.js';
import { LostPost } from '../models/lostPost.model.js';
import { FoundPost } from '../models/foundPost.model.js';
import { User } from '../models/user.model.js';
import notificationService from '../services/notifications.service.js';

// Create a new claim
export const createClaim = asyncHandler(async (req, res) => {
    const { 
        postId, 
        postType, 
        description, 
        contactInfo, 
        evidence,
        meetingArrangements 
    } = req.body;
    const userId = req.user._id;

    if (!postId || !postType || !description) {
        throw new ApiError(400, "Post ID, post type, and description are required");
    }

    // Validate post type
    if (!['LostPost', 'FoundPost'].includes(postType)) {
        throw new ApiError(400, "Invalid post type");
    }

    // Find the post and its owner
    let post;
    let postOwnerId;

    if (postType === 'LostPost') {
        post = await LostPost.findById(postId).populate('user');
        if (!post) throw new ApiError(404, "Lost post not found");
        postOwnerId = post.user._id;
    } else {
        post = await FoundPost.findById(postId).populate('user');
        if (!post) throw new ApiError(404, "Found post not found");
        postOwnerId = post.user._id;
    }

    // Check if user is claiming their own post
    if (postOwnerId.toString() === userId.toString()) {
        throw new ApiError(400, "You cannot claim your own post");
    }

    // Check for existing pending claim
    const existingClaim = await Claim.findOne({
        post: postId,
        postType,
        claimedBy: userId,
        status: 'pending'
    });

    if (existingClaim) {
        throw new ApiError(400, "You already have a pending claim for this post");
    }

    // Create the claim with your schema structure
    const claim = await Claim.create({
        post: postId,
        postType,
        claimedBy: userId,
        postOwner: postOwnerId,
        description,
        contactInfo: contactInfo || {},
        evidence: evidence || [],
        meetingArrangements: meetingArrangements || {},
        metadata: {
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            claimSource: 'web'
        }
    });

    // Populate for response
    await claim.populate('claimedBy', 'fullName email avatar');
    await claim.populate('postOwner', 'fullName email avatar');
    await claim.populate('post', 'title description category images');

    // Send notification to post owner
    try {
        await notificationService.sendClaimNotification(claim._id);
    } catch (emailError) {
        console.error('Failed to send claim notification:', emailError);
        // Don't throw error - claim was created successfully
    }

    return res.status(201).json(
        new ApiResponse(201, claim, "Claim created successfully")
    );
});

// Get claims for a specific post
export const getPostClaims = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { type, status, limit = 50, page = 1 } = req.query;
    const userId = req.user._id;

    if (!postId || !type) {
        throw new ApiError(400, "Post ID and type are required");
    }

    const postType = type === 'lost' ? 'LostPost' : 'FoundPost';

    // Verify user owns the post or is admin
    let post;
    if (postType === 'LostPost') {
        post = await LostPost.findById(postId);
    } else {
        post = await FoundPost.findById(postId);
    }

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    if (post.user.toString() !== userId.toString()) {
        throw new ApiError(403, "Not authorized to view claims for this post");
    }

    const claims = await Claim.findByPost(postId, postType, {
        status,
        limit: parseInt(limit),
        page: parseInt(page)
    });

    return res.status(200).json(
        new ApiResponse(200, claims, "Post claims fetched successfully")
    );
});

// Update claim status
export const updateClaimStatus = asyncHandler(async (req, res) => {
    const { claimId } = req.params;
    const { status, ownerMessage } = req.body;
    const userId = req.user._id;

    if (!['approved', 'rejected', 'under_review'].includes(status)) {
        throw new ApiError(400, "Invalid status");
    }

    const claim = await Claim.findById(claimId)
        .populate('postOwner', '_id')
        .populate('claimedBy', 'email fullName notificationPreferences')
        .populate('post', 'title');

    if (!claim) {
        throw new ApiError(404, "Claim not found");
    }

    // Check if current user is the post owner
    if (claim.postOwner._id.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only update claims on your own posts");
    }

    // Use the instance method to update status
    await claim.updateStatus(status, ownerMessage);

    // Populate for response
    await claim.populate('claimedBy', 'fullName email avatar');
    await claim.populate('postOwner', 'fullName email avatar');

    // Send status update notification to claimant
    try {
        await notificationService.sendClaimStatusUpdate(claimId, status, ownerMessage);
    } catch (emailError) {
        console.error('Failed to send status update notification:', emailError);
    }

    // If claim is approved, update the post status
    if (status === 'approved') {
        try {
            if (claim.postType === 'LostPost') {
                await LostPost.findByIdAndUpdate(claim.post, { isFound: true });
            } else {
                await FoundPost.findByIdAndUpdate(claim.post, { isReturned: true });
            }
        } catch (postError) {
            console.error('Error updating post status:', postError);
        }
    }

    return res.status(200).json(
        new ApiResponse(200, claim, "Claim status updated successfully")
    );
});

// Add message to claim conversation
export const addClaimMessage = asyncHandler(async (req, res) => {
    const { claimId } = req.params;
    const { message } = req.body;
    const userId = req.user._id;

    if (!message) {
        throw new ApiError(400, "Message is required");
    }

    const claim = await Claim.findById(claimId);

    if (!claim) {
        throw new ApiError(404, "Claim not found");
    }

    // Check if user is part of this claim
    if (!claim.canModify(userId)) {
        throw new ApiError(403, "Not authorized to message in this claim");
    }

    // Use instance method to add message
    await claim.addMessage(userId, message);

    // Populate for response
    await claim.populate('messages.sender', 'fullName avatar');
    const newMessage = claim.messages[claim.messages.length - 1];

    return res.status(201).json(
        new ApiResponse(201, newMessage, "Message added successfully")
    );
});

// Get claim messages
export const getClaimMessages = asyncHandler(async (req, res) => {
    const { claimId } = req.params;
    const userId = req.user._id;

    const claim = await Claim.findById(claimId)
        .populate('messages.sender', 'fullName avatar');

    if (!claim) {
        throw new ApiError(404, "Claim not found");
    }

    // Check if user is part of this claim
    if (!claim.canModify(userId)) {
        throw new ApiError(403, "Not authorized to view messages for this claim");
    }

    // Mark messages as read for this user
    await claim.markMessagesAsRead(userId);

    return res.status(200).json(
        new ApiResponse(200, claim.messages, "Claim messages fetched successfully")
    );
});

// Get claims made by the current user
export const getUserClaims = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { status, postType, limit = 20, page = 1 } = req.query;

    const claims = await Claim.findByUser(userId, {
        status,
        postType,
        limit: parseInt(limit),
        page: parseInt(page)
    });

    const total = await Claim.countDocuments({
        $or: [
            { claimedBy: userId },
            { postOwner: userId }
        ]
    });

    return res.status(200).json(
        new ApiResponse(200, {
            claims,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalClaims: total
        }, "User claims fetched successfully")
    );
});

// Get claim statistics
export const getClaimStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const stats = await Claim.getUserClaimStats(userId);

    return res.status(200).json(
        new ApiResponse(200, stats, "Claim statistics fetched successfully")
    );
});

// Get single claim details
export const getClaimDetails = asyncHandler(async (req, res) => {
    const { claimId } = req.params;
    const userId = req.user._id;

    const claim = await Claim.findById(claimId)
        .populate('post', 'title description category images locationLost locationFound lostDate foundDate')
        .populate('claimedBy', 'fullName email avatar phoneNumber verified')
        .populate('postOwner', 'fullName email avatar')
        .populate('messages.sender', 'fullName avatar');

    if (!claim) {
        throw new ApiError(404, "Claim not found");
    }

    // Check if user is part of this claim
    if (!claim.canModify(userId)) {
        throw new ApiError(403, "Not authorized to view this claim");
    }

    return res.status(200).json(
        new ApiResponse(200, claim, "Claim details fetched successfully")
    );
});

// Update meeting arrangements
export const updateMeetingArrangements = asyncHandler(async (req, res) => {
    const { claimId } = req.params;
    const { proposedDate, proposedLocation, notes } = req.body;
    const userId = req.user._id;

    const claim = await Claim.findById(claimId);

    if (!claim) {
        throw new ApiError(404, "Claim not found");
    }

    // Check if user is part of this claim
    if (!claim.canModify(userId)) {
        throw new ApiError(403, "Not authorized to update meeting arrangements");
    }

    claim.meetingArrangements = {
        proposedDate,
        proposedLocation,
        notes,
        ...claim.meetingArrangements
    };

    await claim.save();

    return res.status(200).json(
        new ApiResponse(200, claim, "Meeting arrangements updated successfully")
    );
});