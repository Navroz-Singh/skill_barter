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

    // Initiator's Offer
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

    // Recipient's Offer
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

    // Consent and Acceptance
    consent: {
        initiatorAccepted: {
            type: Boolean,
            default: false
        },
        recipientAccepted: {
            type: Boolean,
            default: false
        },
        initiatorAcceptedAt: Date,
        recipientAcceptedAt: Date
    },

    // Milestones
    milestones: [{
        title: {
            type: String,
            required: true,
            maxLength: [100, 'Milestone title cannot exceed 100 characters']
        },
        description: String,
        assignedTo: {
            type: String,
            enum: ['initiator', 'recipient', 'both'],
            required: true
        },
        dueDate: Date,
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'completed', 'overdue'],
            default: 'pending'
        },
        completedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        completedAt: Date
    }],

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

    // Communication
    chatRoomId: {
        type: String,
        unique: true,
        default: () => `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    },
    lastMessageAt: Date,
    messageCount: {
        type: Number,
        default: 0
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

    // Terms
    terms: {
        customTerms: String,
        cancellationPolicy: {
            type: String,
            enum: ['flexible', 'moderate', 'strict'],
            default: 'moderate'
        }
    },

    // Expiry
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }
}, {
    timestamps: true
});

export default mongoose.models.Exchange || mongoose.model('Exchange', exchangeSchema);
