import mongoose from 'mongoose';

const foundPostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    images: [{
        type: String
    }],
    locationFound: {
        type: String,
        required: true
    },
    foundDate: {
        type: Date,
        required: true
    },
    category: { // Add item category
        type: String,
        required: true,
        enum: ['electronics', 'stationeries', 'clothing', 'food', 'toys', 'other'],
    },
    itemName: { type: String }, // Optional
    itemCondition: { type: String },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    claims: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        message: String
    }],
    isReturned: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export const FoundPost = mongoose.model('FoundPost', foundPostSchema);