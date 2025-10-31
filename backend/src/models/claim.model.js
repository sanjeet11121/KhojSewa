// models/claim.model.js
import mongoose from 'mongoose';

const claimSchema = new mongoose.Schema({
  // Basic claim info
  post: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'postType'
  },
  postType: {
    type: String,
    required: true,
    enum: ['LostPost', 'FoundPost']
  },
  
  // User relationships
  claimant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Claim details
  claimMessage: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'under_review'],
    default: 'pending'
  },
  
  // Evidence
  evidence: [{
    type: {
      type: String,
      enum: ['image', 'document', 'link'],
      required: true
    },
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
    email: String,
    preferredContact: {
      type: String,
      enum: ['phone', 'email'],
      default: 'email'
    }
  },
  
  // ML Matching Data - Stored from recommendations
  matchingData: {
    confidence: {
      type: String,
      enum: ['high', 'medium', 'low'],
    },
    score: {
      type: Number,
      min: 0,
      max: 1
    },
    breakdown: {
      text: {
        type: Number,
        min: 0,
        max: 1
      },
      category: {
        type: Number,
        min: 0,
        max: 1
      },
      location: {
        type: Number,
        min: 0,
        max: 1
      },
      date: {
        type: Number,
        min: 0,
        max: 1
      }
    }
  },
  
  // Resolution details
  resolution: {
    status: String,
    notes: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date
  },
  
  // Communication
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: 500
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
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Meeting arrangements
  meeting: {
    proposedDate: Date,
    proposedLocation: String,
    confirmedDate: Date,
    confirmedLocation: String,
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending'
    },
    notes: String
  },
  
  // Analytics
  claimScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  flags: {
    isUrgent: { type: Boolean, default: false },
    requiresAttention: { type: Boolean, default: false },
    hasEvidence: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Indexes for performance
claimSchema.index({ post: 1, postType: 1 });
claimSchema.index({ claimant: 1 });
claimSchema.index({ postOwner: 1 });
claimSchema.index({ status: 1 });
claimSchema.index({ createdAt: -1 });
claimSchema.index({ 'flags.isUrgent': 1 });

// Static Methods
claimSchema.statics.findByPost = function(postId, postType) {
  return this.find({ post: postId, postType })
    .populate('claimant', 'fullName email avatar phoneNumber verified')
    .populate('postOwner', 'fullName email avatar')
    .sort({ createdAt: -1 });
};

claimSchema.statics.findByUser = function(userId) {
  return this.find({
    $or: [{ claimant: userId }, { postOwner: userId }]
  })
  .populate('post', 'title description category images')
  .populate('claimant', 'fullName email avatar')
  .populate('postOwner', 'fullName email avatar')
  .sort({ createdAt: -1 });
};

// Instance Methods
claimSchema.methods.canAccess = function(userId) {
  return this.claimant.toString() === userId.toString() || 
         this.postOwner.toString() === userId.toString();
};

claimSchema.methods.addMessage = function(senderId, message) {
  this.messages.push({
    sender: senderId,
    message: message
  });
  return this.save();
};

claimSchema.methods.markAsRead = function(userId) {
  this.messages.forEach(msg => {
    const alreadyRead = msg.readBy.some(read => 
      read.user.toString() === userId.toString()
    );
    if (!alreadyRead) {
      msg.readBy.push({ user: userId });
    }
  });
  return this.save();
};

// Pre-save middleware to calculate claim score
claimSchema.pre('save', function(next) {
  let score = 0;
  
  // Message quality (30 points)
  if (this.claimMessage.length > 100) score += 30;
  else if (this.claimMessage.length > 50) score += 20;
  else if (this.claimMessage.length > 20) score += 10;
  
  // Evidence (30 points)
  if (this.evidence.length > 0) score += 30;
  
  // Contact info (20 points)
  if (this.contactInfo.phone || this.contactInfo.email) score += 20;
  
  // User verification (20 points)
  // This would need to be populated to check claimant.verified
  
  this.claimScore = score;
  
  // Set flags
  this.flags.hasEvidence = this.evidence.length > 0;
  this.flags.isUrgent = this.claimScore >= 70;
  
  next();
});

export const Claim = mongoose.model('Claim', claimSchema);