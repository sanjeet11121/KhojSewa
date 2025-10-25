// src/models/match.model.js
import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
    lostPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LostPost',
        required: true
    },
    foundPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoundPost',
        required: true
    },
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 1
    },
    confidence: {
        type: String,
        enum: ['very low', 'low', 'medium', 'high'],
        required: true
    },
    breakdown: {
        text: { type: Number, min: 0, max: 1 },
        category: { type: Number, min: 0, max: 1 },
        location: { type: Number, min: 0, max: 1 },
        date: { type: Number, min: 0, max: 1 }
    },
    matchReasons: [String],
    isNotified: {
        type: Boolean,
        default: false
    },
    isViewed: {
        type: Boolean,
        default: false
    },
    isContacted: {
        type: Boolean,
        default: false
    },
    contactedAt: Date,
    notes: String,
    algorithmVersion: {
        type: String,
        default: '1.0'
    }
}, {
    timestamps: true
});

// Compound indexes
matchSchema.index({ lostPost: 1, foundPost: 1 }, { unique: true });
matchSchema.index({ score: -1, createdAt: -1 });
matchSchema.index({ lostPost: 1, score: -1 });
matchSchema.index({ foundPost: 1, score: -1 });
matchSchema.index({ confidence: 1, score: -1 });
matchSchema.index({ isNotified: 1, createdAt: -1 });

// Virtual for isHighConfidence
matchSchema.virtual('isHighConfidence').get(function() {
    return this.confidence === 'high' || this.confidence === 'medium';
});

export const Match = mongoose.model('Match', matchSchema);