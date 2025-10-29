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

    console.log('=== GET USER CHATS DEBUG ===');
    console.log('User ID:', userId);
    console.log('Archived param:', archived);

    const isArchived = archived === true || archived === 'true';

    const chatQuery = {
        participants: userId,
        isActive: true
    };

    if (isArchived) {
        chatQuery['settings.archived'] = true;
    } else {
        chatQuery.$or = [
            { 'settings.archived': { $exists: false } },
            { 'settings.archived': false }
        ];
    }

    console.log('Chat query:', JSON.stringify(chatQuery, null, 2));

    // Debug: Check all chats in database
    const allChats = await Chat.find({ isActive: true });
    console.log('Total active chats in DB:', allChats.length);
    if (allChats.length > 0) {
        console.log('Sample chat participants:', allChats[0].participants);
        console.log('User ID to match:', userId);
        console.log('User ID type:', typeof userId, userId.constructor.name);
    }

    console.log('Executing query...');
    const chats = await Chat.find(chatQuery)
        .populate('participants', 'fullName avatar email phoneNumber')
        .populate('lastMessage.sender', 'fullName avatar')
        .populate('claim', 'status description')
        .populate('post', 'title images')
        .sort({ updatedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

    console.log('Found chats count:', chats.length);
    if (chats.length > 0) {
        console.log('First chat:', JSON.stringify(chats[0], null, 2));
    } else {
        console.log('No chats found with query');
    }

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

    // Populate sender info for all messages first
    await chat.populate('messages.sender', 'fullName avatar');

    // Mark messages as read for this user
    const unreadMessages = chat.messages.filter(message => 
        !message.readBy.some(read => read.user.toString() === userId.toString()) &&
        message.sender.toString() !== userId.toString()
    );

    for (const message of unreadMessages) {
        if (!message.readBy.some(read => read.user.toString() === userId.toString())) {
            message.readBy.push({
                user: userId,
                readAt: new Date()
            });
        }
    }

    if (unreadMessages.length > 0) {
        await chat.save();
    }

    // Get messages with pagination AFTER populating
    const totalMessages = chat.messages.length;
    const messages = chat.messages
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) // Sort ascending (oldest first)
        .slice(Math.max(0, totalMessages - (page * limit)), totalMessages) // Get last N messages
        .map(msg => ({
            _id: msg._id,
            sender: msg.sender,
            content: msg.content,
            messageType: msg.messageType,
            fileUrl: msg.fileUrl,
            fileName: msg.fileName,
            fileSize: msg.fileSize,
            readBy: msg.readBy,
            createdAt: msg.createdAt,
            updatedAt: msg.updatedAt
        }));

    console.log('📨 Fetching messages for chat:', chatId);
    console.log('Total messages in chat:', totalMessages);
    console.log('Returning messages count:', messages.length);
    console.log('Sample message:', messages[0]);

    return res.status(200).json(
        new ApiResponse(200, {
            messages,
            chatId: chat._id,
            participants: chat.participants,
            currentPage: parseInt(page),
            hasMore: totalMessages > page * limit
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
    // Set lastMessage to the full message object, not just the ID
    chat.lastMessage = newMessage;
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