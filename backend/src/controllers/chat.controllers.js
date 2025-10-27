// controllers/chat.controllers.js
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { Chat } from '../models/chat.model.js';
import { User } from '../models/user.model.js';
import { Claim } from '../models/claim.model.js';

// Create or get existing chat
export const createOrGetChat = asyncHandler(async (req, res) => {
    const { participantId, claimId, postId, postType, chatType = 'direct' } = req.body;
    const userId = req.user._id;

    let chat;

    if (chatType === 'direct' && participantId) {
        // Direct chat between two users
        if (userId === participantId) {
            throw new ApiError(400, "Cannot create chat with yourself");
        }

        // Check if participant exists
        const participant = await User.findById(participantId);
        if (!participant) {
            throw new ApiError(404, "Participant not found");
        }

        // Check if chat already exists
        chat = await Chat.findByParticipants([userId, participantId]);
        
        if (!chat) {
            chat = await Chat.create({
                participants: [userId, participantId],
                chatType: 'direct',
                chatName: `${req.user.fullName} & ${participant.fullName}`
            });
        }
    } else if (chatType === 'claim' && claimId) {
        // Claim-related chat
        const claim = await Claim.findById(claimId)
            .populate('claimedBy')
            .populate('postOwner');

        if (!claim) {
            throw new ApiError(404, "Claim not found");
        }

        // Check if user is part of the claim
        if (claim.claimedBy._id.toString() !== userId.toString() && 
            claim.postOwner._id.toString() !== userId.toString()) {
            throw new ApiError(403, "Not authorized for this claim chat");
        }

        chat = await Chat.findOne({ claim: claimId });
        
        if (!chat) {
            chat = await Chat.create({
                participants: [claim.claimedBy._id, claim.postOwner._id],
                claim: claimId,
                chatType: 'claim',
                chatName: `Claim: ${claim.description?.substring(0, 30)}...`
            });
        }
    } else {
        throw new ApiError(400, "Invalid chat parameters");
    }

    await chat.populate('participants', 'fullName avatar email');
    await chat.populate('lastMessage');

    return res.status(200).json(
        new ApiResponse(200, chat, "Chat retrieved/created successfully")
    );
});

// Get user's chats
export const getUserChats = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { page = 1, limit = 20, archived = false } = req.query;

    const chats = await Chat.find({
        participants: userId,
        'settings.archived': archived === 'true',
        isActive: true
    })
    .populate('participants', 'fullName avatar email phoneNumber')
    .populate('lastMessage')
    .populate('claim', 'status description')
    .populate('post', 'title images')
    .sort({ updatedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    // Calculate unread counts for each chat
    const chatsWithUnread = await Promise.all(
        chats.map(async (chat) => {
            const unreadCount = chat.messages.filter(message => 
                !message.readBy.some(read => read.user.toString() === userId.toString()) &&
                message.sender.toString() !== userId.toString()
            ).length;

            return {
                ...chat.toObject(),
                unreadCount
            };
        })
    );

    return res.status(200).json(
        new ApiResponse(200, {
            chats: chatsWithUnread,
            currentPage: parseInt(page),
            totalPages: Math.ceil(chats.length / limit)
        }, "User chats fetched successfully")
    );
});

// Get chat messages
export const getChatMessages = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const userId = req.user._id;
    const { page = 1, limit = 50 } = req.query;

    const chat = await Chat.findOne({
        _id: chatId,
        participants: userId,
        isActive: true
    });

    if (!chat) {
        throw new ApiError(404, "Chat not found");
    }

    // Get messages with pagination
    const messages = chat.messages
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice((page - 1) * limit, page * limit)
        .reverse();

    // Populate sender info for messages
    await chat.populate('messages.sender', 'fullName avatar');

    // Mark messages as read for this user
    const unreadMessages = chat.messages.filter(message => 
        !message.readBy.some(read => read.user.toString() === userId.toString()) &&
        message.sender._id.toString() !== userId.toString()
    );

    for (const message of unreadMessages) {
        if (!message.readBy.some(read => read.user.toString() === userId.toString())) {
            message.readBy.push({
                user: userId,
                readAt: new Date()
            });
        }
    }

    await chat.save();

    return res.status(200).json(
        new ApiResponse(200, {
            messages,
            chatId: chat._id,
            participants: chat.participants,
            currentPage: parseInt(page),
            hasMore: chat.messages.length > page * limit
        }, "Chat messages fetched successfully")
    );
});

// Send message
export const sendMessage = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const { content, messageType = 'text', fileUrl, fileName, fileSize } = req.body;
    const userId = req.user._id;

    if (!content && !fileUrl) {
        throw new ApiError(400, "Message content or file is required");
    }

    const chat = await Chat.findOne({
        _id: chatId,
        participants: userId,
        isActive: true
    });

    if (!chat) {
        throw new ApiError(404, "Chat not found");
    }

    const newMessage = {
        sender: userId,
        content,
        messageType,
        fileUrl,
        fileName,
        fileSize,
        readBy: [{
            user: userId,
            readAt: new Date()
        }]
    };

    chat.messages.push(newMessage);
    chat.lastMessage = chat.messages[chat.messages.length - 1]._id;
    await chat.save();

    await chat.populate('messages.sender', 'fullName avatar');
    const message = chat.messages[chat.messages.length - 1];

    return res.status(201).json(
        new ApiResponse(201, message, "Message sent successfully")
    );
});

// Delete message (soft delete)
export const deleteMessage = asyncHandler(async (req, res) => {
    const { chatId, messageId } = req.params;
    const userId = req.user._id;

    const chat = await Chat.findOne({
        _id: chatId,
        participants: userId
    });

    if (!chat) {
        throw new ApiError(404, "Chat not found");
    }

    const message = chat.messages.id(messageId);
    if (!message) {
        throw new ApiError(404, "Message not found");
    }

    // Only allow sender to delete message
    if (message.sender.toString() !== userId.toString()) {
        throw new ApiError(403, "Can only delete your own messages");
    }

    // Soft delete - add user to deletedFor array
    if (!message.deletedFor.includes(userId)) {
        message.deletedFor.push(userId);
        await chat.save();
    }

    return res.status(200).json(
        new ApiResponse(200, null, "Message deleted successfully")
    );
});

// Archive/Unarchive chat
export const toggleArchiveChat = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const userId = req.user._id;
    const { archived } = req.body;

    const chat = await Chat.findOne({
        _id: chatId,
        participants: userId
    });

    if (!chat) {
        throw new ApiError(404, "Chat not found");
    }

    chat.settings.archived = archived;
    await chat.save();

    return res.status(200).json(
        new ApiResponse(200, chat, `Chat ${archived ? 'archived' : 'unarchived'} successfully`)
    );
});