// models/Review.js
import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
    exchangeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exchange',
        required: true
    },
    reviewerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    revieweeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        maxlength: [500, 'Comment cannot be more than 500 characters'],
        trim: true
    }
}, {
    timestamps: true
});

// Ensure one review per user per exchange
ReviewSchema.index({ exchangeId: 1, reviewerId: 1 }, { unique: true });

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);
