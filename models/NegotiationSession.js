// models/NegotiationSession.js
import mongoose from 'mongoose';

const negotiationSessionSchema = new mongoose.Schema({
    // Core reference
    exchangeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exchange',
        required: true,
        unique: true
    },

    // PRE-ACCEPTANCE TERMS (Essential deal terms)
    terms: {
        // Enhanced descriptions
        descriptions: {
            initiator: { type: String, maxLength: 500 },
            recipient: { type: String, maxLength: 500 }
        },
        // NEW: Selected skill ID per role
        skillIds: {
            initiator: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', default: null },
            recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', default: null }
        },

        // Deliverables with completion tracking
        deliverables: {
            initiator: [{
                title: { type: String, required: true },
                completed: { type: Boolean, default: false },
                completedAt: Date,
                // NEW: Peer confirmation fields
                confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                confirmedAt: Date,
                // NEW: Dispute tracking
                disputeRaised: { type: Boolean, default: false },
                disputeReason: String
            }],
            recipient: [{
                title: { type: String, required: true },
                completed: { type: Boolean, default: false },
                completedAt: Date,
                // NEW: Same fields for recipient
                confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                confirmedAt: Date,
                disputeRaised: { type: Boolean, default: false },
                disputeReason: String
            }]
        },

        // Timeline and effort
        deadline: Date,
        hours: {
            initiator: { type: Number, min: 0, max: 100 },
            recipient: { type: Number, min: 0, max: 100 }
        },

        // Financial
        amount: { type: Number, min: 0, default: 0 },
        currency: { type: String, default: 'INR' },
        paymentTimeline: {
            type: String,
            enum: ['upfront', 'completion'],
            default: 'completion'
        },

        // Delivery method
        method: {
            type: String,
            enum: ['in-person', 'online', 'flexible'],
            default: 'flexible'
        }
    },

    // Agreement tracking
    agreed: {
        initiator: { type: Boolean, default: false },
        recipient: { type: Boolean, default: false },
        initiatorAt: Date,
        recipientAt: Date
    },

    // POST-ACCEPTANCE EXECUTION
    execution: {
        startDate: Date,
        contactShared: { type: Boolean, default: false }
    },

    // Simple status
    status: {
        type: String,
        enum: ['drafting', 'negotiating', 'agreed', 'completed'],
        default: 'drafting'
    },

    // NEW: Track if user stats have been updated to prevent duplicate increments
    statsUpdated: {
        type: Boolean,
        default: false
    },

    // Minimal tracking
    lastModifiedBy: String

}, {
    timestamps: true
});

// VIRTUAL FIELDS (Inferred from stored data)

// Total hours
negotiationSessionSchema.virtual('totalHours').get(function () {
    return (this.terms.hours.initiator || 0) + (this.terms.hours.recipient || 0);
});

// UPDATED: Confirm deliverable method with user stats update
negotiationSessionSchema.methods.confirmDeliverable = async function (userRole, deliverableIndex, confirmingUserId) {
    const otherRole = userRole === 'initiator' ? 'recipient' : 'initiator';
    const deliverable = this.terms.deliverables[otherRole][deliverableIndex];
    
    if (deliverable && deliverable.completed && !deliverable.confirmedBy) {
        deliverable.confirmedBy = confirmingUserId;
        deliverable.confirmedAt = new Date();
        this.markModified('terms.deliverables');
        
        // Check if all deliverables are both completed and confirmed
        const allDeliverables = [
            ...this.terms.deliverables.initiator,
            ...this.terms.deliverables.recipient
        ];
        
        const allConfirmed = allDeliverables.every(d => d.completed && d.confirmedBy);
        
        if (allConfirmed && this.status !== 'completed') {
            const wasCompleted = this.status === 'completed';
            this.status = 'completed';

            try {
                // Dynamic imports to avoid circular dependency issues
                const { default: Exchange } = await import('./Exchange.js');
                const { default: User } = await import('./User.js');

                // Get the exchange data to access user information
                const exchange = await Exchange.findById(this.exchangeId);
                
                if (exchange) {
                    // Update Exchange status
                    await Exchange.findByIdAndUpdate(this.exchangeId, {
                        status: 'completed',
                        'activityTimestamps.statusChangedAt': new Date()
                    });

                    // NEW: Update user stats for successful exchanges
                    // Only update if not already done (prevent duplicate increments)
                    if (!this.statsUpdated) {
                        const updatePromises = [];

                        // Update initiator stats
                        if (exchange.initiator?.supabaseId) {
                            updatePromises.push(
                                User.findOneAndUpdate(
                                    { supabaseId: exchange.initiator.supabaseId },
                                    { $inc: { 'stats.successfulExchanges': 1 } },
                                    { new: true }
                                )
                            );
                        }

                        // Update recipient stats
                        if (exchange.recipient?.supabaseId) {
                            updatePromises.push(
                                User.findOneAndUpdate(
                                    { supabaseId: exchange.recipient.supabaseId },
                                    { $inc: { 'stats.successfulExchanges': 1 } },
                                    { new: true }
                                )
                            );
                        }

                        // Execute user stats updates in parallel
                        await Promise.all(updatePromises);
                        
                        // Mark stats as updated to prevent future duplicate increments
                        this.statsUpdated = true;
                        
                        console.log(`✅ Successfully updated stats for exchange ${this.exchangeId}`);
                    }
                }
            } catch (error) {
                console.error('Error syncing Exchange status and user stats:', error);
                // We don't throw here to avoid blocking the negotiation save flow
                // But we should log the error for monitoring
            }
        }
    }
    
    return this.save();
};

