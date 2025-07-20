import mongoose from 'mongoose';

const lostPostSchema = new mongoose.Schema({
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
    image: {
        type: String
    },
    locationLost: {
        type: String,
        required: true
    },
    lostDate: {
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
    isFound: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export const LostPost = mongoose.model('LostPost', lostPostSchema);