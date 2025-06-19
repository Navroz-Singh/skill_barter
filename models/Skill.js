import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Skill title is required'],
        trim: true,
        maxLength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Skill description is required'],
        trim: true,
        maxLength: [1000, 'Description cannot exceed 1000 characters']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['Technology', 'Design', 'Business', 'Language', 'Photography', 'Music', 'Handcraft', 'Education', 'Other']
    },
    level: {
        type: String,
        required: [true, 'Skill level is required'],
        enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
    },
    tags: [{
        type: String,
        trim: true,
        maxLength: [30, 'Tag cannot exceed 30 characters']
    }],
    images: [{
        url: String,
        publicId: String, // For Cloudinary
        alt: String
    }],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    ownerSupabaseId: {
        type: String,
        required: true
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    exchangeCount: {
        type: Number,
        default: 0
    },
    viewCount: {
        type: Number,
        default: 0
    },
    interestedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    location: {
        type: String,
        trim: true
    },
    deliveryMethod: {
        type: String,
        enum: ['In-person', 'Online', 'Both'],
        default: 'Both'
    },
    estimatedDuration: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

export default mongoose.models.Skill || mongoose.model('Skill', skillSchema);
