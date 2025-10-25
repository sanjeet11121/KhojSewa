// models/claim.model.js
import mongoose from 'mongoose';

const claimSchema = new mongoose.Schema({
    // Post being claimed
    post: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'postType'
    },
    
    // Type of post being claimed
    postType: {
        type: String,
        required: true,
        enum: ['LostPost', 'FoundPost']
    },
    
    // User who made the claim
    claimedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Owner of the post being claimed
    postOwner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Claim description/message
    message: {
        type: String,
        required: [true, 'Claim message is required'],
        trim: true,
        maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    
    // Claim status
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    
    // Additional evidence
    evidence: [{
        url: String,
        description: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Contact information
    contactInfo: {
        phone: String,
        email: String
    },
    
    // Admin/Owner notes
    adminNotes: String,
    
    // Resolution details
    resolvedAt: Date,
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes
claimSchema.index({ post: 1, postType: 1 });
claimSchema.index({ claimedBy: 1 });
claimSchema.index({ postOwner: 1 });
claimSchema.index({ status: 1 });
claimSchema.index({ createdAt: -1 });

// Static methods
claimSchema.statics.findByPost = function(postId, postType) {
    return this.find({ post: postId, postType })
        .populate('claimedBy', 'fullName email avatar phoneNumber verified')
        .populate('postOwner', 'fullName email avatar')
        .sort({ createdAt: -1 });
};

claimSchema.statics.findByUser = function(userId) {
    return this.find({
        $or: [{ claimedBy: userId }, { postOwner: userId }]
    })
    .populate('post', 'title description category images')
    .populate('claimedBy', 'fullName email avatar')
    .populate('postOwner', 'fullName email avatar')
    .sort({ createdAt: -1 });
};

export const Claim = mongoose.model('Claim', claimSchema);