// Raise dispute on deliverable
negotiationSessionSchema.methods.raiseDispute = function (userRole, deliverableIndex, reason) {
    const otherRole = userRole === 'initiator' ? 'recipient' : 'initiator';
    const deliverable = this.terms.deliverables[otherRole][deliverableIndex];
    
    if (deliverable && deliverable.completed) {
        deliverable.disputeRaised = true;
        deliverable.disputeReason = reason;
    }
    
    return this.save();
};

// Both parties agreed
negotiationSessionSchema.virtual('bothAgreed').get(function () {
    return this.agreed.initiator && this.agreed.recipient;
});

// Payment method (inferred from amount and exchange type)
negotiationSessionSchema.virtual('paymentMethod').get(function () {
    if (this.terms.amount === 0) return 'none';
    return this.terms.paymentTimeline || 'completion';
});

// Progress report (inferred from deliverable completion)
negotiationSessionSchema.virtual('progressReport').get(function () {
    const iDeliverables = this.terms.deliverables.initiator || [];
    const rDeliverables = this.terms.deliverables.recipient || [];

    const iCompleted = iDeliverables.filter(d => d.completed).length;
    const rCompleted = rDeliverables.filter(d => d.completed).length;
    const iConfirmed = iDeliverables.filter(d => d.completed && d.confirmedBy).length;
    const rConfirmed = rDeliverables.filter(d => d.completed && d.confirmedBy).length;
    
    const totalDeliverables = iDeliverables.length + rDeliverables.length;
    const totalCompleted = iCompleted + rCompleted;
    const totalConfirmed = iConfirmed + rConfirmed;

    return {
        initiator: {
            total: iDeliverables.length,
            completed: iCompleted,
            confirmed: iConfirmed,
            percentage: iDeliverables.length > 0 ? Math.round((iCompleted / iDeliverables.length) * 100) : 0,
            confirmedPercentage: iDeliverables.length > 0 ? Math.round((iConfirmed / iDeliverables.length) * 100) : 0
        },
        recipient: {
            total: rDeliverables.length,
            completed: rCompleted,
            confirmed: rConfirmed,
            percentage: rDeliverables.length > 0 ? Math.round((rCompleted / rDeliverables.length) * 100) : 0,
            confirmedPercentage: rDeliverables.length > 0 ? Math.round((rConfirmed / rDeliverables.length) * 100) : 0
        },
        overall: {
            total: totalDeliverables,
            completed: totalCompleted,
            confirmed: totalConfirmed,
            percentage: totalDeliverables > 0 ? Math.round((totalCompleted / totalDeliverables) * 100) : 0,
            confirmedPercentage: totalDeliverables > 0 ? Math.round((totalConfirmed / totalDeliverables) * 100) : 0
        }
    };
});

// SIMPLE METHODS

// FIXED: Mark agreement with Exchange status sync
negotiationSessionSchema.methods.markAgreement = async function (userSupabaseId, exchangeData) {
    const userRole = exchangeData.initiator.supabaseId === userSupabaseId ? 'initiator' : 'recipient';

    this.agreed[userRole] = true;
    this.agreed[`${userRole}At`] = new Date();
    this.lastModifiedBy = userSupabaseId;

    if (this.bothAgreed) {
        this.status = 'agreed';

        // FIXED: Update the linked Exchange status when both agree
        try {
            // Dynamic import to avoid circular dependency
            const { default: Exchange } = await import('./Exchange.js');

            await Exchange.findByIdAndUpdate(this.exchangeId, {
                status: 'pending_acceptance',
                // Add flag to track negotiation completion
                'negotiationMetadata.negotiationCompleted': true,
                'negotiationMetadata.negotiationCompletedAt': new Date()
            });
        } catch (error) {
            console.error('Error updating Exchange status:', error);
            // Don't throw here to avoid breaking the negotiation save
        }
    }

    return this.save();
};

