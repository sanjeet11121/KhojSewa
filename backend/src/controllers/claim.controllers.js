// controllers/claim.controllers.js
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { Claim } from '../models/claim.model.js';
import { LostPost } from '../models/lostPost.model.js';
import { FoundPost } from '../models/foundPost.model.js';
import { Chat } from '../models/chat.model.js';
import mongoose from 'mongoose';

export const createClaim = asyncHandler(async (req, res) => {
  const { postId, postType, claimMessage, contactInfo, evidence } = req.body;
  const userId = req.user._id;

  console.log('=== BACKEND CLAIM CREATION DEBUG ===');
  console.log('1. Received postId:', postId);
  console.log('2. Received postType:', postType);
  console.log('3. User ID:', userId);

  // Validation
  if (!postId || !postType || !claimMessage) {
    throw new ApiError(400, "Post ID, post type, and claim message are required");
  }

  if (!['LostPost', 'FoundPost'].includes(postType)) {
    throw new ApiError(400, "Invalid post type");
  }

  // Find post and owner - DEBUG BOTH COLLECTIONS
  console.log('4. Searching for post...');
  
  let post = null;
  let foundInCollection = null;
  
  // Check both collections to see where the post actually exists
  if (postType === 'LostPost') {
    console.log('5. Searching in LostPost collection...');
    post = await LostPost.findById(postId).populate('user');
    if (post) {
      foundInCollection = 'LostPost';
      console.log('6. Found post in LostPost collection');
    } else {
      console.log('6. Not found in LostPost, checking FoundPost...');
      post = await FoundPost.findById(postId).populate('user');
      if (post) {
        foundInCollection = 'FoundPost';
        console.log('6. Found post in FoundPost collection (but was looking in LostPost)');
      }
    }
  } else { // FoundPost
    console.log('5. Searching in FoundPost collection...');
    post = await FoundPost.findById(postId).populate('user');
    if (post) {
      foundInCollection = 'FoundPost';
      console.log('6. Found post in FoundPost collection');
    } else {
      console.log('6. Not found in FoundPost, checking LostPost...');
      post = await LostPost.findById(postId).populate('user');
      if (post) {
        foundInCollection = 'LostPost';
        console.log('6. Found post in LostPost collection (but was looking in FoundPost)');
      }
    }
  }

  console.log('7. Final result - Post:', post);
  console.log('8. Found in collection:', foundInCollection);

  if (!post) {
    console.log('9. POST NOT FOUND IN ANY COLLECTION');
    throw new ApiError(404, `${postType.replace('Post', '')} post not found`);
  }

  // Check if post is in the wrong collection
  if (foundInCollection && foundInCollection !== postType) {
    console.log('10. WARNING: Post found in', foundInCollection, 'but was looking in', postType);
  }

  const postOwnerId = post.user._id;

  // Prevent claiming own post
  if (postOwnerId.toString() === userId.toString()) {
    throw new ApiError(400, "You cannot claim your own post");
  }

  // Check for duplicate pending claim
  const existingClaim = await Claim.findOne({
    post: postId,
    postType: foundInCollection || postType, // Use the actual collection where post was found
    claimant: userId,
    status: 'pending'
  });

  if (existingClaim) {
    throw new ApiError(400, "You already have a pending claim for this post");
  }

  // Create claim with the CORRECT postType (where the post was actually found)
  const claim = await Claim.create({
    post: postId,
    postType: foundInCollection || postType,
    claimant: userId,
    postOwner: postOwnerId,
    claimMessage,
    contactInfo: contactInfo || {},
    evidence: evidence || []
  });

  console.log('11. Claim created successfully:', claim._id);

  // Populate response
  const populatedClaim = await Claim.findById(claim._id)
    .populate('claimant', 'fullName email avatar')
    .populate('postOwner', 'fullName email avatar')
    .populate('post', 'title description category images');

  res.status(201).json(
    new ApiResponse(201, populatedClaim, "Claim submitted successfully")
  );
});

// Get claims for a post
export const getPostClaims = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { type } = req.query;
  const userId = req.user._id;

  if (!postId || !type) {
    throw new ApiError(400, "Post ID and type are required");
  }

  const postType = type === 'lost' ? 'LostPost' : 'FoundPost';

  // Verify post ownership
  const PostModel = postType === 'LostPost' ? LostPost : FoundPost;
  const post = await PostModel.findById(postId);

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  if (post.user.toString() !== userId.toString()) {
    throw new ApiError(403, "Not authorized to view claims for this post");
  }

  const claims = await Claim.findByPost(postId, postType);

  res.status(200).json(
    new ApiResponse(200, claims, "Claims fetched successfully")
  );
});

