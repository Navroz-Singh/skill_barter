// api/exchanges/[id]/negotiation/agreement/route.js

import connectDB from '@/lib/mongodb';
import NegotiationSession from '@/models/NegotiationSession';
import Exchange from '@/models/Exchange';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getUserRoleInExchange } from '@/utils/roleBasedPermissions';

// GET: Check agreement status for current user
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

        // Get user's role and agreement status
        const roleInfo = getUserRoleInExchange(exchange, user.id);
        const userAgreed = negotiation.agreed[roleInfo.exchangeRole];
        const otherRole = roleInfo.exchangeRole === 'initiator' ? 'recipient' : 'initiator';
        const otherUserAgreed = negotiation.agreed[otherRole];

        return NextResponse.json({
            success: true,
            agreementStatus: {
                userAgreed,
                otherUserAgreed,
                bothAgreed: negotiation.bothAgreed,
                canAgree: !userAgreed && ['drafting', 'negotiating'].includes(negotiation.status),
                negotiationStatus: negotiation.status,
                userRole: roleInfo.exchangeRole
            }
        });

    } catch (error) {
        console.error('Error getting agreement status:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get agreement status' },
            { status: 500 }
        );
    }
}

// FIXED: POST - Mark user agreement with Exchange status sync
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

        // Check if negotiation allows agreement
        if (!['drafting', 'negotiating'].includes(negotiation.status)) {
            return NextResponse.json(
                { success: false, error: `Cannot agree in current status: ${negotiation.status}` },
                { status: 400 }
            );
        }

        // Get user's role
        const roleInfo = getUserRoleInExchange(exchange, user.id);
        
        // Check if user already agreed
        if (negotiation.agreed[roleInfo.exchangeRole]) {
            return NextResponse.json(
                { success: false, error: 'You have already agreed to these terms' },
                { status: 400 }
            );
        }

        // Mark agreement using model method (this also updates Exchange if both agree)
        await negotiation.markAgreement(user.id, exchange);

        const bothAgreed = negotiation.bothAgreed;

        // FIXED: Backup Exchange status sync (in case model method fails)
        if (bothAgreed) {
            try {
                await Exchange.findByIdAndUpdate(exchangeId, {
                    status: 'pending_acceptance',
                    'negotiationMetadata.negotiationCompleted': true,
                    'negotiationMetadata.negotiationCompletedAt': new Date()
                });
                
                console.log(`Exchange ${exchangeId} status updated to pending_acceptance`);
            } catch (exchangeUpdateError) {
                console.error('Backup Exchange status update failed:', exchangeUpdateError);
                // Don't fail the whole request if Exchange update fails
            }
        }

        // FIXED: Enhanced message based on agreement status
        const message = bothAgreed 
            ? 'Both parties agreed! Terms are locked. Ready for final acceptance.' 
            : 'Your agreement recorded. Waiting for other party to agree.';

        return NextResponse.json({
            success: true,
            negotiation,
            bothAgreed,
            userRole: roleInfo.exchangeRole,
            message,
            // FIXED: Add exchange status info for frontend
            exchangeStatusUpdated: bothAgreed,
            nextStep: bothAgreed ? 'final_acceptance' : 'wait_for_agreement'
        });

    } catch (error) {
        console.error('Error marking agreement:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to mark agreement' },
            { status: 500 }
        );
    }
}
