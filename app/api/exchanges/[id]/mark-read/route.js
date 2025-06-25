// api/exchanges/[id]/mark-read

import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import Exchange from '@/models/Exchange';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Helper function to check if chat is available for exchange status
const isChatAvailable = (status) => {
    return ['negotiating', 'accepted', 'in_progress'].includes(status);
};

// PATCH: Mark messages as read by current user
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

        const { id: exchangeId } = await params;
        const userSupabaseId = user.id; // Use authenticated user ID

        // Validate exchange exists
        const exchange = await Exchange.findById(exchangeId);
        if (!exchange) {
            return NextResponse.json(
                { success: false, error: 'Exchange not found' },
                { status: 404 }
            );
        }

        // Check if user is a participant in this exchange
        const isInitiator = exchange.initiator.supabaseId === userSupabaseId;
        const isRecipient = exchange.recipient.supabaseId === userSupabaseId;
        const isParticipant = isInitiator || isRecipient;

        if (!isParticipant) {
            return NextResponse.json(
                { success: false, error: 'Not authorized to access this exchange' },
                { status: 403 }
            );
        }

        // Determine user's role
        const userRole = isInitiator ? 'initiator' : 'recipient';

        // Find all unread messages for this user in this exchange
        const unreadMessages = await Message.find({
            exchangeId,
            'readBy.supabaseId': { $ne: userSupabaseId }
        }).select('_id readBy');

        if (unreadMessages.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No unread messages to mark',
                markedCount: 0,
                exchangeInfo: {
                    status: exchange.status,
                    chatAvailable: isChatAvailable(exchange.status)
                }
            });
        }

        // Batch update: Mark all unread messages as read
        const updateResult = await Message.updateMany(
            {
                exchangeId,
                'readBy.supabaseId': { $ne: userSupabaseId }
            },
            {
                $push: {
                    readBy: {
                        supabaseId: userSupabaseId,
                        role: userRole,
                        readAt: new Date()
                    }
                }
            }
        );

        // Get total unread count for this exchange (for other user)
        const remainingUnreadCount = await Message.countDocuments({
            exchangeId,
            'readBy.supabaseId': { $ne: userSupabaseId }
        });

        return NextResponse.json({
            success: true,
            message: 'Messages marked as read successfully',
            markedCount: updateResult.modifiedCount,
            totalUnreadRemaining: remainingUnreadCount,
            exchangeInfo: {
                status: exchange.status,
                chatAvailable: isChatAvailable(exchange.status)
            },
            userInfo: {
                role: userRole,
                supabaseId: userSupabaseId
            }
        });

    } catch (error) {
        console.error('Error marking messages as read:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to mark messages as read' },
            { status: 500 }
        );
    }
}

// GET: Get unread message count for current user
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

        // Validate exchange exists
        const exchange = await Exchange.findById(exchangeId);
        if (!exchange) {
            return NextResponse.json(
                { success: false, error: 'Exchange not found' },
                { status: 404 }
            );
        }

        // Check if user is a participant
        const isParticipant = [
            exchange.initiator.supabaseId,
            exchange.recipient.supabaseId
        ].includes(userSupabaseId);

        if (!isParticipant) {
            return NextResponse.json(
                { success: false, error: 'Not authorized to access this exchange' },
                { status: 403 }
            );
        }

        // Count unread messages for this user
        const unreadCount = await Message.countDocuments({
            exchangeId,
            'readBy.supabaseId': { $ne: userSupabaseId }
        });

        // Get total message count for context
        const totalMessages = await Message.countDocuments({ exchangeId });

        return NextResponse.json({
            success: true,
            unreadCount,
            totalMessages,
            hasUnread: unreadCount > 0,
            exchangeInfo: {
                status: exchange.status,
                chatAvailable: isChatAvailable(exchange.status)
            }
        });

    } catch (error) {
        console.error('Error getting unread count:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get unread count' },
            { status: 500 }
        );
    }
}
