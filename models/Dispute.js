// models/Dispute.js
import mongoose from 'mongoose';

const disputeSchema = new mongoose.Schema({
    // Core dispute information
    disputeId: {
        type: String,
        unique: true,
        required: true,
        default: () => `DISP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    },

    // Associated exchange
    exchangeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exchange',
        required: true
    },

    // Who raised the dispute - simplified to just userId
    raisedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Simple text description and evidence
    description: {
        type: String,
        required: true,
        maxLength: 1000
    },

    // Evidence as simple text field
    evidence: {
        type: String,
        maxLength: 2000
    },

    // Simple status - only open and resolved
    status: {
        type: String,
        enum: ['open', 'resolved'],
        default: 'open'
    },

    // Who resolved it - admin userId
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Admin resolution details
    resolution: {
        decision: String,
        reasoning: String,
        resolvedAt: Date
    }
}, {
    timestamps: true
});

// Indexes for admin queries
disputeSchema.index({ status: 1, createdAt: -1 });
disputeSchema.index({ exchangeId: 1 });
disputeSchema.index({ raisedBy: 1 });

export default mongoose.models.Dispute || mongoose.model('Dispute', disputeSchema);
