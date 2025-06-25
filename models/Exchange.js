import mongoose from 'mongoose';

const exchangeSchema = new mongoose.Schema({
    // Basic Exchange Information
    exchangeId: {
        type: String,
        unique: true,
        required: true,
        default: () => `EXC-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    },

    // Participants
    initiator: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        supabaseId: {
            type: String,
            required: true
        }
    },
    recipient: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        supabaseId: {
            type: String,
            required: true
        }
    },

    // Exchange Type
    exchangeType: {
        type: String,
        enum: ['skill_for_skill', 'skill_for_money', 'money_for_skill'],
        required: true
    },

    // Initiator's Offer (KEEPING ALL ORIGINAL FIELDS)
    initiatorOffer: {
        type: {
            type: String,
            enum: ['skill', 'money'],
            required: true
        },
        skillId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Skill'
        },
        skillTitle: String,
        monetaryAmount: {
            type: Number,
            min: [0, 'Amount cannot be negative']
        },
        currency: {
            type: String,
            default: 'USD',
            enum: ['USD', 'EUR', 'GBP', 'INR']
        },
        description: {
            type: String,
            required: true,
            maxLength: [1000, 'Description cannot exceed 1000 characters'],
            trim: true
        },
        estimatedHours: Number,
        deliveryDate: Date,
        deliveryMethod: {
            type: String,
            enum: ['In-person', 'Online', 'Both'],
            required: true
        }
    },

    // Recipient's Offer (KEEPING ALL ORIGINAL FIELDS)
    recipientOffer: {
        type: {
            type: String,
            enum: ['skill', 'money'],
            required: true
        },
        skillId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Skill'
        },
        skillTitle: String,
        monetaryAmount: {
            type: Number,
            min: [0, 'Amount cannot be negative']
        },
        currency: {
            type: String,
            default: 'USD',
            enum: ['USD', 'EUR', 'GBP', 'INR']
        },
        description: {
            type: String,
            maxLength: [1000, 'Description cannot exceed 1000 characters'],
            trim: true
        },
        estimatedHours: Number,
        deliveryDate: Date,
        deliveryMethod: {
            type: String,
            enum: ['In-person', 'Online', 'Both']
        }
    },

    // Exchange Status
    status: {
        type: String,
        enum: [
            'pending',
            'negotiating',
            'accepted',
            'in_progress',
            'completed',
            'cancelled',
            'expired'
        ],
        default: 'pending'
    },

    // Payment and Escrow
    payment: {
        escrowAmount: {
            type: Number,
            min: 0
        },
        escrowStatus: {
            type: String,
            enum: ['none', 'pending', 'held', 'released', 'refunded'],
            default: 'none'
        },
        transactionId: String
    },

    // Delivery Status
    delivery: {
        initiatorDelivered: {
            type: Boolean,
            default: false
        },
        recipientDelivered: {
            type: Boolean,
            default: false
        },
        initiatorDeliveredAt: Date,
        recipientDelivered

            : Date,
        deliveryNotes: {
            initiator: String,
            recipient: String
        }
    },

    // Rating and Feedback
    feedback: {
        initiatorRating: {
            rating: {
                type: Number,
                min: 1,
                max: 5
            },
            review: {
                type: String,
                maxLength: [500, 'Review cannot exceed 500 characters']
            },
            ratedAt: Date
        },
        recipientRating: {
            rating: {
                type: Number,
                min: 1,
                max: 5
            },
            review: {
                type: String,
                maxLength: [500, 'Review cannot exceed 500 characters']
            },
            ratedAt: Date
        }
    },

    // Expiry
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    },

    chatMetadata: {
        firstMessageAt: Date,           // When chat conversation started
        lastMessageAt: Date,            // Last message timestamp
        messageCount: {                 // Quick message count tracking
            type: Number,
            default: 0
        },
        lastActivityBy: {               // Who was last active in chat
            type: String,               // supabaseId
            enum: ['initiator', 'recipient']
        }
    },

    // Negotiation Progress Tracking (NEW)
    negotiationMetadata: {
        roundCount: {                   // How many negotiation rounds
            type: Number,
            default: 0
        },
        lastNegotiationUpdate: Date,    // When offers were last modified
        negotiationStartedAt: Date,     // When status changed to 'negotiating'
        acceptedAt: Date               // When status changed to 'accepted'
    },

    // Activity Timestamps (NEW)
    activityTimestamps: {
        initiatorLastSeen: Date,        // Last time initiator was active
        recipientLastSeen: Date,        // Last time recipient was active
        statusChangedAt: Date,          // When current status was set
        lastOfferUpdateAt: Date         // When any offer was last updated
    }
}, {
    timestamps: true
});

exchangeSchema.methods.isChatAvailable = function () {
    return ['negotiating', 'accepted', 'in_progress'].includes(this.status);
};

exchangeSchema.methods.getChatParticipants = function () {
    return [
        { supabaseId: this.initiator.supabaseId, role: 'initiator' },
        { supabaseId: this.recipient.supabaseId, role: 'recipient' }
    ];
};

exchangeSchema.methods.updateLastActivity = function (userSupabaseId) {
    const isInitiator = this.initiator.supabaseId === userSupabaseId;
    if (isInitiator) {
        this.activityTimestamps.initiatorLastSeen = new Date();
    } else {
        this.activityTimestamps.recipientLastSeen = new Date();
    }
    return this.save();
};

exchangeSchema.methods.incrementMessageCount = function () {
    this.chatMetadata.messageCount += 1;
    this.chatMetadata.lastMessageAt = new Date();
    return this.save();
};

export default mongoose.models.Exchange || mongoose.model('Exchange', exchangeSchema);
