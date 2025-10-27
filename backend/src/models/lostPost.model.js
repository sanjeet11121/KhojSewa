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
    locationLost: {
        type: String,
        required: true
    },
    lostDate: {
        type: Date,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Electronics', 'Stationeries', 'Clothing', 'Food', 'Toys', 'Other'],
        default: 'Other'
    },
    itemName: { type: String },
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
    isFound: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Create 2dsphere index for geospatial queries
lostPostSchema.index({ location: '2dsphere' });

export const LostPost = mongoose.model('LostPost', lostPostSchema);