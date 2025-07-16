// models/Exchange.js
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

    // UPDATED: Exchange Type (simplified from 3 to 2 types)
    exchangeType: {
        type: String,
        enum: ['skill_for_skill', 'skill_for_money'],
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

    // Two-Step Acceptance System
    acceptance: {
        initiatorAccepted: {
            type: Boolean,
            default: false
        },
        recipientAccepted: {
            type: Boolean,
            default: false
        },
        initiatorAcceptedAt: Date,
        recipientAcceptedAt: Date,
        fullyAcceptedAt: Date // When both users have accepted
    },

    // Exchange Status
    status: {
        type: String,
        enum: [
            'pending',
            'negotiating',
            'pending_acceptance', // One user accepted, waiting for other
            'accepted',           // Both users accepted
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
        recipientDeliveredAt: Date,
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
        firstMessageAt: Date,
        lastMessageAt: Date,
        messageCount: {
            type: Number,
            default: 0
        },
        lastActivityBy: {
            type: String,
            enum: ['initiator', 'recipient']
        }
    },

    // Negotiation Progress Tracking with completion fields
    negotiationMetadata: {
        roundCount: {
            type: Number,
            default: 0
        },
        lastNegotiationUpdate: Date,
        negotiationStartedAt: Date,
        acceptedAt: Date,
        // Fields to track negotiation completion
        negotiationCompleted: {
            type: Boolean,
            default: false
        },
        negotiationCompletedAt: Date
    },

    // Activity Timestamps
    activityTimestamps: {
        initiatorLastSeen: Date,
        recipientLastSeen: Date,
        statusChangedAt: Date,
        lastOfferUpdateAt: Date
    },

    // Dispute Status
    disputeStatus: {
        hasDispute: { 
          type: Boolean, 
          default: false 
        }
      }
}, {
    timestamps: true
});

// Method to handle user acceptance
exchangeSchema.methods.acceptByUser = function(userSupabaseId) {
    const isInitiator = this.initiator.supabaseId === userSupabaseId;
    const now = new Date();
    
    if (isInitiator) {
        this.acceptance.initiatorAccepted = true;
        this.acceptance.initiatorAcceptedAt = now;
    } else {
        this.acceptance.recipientAccepted = true;
        this.acceptance.recipientAcceptedAt = now;
    }
    
    // Check if both have accepted
    if (this.acceptance.initiatorAccepted && this.acceptance.recipientAccepted) {
        this.status = 'accepted';
        this.acceptance.fullyAcceptedAt = now;
        this.negotiationMetadata.acceptedAt = now;
        
    } else {
        this.status = 'pending_acceptance';
    }
    
    this.activityTimestamps.statusChangedAt = now;
    return this;
};

// Method to check if user has accepted
exchangeSchema.methods.hasUserAccepted = function(userSupabaseId) {
    const isInitiator = this.initiator.supabaseId === userSupabaseId;
    return isInitiator ? this.acceptance?.initiatorAccepted : this.acceptance?.recipientAccepted;
};

// Method to get acceptance status
exchangeSchema.methods.getAcceptanceStatus = function() {
    return {
        initiatorAccepted: this.acceptance?.initiatorAccepted || false,
        recipientAccepted: this.acceptance?.recipientAccepted || false,
        bothAccepted: (this.acceptance?.initiatorAccepted && this.acceptance?.recipientAccepted) || false,
        pendingUser: !this.acceptance?.initiatorAccepted ? 'initiator' : 
                     !this.acceptance?.recipientAccepted ? 'recipient' : null
    };
};

// Chat availability includes pending_acceptance
exchangeSchema.methods.isChatAvailable = function () {
    return ['negotiating', 'pending_acceptance', 'accepted', 'in_progress'].includes(this.status);
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
