import mongoose from 'mongoose';

const skillViewSchema = new mongoose.Schema({
    // Which skill was viewed
    skillId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill',
        required: true
    },

    // Who viewed it (if logged in)
    viewerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    viewerSupabaseId: {
        type: String
    },

    // Anonymous tracking data
    ipAddress: {
        type: String,
        required: true
    },
    userAgent: String,

    // When the view happened
    viewDate: {
        type: Date,
        default: Date.now,
        required: true
    }
}, {
    timestamps: true
});

// Indexes for efficient querying - crucial for chart performance
skillViewSchema.index({ skillId: 1, viewDate: -1 });
skillViewSchema.index({ viewDate: -1 });
skillViewSchema.index({ viewerSupabaseId: 1, viewDate: -1 });

// Method to get daily view counts for a specific skill
skillViewSchema.statics.getDailyViewsForSkill = function (skillId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.aggregate([
        {
            $match: {
                skillId: skillId,
                viewDate: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$viewDate' },
                    month: { $month: '$viewDate' },
                    day: { $dayOfMonth: '$viewDate' }
                },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
    ]);
};

// Method to get daily views for all skills owned by a user
skillViewSchema.statics.getDailyViewsForUser = function (userSupabaseId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.aggregate([
        {
            $lookup: {
                from: 'skills',
                localField: 'skillId',
                foreignField: '_id',
                as: 'skill'
            }
        },
        {
            $unwind: '$skill'
        },
        {
            $match: {
                'skill.ownerSupabaseId': userSupabaseId,
                viewDate: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$viewDate' },
                    month: { $month: '$viewDate' },
                    day: { $dayOfMonth: '$viewDate' }
                },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
    ]);
};

export default mongoose.models.SkillView || mongoose.model('SkillView', skillViewSchema);
