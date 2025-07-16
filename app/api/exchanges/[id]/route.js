// api/exchanges/[id]/route.js
import connectDB from '@/lib/mongodb';
import Exchange from '@/models/Exchange';
import User from '@/models/User';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET: Get single exchange by ID (NO CHANGES NEEDED)
export async function GET(request, { params }) {
    try {
        await connectDB();

        // Authenticate user
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { id } = await params;

        const exchange = await Exchange.findById(id)
            .populate('initiator.userId', 'name email')
            .populate('recipient.userId', 'name email');

        if (!exchange) {
            return NextResponse.json(
                { success: false, error: 'Exchange not found' },
                { status: 404 }
            );
        }

        const adminUser = await User.findOne({ supabaseId: user.id });
        // Check if user is a participant in this exchange
        const isParticipant =
            exchange.initiator.supabaseId === user.id ||
            exchange.recipient.supabaseId === user.id ||
            adminUser.adminMetadata.isAdmin;

        if (!isParticipant) {
            return NextResponse.json(
                { success: false, error: 'Not authorized to access this exchange' },
                { status: 403 }
            );
        }

        return NextResponse.json({
            success: true,
            exchange
        });

    } catch (error) {
        console.error('Error fetching exchange:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch exchange' },
            { status: 500 }
        );
    }
}

// PATCH: Update exchange status or offers (UPDATED FOR CANCELLATION)
export async function PATCH(request, { params }) {
    try {
        await connectDB();

        // Authenticate user
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const updateData = await request.json();

        // First, get the exchange to check permissions
        const existingExchange = await Exchange.findById(id);

        if (!existingExchange) {
            return NextResponse.json(
                { success: false, error: 'Exchange not found' },
                { status: 404 }
            );
        }

        const adminUser = await User.findOne({ supabaseId: user.id });
        // Check if user is a participant in this exchange
        const isInitiator = existingExchange.initiator.supabaseId === user.id;
        const isRecipient = existingExchange.recipient.supabaseId === user.id;
        const isParticipant = isInitiator || isRecipient || adminUser.adminMetadata.isAdmin;

        if (!isParticipant) {
            return NextResponse.json(
                { success: false, error: 'Not authorized to modify this exchange' },
                { status: 403 }
            );
        }

        // Additional validation for specific update operations
        if (updateData.initiatorOffer && !isInitiator) {
            return NextResponse.json(
                { success: false, error: 'Only the initiator can update their offer' },
                { status: 403 }
            );
        }

        if (updateData.recipientOffer && !isRecipient) {
            return NextResponse.json(
                { success: false, error: 'Only the recipient can update their offer' },
                { status: 403 }
            );
        }

        // NEW: SPECIAL HANDLING FOR CANCELLATION
        if (updateData.status === 'cancelled') {
            // Validate that exchange can be cancelled (not in final states)
            if (['completed', 'cancelled', 'expired'].includes(existingExchange.status)) {
                return NextResponse.json(
                    { success: false, error: 'Cannot cancel exchange in current status' },
                    { status: 400 }
                );
            }

            // Update exchange with cancellation details
            existingExchange.status = 'cancelled';
            existingExchange.cancelledBy = updateData.cancelledBy || user.id;
            existingExchange.cancelledAt = updateData.cancelledAt || new Date();
            
            // Add to activity timestamps
            if (!existingExchange.activityTimestamps) {
                existingExchange.activityTimestamps = {};
            }
            existingExchange.activityTimestamps.statusChangedAt = new Date();
            existingExchange.updatedAt = new Date();
            
            // Save the exchange
            await existingExchange.save();

            // Populate for response
            await existingExchange.populate('initiator.userId', 'name email');
            await existingExchange.populate('recipient.userId', 'name email');

            return NextResponse.json({
                success: true,
                exchange: existingExchange,
                message: 'Exchange cancelled successfully'
            });
        }

        // SPECIAL HANDLING FOR ACCEPTANCE (EXISTING TWO-STEP LOGIC)
        if (updateData.status === 'accepted') {
            // Check if user has already accepted
            if (existingExchange.hasUserAccepted(user.id)) {
                return NextResponse.json(
                    { success: false, error: 'You have already accepted this exchange' },
                    { status: 400 }
                );
            }

            // Use the model method to handle acceptance
            existingExchange.acceptByUser(user.id);
            
            // Add updatedAt timestamp
            existingExchange.updatedAt = new Date();

            // Save the exchange
            await existingExchange.save();

            // Populate for response
            await existingExchange.populate('initiator.userId', 'name email');
            await existingExchange.populate('recipient.userId', 'name email');

            // Get acceptance status for response
            const acceptanceStatus = existingExchange.getAcceptanceStatus();

            return NextResponse.json({
                success: true,
                exchange: existingExchange,
                message: acceptanceStatus.bothAccepted 
                    ? 'Exchange fully accepted by both parties!' 
                    : 'Your acceptance recorded. Waiting for other party to accept.',
                acceptanceStatus: acceptanceStatus
            });
        }

        // UPDATED STATUS TRANSITION VALIDATION (includes cancellation)
        if (updateData.status && updateData.status !== 'accepted' && updateData.status !== 'cancelled') {
            const validStatusTransitions = {
                'pending': ['negotiating', 'cancelled'],
                'negotiating': ['pending_acceptance', 'cancelled'], // Can go to pending_acceptance via acceptance logic
                'pending_acceptance': ['accepted', 'cancelled'], // Manual transition or cancellation
                'accepted': ['in_progress', 'cancelled'],
                'in_progress': ['completed', 'cancelled'],
                'completed': [], // Final state
                'cancelled': [], // Final state
                'expired': [] // Final state
            };

            const currentStatus = existingExchange.status;
            const newStatus = updateData.status;

            if (!validStatusTransitions[currentStatus]?.includes(newStatus)) {
                return NextResponse.json(
                    { success: false, error: `Cannot change status from ${currentStatus} to ${newStatus}` },
                    { status: 400 }
                );
            }
        }

        // Handle offer updates (existing logic)
        if (updateData.initiatorOffer || updateData.recipientOffer) {
            const now = new Date();
            existingExchange.activityTimestamps.lastOfferUpdateAt = now;
            existingExchange.negotiationMetadata.lastNegotiationUpdate = now;
            existingExchange.negotiationMetadata.roundCount += 1;

            // Reset acceptance when offers are updated during negotiation
            if (existingExchange.status === 'pending_acceptance') {
                existingExchange.acceptance.initiatorAccepted = false;
                existingExchange.acceptance.recipientAccepted = false;
                existingExchange.acceptance.initiatorAcceptedAt = null;
                existingExchange.acceptance.recipientAcceptedAt = null;
                existingExchange.status = 'negotiating'; // Back to negotiating
            }
        }

        // Add updatedAt timestamp
        updateData.updatedAt = new Date();

        // Update the exchange (for non-acceptance and non-cancellation updates)
        const exchange = await Exchange.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        )
            .populate('initiator.userId', 'name email')
            .populate('recipient.userId', 'name email');

        return NextResponse.json({
            success: true,
            exchange,
            message: 'Exchange updated successfully'
        });

    } catch (error) {
        console.error('Error updating exchange:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update exchange' },
            { status: 500 }
        );
    }
}
