import mongoose from 'mongoose';

const foundPostSchema = new mongoose.Schema({
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
        required: true,

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

const Post = mongoose.model('Post', foundPostSchema);

export default Post;