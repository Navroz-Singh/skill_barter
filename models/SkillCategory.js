// models/SkillCategory.js
import mongoose from 'mongoose';

const skillCategorySchema = new mongoose.Schema({
    // Category name (matches your Skill schema)
    name: {
        type: String,
        required: true,
        unique: true,
        enum: ['Technology', 'Design', 'Business', 'Language', 'Photography', 'Music', 'Handcraft', 'Education', 'Other']
    },

    // Simple counters
    userCount: {
        type: Number,
        default: 0
    },

    skillCount: {
        type: Number,
        default: 0
    },

    totalViews: {
        type: Number,
        default: 0
    },

    totalExchanges: {
        type: Number,
        default: 0
    },

    // Most common level in this category
    popularLevel: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
        default: 'Beginner'
    },

    // Most common delivery method
    popularDeliveryMethod: {
        type: String,
        enum: ['In-person', 'Online', 'Both'],
        default: 'Both'
    }
}, {
    timestamps: true
});

// Simple method to update all stats
skillCategorySchema.methods.updateStats = async function () {
    const Skill = mongoose.model('Skill');
    const skills = await Skill.find({ category: this.name });

    this.skillCount = skills.length;
    this.totalViews = skills.reduce((sum, skill) => sum + skill.viewCount, 0);
    this.totalExchanges = skills.reduce((sum, skill) => sum + skill.exchangeCount, 0);

    // Count unique users
    const uniqueUsers = new Set(skills.map(skill => skill.owner.toString()));
    this.userCount = uniqueUsers.size;

    // Find most common level
    const levelCounts = {};
    skills.forEach(skill => {
        levelCounts[skill.level] = (levelCounts[skill.level] || 0) + 1;
    });
    this.popularLevel = Object.keys(levelCounts).reduce((a, b) =>
        levelCounts[a] > levelCounts[b] ? a : b, 'Beginner');

    // Find most common delivery method
    const deliveryCounts = {};
    skills.forEach(skill => {
        deliveryCounts[skill.deliveryMethod] = (deliveryCounts[skill.deliveryMethod] || 0) + 1;
    });
    this.popularDeliveryMethod = Object.keys(deliveryCounts).reduce((a, b) =>
        deliveryCounts[a] > deliveryCounts[b] ? a : b, 'Both');

    await this.save();
};

export default mongoose.models.SkillCategory || mongoose.model('SkillCategory', skillCategorySchema);
