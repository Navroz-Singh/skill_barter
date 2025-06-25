// api/exchanges/[id]/chat-status

import connectDB from '@/lib/mongodb';
import Exchange from '@/models/Exchange';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Helper function to check if chat is available for exchange status
const isChatAvailable = (status) => {
    return ['negotiating', 'accepted', 'in_progress'].includes(status);
};

// Helper function to get chat status message
const getChatStatusMessage = (status) => {
    const messages = {
        'pending': 'Chat will be available once negotiation begins',
        'negotiating': 'Chat is active - you can communicate with the other party',
        'accepted': 'Chat is active - coordinate your exchange details',
        'in_progress': 'Chat is active - track progress and communicate',
        'completed': 'Exchange completed - chat is now closed',
        'cancelled': 'Exchange cancelled - chat is no longer available',
        'expired': 'Exchange expired - chat is no longer available'
    };

    return messages[status] || 'Chat status unknown';
};

// GET: Check if chat is available for exchange
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

        const { id: exchangeId } = await params;
        const userSupabaseId = user.id; // Use authenticated user ID

        // Find exchange
        const exchange = await Exchange.findById(exchangeId)
            .populate('initiator.userId', 'name email')
            .populate('recipient.userId', 'name email');

        if (!exchange) {
            return NextResponse.json(
                { success: false, error: 'Exchange not found' },
                { status: 404 }
            );
        }

        // Check if user is a participant
        const isInitiator = exchange.initiator.supabaseId === userSupabaseId;
        const isRecipient = exchange.recipient.supabaseId === userSupabaseId;
        const isParticipant = isInitiator || isRecipient;

        if (!isParticipant) {
            return NextResponse.json(
                { success: false, error: 'Not authorized to access this exchange' },
                { status: 403 }
            );
        }

        // Determine user's role and other participant info
        const userRole = isInitiator ? 'initiator' : 'recipient';
        const otherParticipant = isInitiator ? exchange.recipient : exchange.initiator;

        // Check chat availability
        const chatAvailable = isChatAvailable(exchange.status);
        const statusMessage = getChatStatusMessage(exchange.status);

        // Calculate exchange timeline info
        const now = new Date();
        const timeRemaining = exchange.expiresAt ? Math.max(0, exchange.expiresAt.getTime() - now.getTime()) : null;
        const daysRemaining = timeRemaining ? Math.ceil(timeRemaining / (1000 * 60 * 60 * 24)) : null;

        return NextResponse.json({
            success: true,
            chatStatus: {
                available: chatAvailable,
                message: statusMessage,
                canSendMessages: chatAvailable && isParticipant
            },
            exchangeInfo: {
                id: exchange._id,
                exchangeId: exchange.exchangeId,
                status: exchange.status,
                type: exchange.exchangeType,
                createdAt: exchange.createdAt,
                expiresAt: exchange.expiresAt,
                daysRemaining: daysRemaining
            },
            userInfo: {
                role: userRole,
                isInitiator: isInitiator,
                isRecipient: isRecipient
            },
            participants: {
                initiator: {
                    name: exchange.initiator.userId?.name || 'Unknown',
                    email: exchange.initiator.userId?.email || 'Unknown',
                    supabaseId: exchange.initiator.supabaseId,
                    isCurrentUser: isInitiator
                },
                recipient: {
                    name: exchange.recipient.userId?.name || 'Unknown',
                    email: exchange.recipient.userId?.email || 'Unknown',
                    supabaseId: exchange.recipient.supabaseId,
                    isCurrentUser: isRecipient
                },
                otherParty: {
                    name: otherParticipant.userId?.name || 'Unknown',
                    role: isInitiator ? 'recipient' : 'initiator',
                    supabaseId: otherParticipant.supabaseId
                }
            },
            offers: {
                initiator: exchange.initiatorOffer,
                recipient: exchange.recipientOffer
            }
        });

    } catch (error) {
        console.error('Error checking exchange chat status:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to check chat status' },
            { status: 500 }
        );
    }
}
