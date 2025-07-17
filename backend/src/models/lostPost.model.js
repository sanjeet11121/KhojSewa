import mongoose from 'mongoose';

const lostPostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    image: {
        type: String,

    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    claims: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],



}, {
    timestamps: true,
})

const Post = mongoose.model('Post', lostPostSchema);

export default Post;