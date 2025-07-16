import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    supabaseId: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    name: {
        type: String,
        required: true,
        maxlength: [60, 'Name cannot be more than 60 characters'],
        trim: true,
    },
    avatar: String,
    bio: {
        type: String,
        maxlength: [500, 'Bio cannot be more than 500 characters'],
        trim: true,
    },
    skills: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill'
    }],
    exchanges: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exchange'
    }],
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    reviewCount: {
        type: Number,
        default: 0,
        min: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    location: {
        type: String,
        trim: true,
        maxlength: [100, 'Location cannot be more than 100 characters'],
    },
    preferences: {
        notifications: {
            email: { type: Boolean, default: true },
            push: { type: Boolean, default: true },
            exchanges: { type: Boolean, default: true },
            messages: { type: Boolean, default: true },
        },
        privacy: {
            showEmail: { type: Boolean, default: false },
            showLocation: { type: Boolean, default: true },
            profileVisibility: {
                type: String,
                enum: ['public', 'private'],
                default: 'public'
            },
        }
    },
    stats: {
        totalSkills: { type: Number, default: 0 },
        activeSkills: { type: Number, default: 0 },
        totalViews: { type: Number, default: 0 },
        successfulExchanges: { type: Number, default: 0 },
    },
    lastActive: {
        type: Date,
        default: Date.now,
    },
    profileEditedFields: {
        name: { type: Boolean, default: false },
        avatar: { type: Boolean, default: false },
        bio: { type: Boolean, default: false },
        location: { type: Boolean, default: false }
    },
    adminMetadata: {
        isAdmin: { type: Boolean, default: false },
        disputesHandled: { type: Number, default: 0 },
        lastAdminActivity: Date
      }
}, {
    timestamps: true, // Keeps createdAt and updatedAt
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