// Update terms
negotiationSessionSchema.methods.updateTerms = function (newTerms, userSupabaseId) {
    Object.assign(this.terms, newTerms);

    // Reset agreements
    this.agreed.initiator = false;
    this.agreed.recipient = false;
    this.agreed.initiatorAt = null;
    this.agreed.recipientAt = null;

    this.status = 'negotiating';
    this.lastModifiedBy = userSupabaseId;

    return this.save();
};

// NEW: Updated completeDeliverable method with potential stats update
negotiationSessionSchema.methods.completeDeliverable = async function (userRole, deliverableIndex, userId) {
    const deliverable = this.terms.deliverables[userRole][deliverableIndex];
    if (deliverable && !deliverable.completed) {
        deliverable.completed = true;
        deliverable.completedAt = new Date();
        if (userId) {
            deliverable.completedBy = userId;
        }
        this.markModified('terms.deliverables');

        // Check if all deliverables are completed and confirmed
        const allDeliverables = [
            ...this.terms.deliverables.initiator,
            ...this.terms.deliverables.recipient
        ];
        
        const allCompletedAndConfirmed = allDeliverables.every(d => d.completed && d.confirmedBy);
        
        // Auto-complete if all deliverables are done and confirmed
        if (allCompletedAndConfirmed && this.status !== 'completed') {
            this.status = 'completed';
            
            // Update user stats when auto-completing
            try {
                const { default: Exchange } = await import('./Exchange.js');
                const { default: User } = await import('./User.js');

                const exchange = await Exchange.findById(this.exchangeId);
                
                if (exchange && !this.statsUpdated) {
                    // Update user stats for successful exchanges
                    const updatePromises = [];

                    if (exchange.initiator?.supabaseId) {
                        updatePromises.push(
                            User.findOneAndUpdate(
                                { supabaseId: exchange.initiator.supabaseId },
                                { $inc: { 'stats.successfulExchanges': 1 } },
                                { new: true }
                            )
                        );
                    }

                    if (exchange.recipient?.supabaseId) {
                        updatePromises.push(
                            User.findOneAndUpdate(
                                { supabaseId: exchange.recipient.supabaseId },
                                { $inc: { 'stats.successfulExchanges': 1 } },
                                { new: true }
                            )
                        );
                    }

                    await Promise.all(updatePromises);
                    this.statsUpdated = true;
                    
                    console.log(`✅ Auto-completed and updated stats for exchange ${this.exchangeId}`);
                }
            } catch (error) {
                console.error('Error updating user stats on auto-completion:', error);
            }
        }
    }

    return this.save();
};

// Start execution
negotiationSessionSchema.methods.startExecution = function (startDate) {
    this.execution.startDate = startDate;
    this.execution.contactShared = true;
    // Execution phase is now handled within the 'agreed' status. We keep the timestamp for reference but avoid a separate status.
    // this.status = 'executing';
    // Optionally keep status unchanged or ensure it's at least 'agreed'
    if (this.status !== 'agreed' && this.status !== 'completed') {
        this.status = 'agreed';
    }

    return this.save();
};

// SIMPLE INDEXES
negotiationSessionSchema.index({ status: 1 });
negotiationSessionSchema.index({ statsUpdated: 1 }); // NEW: Index for stats tracking

// AUTO-EXPIRE: mark exchange as expired when negotiation deadline has passed
negotiationSessionSchema.post('findOne', async function (doc) {
    if (!doc) return;

    const deadline = doc.terms?.deadline;
    if (deadline && deadline < new Date()) {
        try {
            const { default: Exchange } = await import('./Exchange.js');
            await Exchange.findByIdAndUpdate(doc.exchangeId, {
                status: 'expired',
                'activityTimestamps.statusChangedAt': new Date()
            });
        } catch (err) {
            console.error('Error auto-expiring exchange:', err);
        }
    }
});

export default mongoose.models.NegotiationSession || mongoose.model('NegotiationSession', negotiationSessionSchema);