// Update claim status
export const updateClaimStatus = asyncHandler(async (req, res) => {
  const { claimId } = req.params;
  const { status, notes } = req.body;
  const userId = req.user._id;

  if (!['approved', 'rejected', 'under_review'].includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  const claim = await Claim.findById(claimId).populate('postOwner', '_id');

  if (!claim) {
    throw new ApiError(404, "Claim not found");
  }

  // Verify post ownership
  if (claim.postOwner._id.toString() !== userId.toString()) {
    throw new ApiError(403, "Only the post owner can update claim status");
  }

  // Update claim
  claim.status = status;
  claim.resolution = {
    status,
    notes,
    resolvedBy: userId,
    resolvedAt: new Date()
  };

  await claim.save();

  // Update post status if approved
  if (status === 'approved') {
    const PostModel = claim.postType === 'LostPost' ? LostPost : FoundPost;
    const updateField = claim.postType === 'LostPost' ? { status: 'found' } : { status: 'returned' };
    await PostModel.findByIdAndUpdate(claim.post, updateField);
  }

  const updatedClaim = await Claim.findById(claimId)
    .populate('claimant', 'fullName email avatar phoneNumber verified')
    .populate('postOwner', 'fullName email avatar')
    .populate('post', 'title description category images');

  res.status(200).json(
    new ApiResponse(200, updatedClaim, "Claim status updated successfully")
  );
});

// Add message to claim (synced with chat system)
export const addMessage = asyncHandler(async (req, res) => {
  const { claimId } = req.params;
  const { message } = req.body;
  const userId = req.user._id;

  if (!message?.trim()) {
    throw new ApiError(400, "Message is required");
  }

  const claim = await Claim.findById(claimId)
    .populate('claimant', 'fullName avatar email')
    .populate('postOwner', 'fullName avatar email');

  if (!claim) {
    throw new ApiError(404, "Claim not found");
  }

  // Check authorization - compare with populated _id fields
  const isClaimant = claim.claimant._id.toString() === userId.toString();
  const isPostOwner = claim.postOwner._id.toString() === userId.toString();
  
  if (!isClaimant && !isPostOwner) {
    throw new ApiError(403, "Not authorized to message in this claim");
  }

  // Add message to claim
  await claim.addMessage(userId, message.trim());

  console.log('=== CLAIM MESSAGE DEBUG ===');
  console.log('Claim ID:', claimId);
  console.log('Sender ID:', userId);
  console.log('Message:', message.trim());

  // Sync with chat system - create or update chat
  let chat = await Chat.findOne({ claim: claimId });
  
  console.log('Existing chat found:', !!chat);
  
  if (!chat) {
    // Create new chat linked to this claim
    const participants = [claim.claimant._id, claim.postOwner._id];
    console.log('Creating new chat with participants:', participants);
    chat = await Chat.create({
      participants,
      claim: claimId,
      chatType: 'claim',
      chatName: `Claim Discussion`,
      messages: []
    });
    console.log('New chat created:', chat._id);
  }

  // Add message to chat
  const chatMessage = {
    sender: userId,
    content: message.trim(),
    messageType: 'text',
    readBy: [{
      user: userId,
      readAt: new Date()
    }]
  };

  chat.messages.push(chatMessage);
  // Set lastMessage to the actual message object (subdocument)
  chat.lastMessage = chat.messages[chat.messages.length - 1];
  await chat.save();
  
  console.log('Chat saved with', chat.messages.length, 'messages');
  console.log('Chat details:', {
    _id: chat._id,
    participants: chat.participants,
    claim: chat.claim,
    chatType: chat.chatType,
    messagesCount: chat.messages.length,
    settings: chat.settings
  });

  // Return updated claim message
  const updatedClaim = await Claim.findById(claimId)
    .populate('messages.sender', 'fullName avatar')
    .populate('messages.readBy.user', 'fullName avatar');

  const newMessage = updatedClaim.messages[updatedClaim.messages.length - 1];

  res.status(201).json(
    new ApiResponse(201, newMessage, "Message sent successfully")
  );
});

// Get user's claims (both made and received)
export const getUserClaims = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { type, status, page = 1, limit = 20 } = req.query;

  let query = {
    $or: [{ claimant: userId }, { postOwner: userId }]
  };

  if (status) query.status = status;
  if (type) query.postType = type === 'lost' ? 'LostPost' : 'FoundPost';

  const claims = await Claim.find(query)
    .populate('post', 'title description category images status')
    .populate('claimant', 'fullName email avatar verified phoneNumber')
    .populate('postOwner', 'fullName email avatar')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Claim.countDocuments(query);

  res.status(200).json(
    new ApiResponse(200, {
      claims,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalClaims: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }, "User claims fetched successfully")
  );
});

// Get single claim details
export const getClaimDetails = asyncHandler(async (req, res) => {
  const { claimId } = req.params;
  const userId = req.user._id;

  const claim = await Claim.findById(claimId)
    .populate('post', 'title description category images locationLost locationFound lostDate foundDate')
    .populate('claimant', 'fullName email avatar phoneNumber verified')
    .populate('postOwner', 'fullName email avatar')
    .populate('messages.sender', 'fullName avatar')
    .populate('resolution.resolvedBy', 'fullName avatar');

  if (!claim) {
    throw new ApiError(404, "Claim not found");
  }

  if (!claim.canAccess(userId)) {
    throw new ApiError(403, "Not authorized to view this claim");
  }

  // Mark messages as read for current user
  await claim.markAsRead(userId);

  res.status(200).json(
    new ApiResponse(200, claim, "Claim details fetched successfully")
  );
});

// Get claim statistics
export const getClaimStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const stats = await Claim.aggregate([
    {
      $match: {
        $or: [
          { claimant: new mongoose.Types.ObjectId(userId) },
          { postOwner: new mongoose.Types.ObjectId(userId) }
        ]
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    under_review: 0
  };

  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });

  res.status(200).json(
    new ApiResponse(200, result, "Claim statistics fetched successfully")
  );
});