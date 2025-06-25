import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    // Exchange Integration (Primary Key Relationship)
    exchangeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exchange',
        required: true,
        index: true
    },

    // Message Content
    content: {
        type: String,
        required: function () {
            return this.type === 'user'; // Required only for user messages
        },
        maxLength: 1000,
        trim: true
    },

    // Sender Information
    sender: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: function () {
                return this.type === 'user'; // Required only for user messages
            }
        },
        supabaseId: {
            type: String,
            required: function () {
                return this.type === 'user'; // Required only for user messages
            }
        },
        role: {
            type: String,
            enum: ['initiator', 'recipient'],
            required: function () {
                return this.type === 'user'; // Required only for user messages
            }
        }
    },

    // Message Type
    type: {
        type: String,
        enum: [
            'user',              // Regular user messages
            'system',            // System notifications
            'offer_update',      // Offer change notifications
            'status_change'      // Exchange status updates
        ],
        required: true,
        default: 'user'
    },

    // System Message Data (for automated messages)
    systemData: {
        event: {
            type: String,
            enum: [
                'exchange_created',
                'negotiation_started',
                'offer_updated',
                'status_changed',
                'deadline_warning',
                'exchange_completed',
                'exchange_cancelled',
                'exchange_expired'
            ]
        },
        details: {
            previousOffer: mongoose.Schema.Types.Mixed,
            newOffer: mongoose.Schema.Types.Mixed,
            previousStatus: String,
            newStatus: String,
            triggeredBy: String, // supabaseId of user who triggered event
            metadata: mongoose.Schema.Types.Mixed
        }
    },

    // Read Status Tracking
    readBy: [{
        supabaseId: String,
        role: {
            type: String,
            enum: ['initiator', 'recipient']
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for Performance
messageSchema.index({ exchangeId: 1, createdAt: -1 }); // Main query pattern
messageSchema.index({ exchangeId: 1, type: 1 }); // Filter by message type
messageSchema.index({ 'sender.supabaseId': 1 }); // User message queries
messageSchema.index({ 'systemData.event': 1 }); // System message queries

// Virtual Fields
messageSchema.virtual('isUserMessage').get(function () {
    return this.type === 'user';
});

messageSchema.virtual('isSystemMessage').get(function () {
    return this.type !== 'user';
});

messageSchema.virtual('unreadCount').get(function () {
    return 2 - this.readBy.length; // 2 participants - read count
});

// Methods
messageSchema.methods.markAsRead = function (supabaseId, role) {
    const existingRead = this.readBy.find(read => read.supabaseId === supabaseId);
    if (!existingRead) {
        this.readBy.push({ supabaseId, role });
    }
    return this.save();
};

messageSchema.methods.isReadBy = function (supabaseId) {
    return this.readBy.some(read => read.supabaseId === supabaseId);
};

// Static Methods
messageSchema.statics.createSystemMessage = function (exchangeId, event, details = {}) {
    return this.create({
        exchangeId,
        type: 'system',
        systemData: { event, details }
    });
};

messageSchema.statics.getExchangeMessages = function (exchangeId, limit = 50, skip = 0) {
    return this.find({ exchangeId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate('sender.userId', 'name email');
};

messageSchema.statics.getUnreadCount = function (exchangeId, supabaseId) {
    return this.countDocuments({
        exchangeId,
        'readBy.supabaseId': { $ne: supabaseId }
    });
};

export default mongoose.models.Message || mongoose.model('Message', messageSchema);
