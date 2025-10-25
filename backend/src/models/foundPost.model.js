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
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        },
        address: String,
        addressDetails: mongoose.Schema.Types.Mixed
    },
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
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}],
    isReturned: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Create 2dsphere index for geospatial queries
foundPostSchema.index({ location: '2dsphere' });

export const FoundPost = mongoose.model('FoundPost', foundPostSchema);