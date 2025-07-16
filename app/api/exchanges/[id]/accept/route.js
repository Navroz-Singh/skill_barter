// api/exchanges/[id]/accept/route.js

import connectDB from '@/lib/mongodb';
import Exchange from '@/models/Exchange';
import { createClient } from '@/lib/supabase/server';
import NegotiationSession from '@/models/NegotiationSession'; // Added
import { NextResponse } from 'next/server';

// GET: Fetch acceptance status (migrated from separate route)
export async function GET(request, { params }) {
    try {
        await connectDB();
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
        }
        const { id: exchangeId } = params;
        const exchange = await Exchange.findById(exchangeId);
        if (!exchange) {
            return NextResponse.json({ success: false, error: 'Exchange not found' }, { status: 404 });
        }
        // Participant check
        const isInitiator = exchange.initiator.supabaseId === user.id;
        const isRecipient = exchange.recipient.supabaseId === user.id;
        if (!isInitiator && !isRecipient) {
            return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
        }
        const acceptanceStatus = exchange.getAcceptanceStatus();
        return NextResponse.json({ success: true, exchange, acceptanceStatus });
    } catch (error) {
        console.error('Error fetching acceptance:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch acceptance status' }, { status: 500 });
    }
}

// POST: Accept the exchange
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

        // Get exchange
        const exchange = await Exchange.findById(exchangeId);

        if (!exchange) {
            return NextResponse.json(
                { success: false, error: 'Exchange not found' },
                { status: 404 }
            );
        }

        // Check if user is participant
        const isParticipant = 
            exchange.initiator.supabaseId === user.id ||
            exchange.recipient.supabaseId === user.id;

        if (!isParticipant) {
            return NextResponse.json(
                { success: false, error: 'Not authorized to accept this exchange' },
                { status: 403 }
            );
        }

        // Fetch negotiation session to verify agreement
        const negotiation = await NegotiationSession.findOne({ exchangeId });
        const negotiationAgreed = negotiation?.bothAgreed || false;

        // Require negotiation to be fully agreed
        if (!negotiationAgreed) {
            return NextResponse.json(
                { success: false, error: 'Cannot accept exchange until negotiation terms are agreed by both parties' },
                { status: 400 }
            );
        }

        // Ensure exchange status reflects completion of negotiation
        if (exchange.status === 'negotiating') {
            exchange.status = 'pending_acceptance';
            exchange.negotiationMetadata.negotiationCompleted = true;
            exchange.negotiationMetadata.negotiationCompletedAt = new Date();
        } else if (exchange.status !== 'pending_acceptance') {
            return NextResponse.json(
                { success: false, error: `Cannot accept exchange in current status: ${exchange.status}` },
                { status: 400 }
            );
        }

        // Check if user already accepted
        if (exchange.hasUserAccepted(user.id)) {
            return NextResponse.json(
                { success: false, error: 'You have already accepted this exchange' },
                { status: 400 }
            );
        }

        // Mark user acceptance using exchange method
        exchange.acceptByUser(user.id);
        
        // Save the exchange
        await exchange.save();

        // Get updated acceptance status
        const acceptanceStatus = exchange.getAcceptanceStatus();
        const userRole = exchange.initiator.supabaseId === user.id ? 'initiator' : 'recipient';
        
        // Determine message based on acceptance state
        let message;
        let nextStep;
        
        if (acceptanceStatus.bothAccepted) {
            message = 'Both parties have accepted! Exchange is now active and ready for execution.';
            nextStep = 'start_execution';
        } else {
            message = 'Your acceptance recorded. Waiting for other party to accept.';
            nextStep = 'wait_for_other_acceptance';
        }

        return NextResponse.json({
            success: true,
            exchange,
            acceptanceStatus: {
                userAccepted: true,
                otherUserAccepted: userRole === 'initiator' 
                    ? acceptanceStatus.recipientAccepted 
                    : acceptanceStatus.initiatorAccepted,
                bothAccepted: acceptanceStatus.bothAccepted,
                userRole,
                exchangeStatus: exchange.status,
                acceptanceTimestamps: {
                    initiatorAcceptedAt: exchange.acceptance?.initiatorAcceptedAt,
                    recipientAcceptedAt: exchange.acceptance?.recipientAcceptedAt,
                    fullyAcceptedAt: exchange.acceptance?.fullyAcceptedAt
                }
            },
            bothAccepted: acceptanceStatus.bothAccepted,
            message,
            nextStep
        });

    } catch (error) {
        console.error('Error accepting exchange:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to accept exchange' },
            { status: 500 }
        );
    }
}
