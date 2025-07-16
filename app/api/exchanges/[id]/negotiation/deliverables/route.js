// api/exchanges/[id]/negotiation/deliverables/route.js

import connectDB from '@/lib/mongodb';
import NegotiationSession from '@/models/NegotiationSession';
import Exchange from '@/models/Exchange';
import User from '@/models/User';
import Dispute from '@/models/Dispute'; // NEW: Import Dispute model
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getUserRoleInExchange } from '@/utils/roleBasedPermissions';

// GET: Get deliverables and progress
export async function GET(request, { params }) {
    try {
        await connectDB();

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { id: exchangeId } = await params;

        // Get exchange and negotiation
        const exchange = await Exchange.findById(exchangeId);
        const negotiation = await NegotiationSession.findOne({ exchangeId });

        if (!exchange || !negotiation) {
            return NextResponse.json(
                { success: false, error: 'Exchange or negotiation not found' },
                { status: 404 }
            );
        }

        // Check if user is participant
        const isParticipant = 
            exchange.initiator.supabaseId === user.id ||
            exchange.recipient.supabaseId === user.id;

        if (!isParticipant) {
            return NextResponse.json(
                { success: false, error: 'Not authorized to access this negotiation' },
                { status: 403 }
            );
        }

        // Get user's role
        const roleInfo = getUserRoleInExchange(exchange, user.id);

        return NextResponse.json({
            success: true,
            deliverables: negotiation.terms.deliverables,
            progressReport: negotiation.progressReport,
            userRole: roleInfo.exchangeRole,
            negotiationStatus: negotiation.status
        });

    } catch (error) {
        console.error('Error fetching deliverables:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch deliverables' },
            { status: 500 }
        );
    }
}

// PATCH: Mark deliverable as complete/incomplete
export async function PATCH(request, { params }) {
    try {
        await connectDB();

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { id: exchangeId } = await params;
        const { deliverableIndex, completed } = await request.json();

        // Validate input
        if (typeof deliverableIndex !== 'number' || typeof completed !== 'boolean') {
            return NextResponse.json(
                { success: false, error: 'Missing or invalid deliverableIndex or completed' },
                { status: 400 }
            );
        }

        // Get exchange and negotiation
        const exchange = await Exchange.findById(exchangeId);
        const negotiation = await NegotiationSession.findOne({ exchangeId });

        if (!exchange || !negotiation) {
            return NextResponse.json(
                { success: false, error: 'Exchange or negotiation not found' },
                { status: 404 }
            );
        }

        // Check if user is participant
        const isParticipant = 
            exchange.initiator.supabaseId === user.id ||
            exchange.recipient.supabaseId === user.id;

        if (!isParticipant) {
            return NextResponse.json(
                { success: false, error: 'Not authorized to modify this negotiation' },
                { status: 403 }
            );
        }

        // Get user's role (users can only mark their own deliverables)
        const roleInfo = getUserRoleInExchange(exchange, user.id);
        const userRole = roleInfo.exchangeRole;

        // Check if deliverable exists
        const deliverables = negotiation.terms.deliverables[userRole];
        if (!deliverables || deliverableIndex >= deliverables.length || deliverableIndex < 0) {
            return NextResponse.json(
                { success: false, error: 'Invalid deliverable index' },
                { status: 400 }
            );
        }

        // Update deliverable completion
        if (completed) {
            await negotiation.completeDeliverable(userRole, deliverableIndex);
        } else {
            // Mark as incomplete
            deliverables[deliverableIndex].completed = false;
            deliverables[deliverableIndex].completedAt = null;
            negotiation.lastModifiedBy = user.id;
            await negotiation.save();
        }

        const wasCompleted = negotiation.status === 'completed';

        return NextResponse.json({
            success: true,
            deliverable: deliverables[deliverableIndex],
            progressReport: negotiation.progressReport,
            allCompleted: wasCompleted,
            message: completed 
                ? (wasCompleted ? 'All deliverables completed!' : 'Deliverable marked complete')
                : 'Deliverable marked incomplete'
        });

    } catch (error) {
        console.error('Error updating deliverable:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update deliverable' },
            { status: 500 }
        );
    }
}

