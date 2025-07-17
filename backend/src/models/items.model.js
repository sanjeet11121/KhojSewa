import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
        enum: ['electronics', 'stationeries', 'clothing', 'food', 'toys', 'other'],
    },
    location: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['lost', 'found'],
        required: true,
    }

}, { timestamps: true })
const Item = mongoose.model('Item', itemSchema);

export default Item;