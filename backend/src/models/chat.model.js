import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'file', 'location'],
        default: 'text'
    },
    fileUrl: String,
    fileName: String,
    fileSize: Number,
    isRead: {
        type: Boolean,
        default: false
    },
    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    deletedFor: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

const chatSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    // For claim-related chats
    claim: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Claim'
    },
    // For direct user-to-user chats
    post: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'postType'
    },
    postType: {
        type: String,
        enum: ['LostPost', 'FoundPost', null],
        default: null
    },
    chatType: {
        type: String,
        enum: ['direct', 'claim', 'group'],
        default: 'direct'
    },
    chatName: {
        type: String,
        trim: true
    },
    chatImage: String,
    lastMessage: messageSchema,
    isActive: {
        type: Boolean,
        default: true
    },
    blockedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    settings: {
        notifications: {
            type: Boolean,
            default: true
        },
        archived: {
            type: Boolean,
            default: false
        }
    }
}, {
    timestamps: true
});

// Add message schema as a subdocument array
chatSchema.add({
    messages: [messageSchema]
});

// Indexes
chatSchema.index({ participants: 1 });
chatSchema.index({ claim: 1 });
chatSchema.index({ post: 1, postType: 1 });
chatSchema.index({ updatedAt: -1 });
chatSchema.index({ 'participants': 1, 'lastMessage': -1 });

// Virtual for unread count
chatSchema.virtual('unreadCount').get(function() {
    // This would be calculated dynamically in queries
    return 0;
});

// Static methods
chatSchema.statics.findByParticipants = function(participants) {
    return this.findOne({
        participants: { $all: participants, $size: participants.length },
        chatType: 'direct'
    });
};

chatSchema.statics.findUserChats = function(userId) {
    return this.find({
        participants: userId,
        isActive: true
    })
    .populate('participants', 'fullName avatar email phoneNumber')
    .populate('lastMessage')
    .populate('claim', 'status description')
    .populate('post', 'title images')
    .sort({ updatedAt: -1 });
};

export const Chat = mongoose.model('Chat', chatSchema);