// POST: Confirm other user's deliverable OR create dispute
export async function POST(request, { params }) {
    try {
        await connectDB();

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { id: exchangeId } = await params;
        const { action, deliverableIndex, reason } = await request.json();

        // Validate input
        if (!action || typeof deliverableIndex !== 'number') {
            return NextResponse.json(
                { success: false, error: 'Missing action or deliverableIndex' },
                { status: 400 }
            );
        }

        // Get exchange, negotiation, and user data
        const exchange = await Exchange.findById(exchangeId);
        const negotiation = await NegotiationSession.findOne({ exchangeId });
        const userDoc = await User.findOne({ supabaseId: user.id });

        if (!exchange || !negotiation || !userDoc) {
            return NextResponse.json(
                { success: false, error: 'Exchange, negotiation, or user not found' },
                { status: 404 }
            );
        }

        // Check if user is participant
        const isParticipant = 
            exchange.initiator?.supabaseId === user.id ||
            exchange.recipient?.supabaseId === user.id;

        if (!isParticipant) {
            return NextResponse.json(
                { success: false, error: 'Not authorized' },
                { status: 403 }
            );
        }

        // Get user's role
        const roleInfo = getUserRoleInExchange(exchange, user.id);
        const userRole = roleInfo.exchangeRole;

        // Validate data structure
        if (!negotiation.terms?.deliverables) {
            return NextResponse.json(
                { success: false, error: 'Negotiation terms or deliverables not found' },
                { status: 404 }
            );
        }

        const { initiator = [], recipient = [] } = negotiation.terms.deliverables;
        
        // Calculate otherRole exactly like confirmDeliverable does
        const otherRole = userRole === 'initiator' ? 'recipient' : 'initiator';
        const targetDeliverables = negotiation.terms.deliverables[otherRole];

        // Validate deliverable exists at index
        if (!targetDeliverables || deliverableIndex >= targetDeliverables.length || deliverableIndex < 0) {
            return NextResponse.json(
                { success: false, error: 'Invalid deliverable index' },
                { status: 400 }
            );
        }

        const targetDeliverable = targetDeliverables[deliverableIndex];

        if (action === 'confirm') {
            // Validate deliverable state BEFORE calling confirmDeliverable
            if (!targetDeliverable.completed) {
                return NextResponse.json(
                    { success: false, error: 'Deliverable must be completed before confirmation' },
                    { status: 400 }
                );
            }

            if (targetDeliverable.confirmedBy) {
                return NextResponse.json(
                    { success: false, error: 'Deliverable already confirmed' },
                    { status: 400 }
                );
            }

            if (targetDeliverable.disputeRaised) {
                return NextResponse.json(
                    { success: false, error: 'Cannot confirm disputed deliverable' },
                    { status: 400 }
                );
            }

            // Call confirmDeliverable with exact parameters
            await negotiation.confirmDeliverable(userRole, deliverableIndex, userDoc._id);
            
            // Refresh negotiation to get updated progressReport
            await negotiation.populate('exchangeId');
            
            return NextResponse.json({
                success: true,
                message: 'Deliverable confirmed successfully',
                progressReport: negotiation.progressReport,
                allCompleted: negotiation.status === 'completed'
            });
            
        } else if (action === 'dispute') {
            if (!reason || reason.trim() === '') {
                return NextResponse.json(
                    { success: false, error: 'Dispute reason required' },
                    { status: 400 }
                );
            }

            if (!targetDeliverable.completed) {
                return NextResponse.json(
                    { success: false, error: 'Cannot dispute incomplete deliverable' },
                    { status: 400 }
                );
            }

            if (targetDeliverable.confirmedBy) {
                return NextResponse.json(
                    { success: false, error: 'Cannot dispute confirmed deliverable' },
                    { status: 400 }
                );
            }

            if (targetDeliverable.disputeRaised) {
                return NextResponse.json(
                    { success: false, error: 'Deliverable already disputed' },
                    { status: 400 }
                );
            }

            // NEW: Create proper Dispute document instead of just updating deliverable
            const disputeDescription = `Dispute regarding deliverable: "${targetDeliverable.title}"\n\nReason: ${reason}`;
            const disputeEvidence = `Deliverable Index: ${deliverableIndex}\nDeliverable Title: ${targetDeliverable.title}\nCompleted At: ${targetDeliverable.completedAt}\nUser Role: ${userRole}\nOther Role: ${otherRole}`;

            // Create the dispute document
            const dispute = new Dispute({
                exchangeId: exchange._id,
                raisedBy: userDoc._id,
                description: disputeDescription,
                evidence: disputeEvidence
            });

            await dispute.save();

            // Update exchange to mark it has disputes
            await Exchange.findByIdAndUpdate(exchange._id, {
                'disputeStatus.hasDispute': true
            });

            // KEEP the old deliverable dispute tracking for backward compatibility
            await negotiation.raiseDispute(userRole, deliverableIndex, reason);
            
            return NextResponse.json({
                success: true,
                message: 'Dispute raised successfully',
                disputeId: dispute.disputeId,
                progressReport: negotiation.progressReport
            });
        }

        return NextResponse.json(
            { success: false, error: 'Invalid action' },
            { status: 400 }
        );

    } catch (error) {
        console.error('Error handling deliverable action:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to process action' },
            { status: 500 }
        );
    }
}
