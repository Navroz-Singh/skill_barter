// api/exchanges/[id]/messages/route.js

import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import Exchange from '@/models/Exchange';
import User from '@/models/User';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Helper function to check if chat is available for exchange status
const isChatAvailable = (status) => {
    return ['negotiating', 'accepted', 'in_progress'].includes(status);
};

// GET: Fetch messages for specific exchange (simplified)
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
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 50;

        // Validate exchange exists
        const exchange = await Exchange.findById(exchangeId);
        if (!exchange) {
            return NextResponse.json(
                { success: false, error: 'Exchange not found' },
                { status: 404 }
            );
        }

        // Check if chat is available for current exchange status
        if (!isChatAvailable(exchange.status)) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Chat not available. Exchange status: ${exchange.status}`,
                    chatAvailable: false
                },
                { status: 403 }
            );
        }

        // Check if user is a participant
        const isParticipant = [
            exchange.initiator.supabaseId,
            exchange.recipient.supabaseId
        ].includes(user.id);

        if (!isParticipant) {
            return NextResponse.json(
                { success: false, error: 'Not authorized to access this exchange' },
                { status: 403 }
            );
        }

        // Simple query - no sequence complexity
        const query = { exchangeId };

        // Fetch messages with pagination (simple timestamp sorting)
        const messages = await Message.find(query)
            .sort({ createdAt: -1 }) // Simple timestamp sorting only
            .limit(limit)
            .skip((page - 1) * limit)
            .populate('sender.userId', 'name email');

        // Calculate if there are more messages
        const totalMessages = await Message.countDocuments(query);
        const hasMore = (page * limit) < totalMessages;

        return NextResponse.json({
            success: true,
            messages: messages.reverse(), // Return oldest first for chat display
            pagination: {
                page,
                limit,
                total: totalMessages,
                hasMore
            },
            exchangeInfo: {
                status: exchange.status,
                chatAvailable: true
            }
        });

    } catch (error) {
        console.error('Error fetching exchange messages:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch messages' },
            { status: 500 }
        );
    }
}

// POST: Send new message in exchange (simplified)
export async function POST(request, { params }) {
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
        const { content } = await request.json(); // Removed clientSequence

        // Use authenticated user as sender
        const senderSupabaseId = user.id;

        // Validate input
        if (!content || !content.trim()) {
            return NextResponse.json(
                { success: false, error: 'Message content is required' },
                { status: 400 }
            );
        }

        if (content.trim().length > 1000) {
            return NextResponse.json(
                { success: false, error: 'Message content too long (max 1000 characters)' },
                { status: 400 }
            );
        }

        // Validate exchange exists
        const exchange = await Exchange.findById(exchangeId);
        if (!exchange) {
            return NextResponse.json(
                { success: false, error: 'Exchange not found' },
                { status: 404 }
            );
        }

        // Check if chat is available
        if (!isChatAvailable(exchange.status)) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Chat not available. Exchange status: ${exchange.status}`,
                    chatAvailable: false
                },
                { status: 403 }
            );
        }

        // Check if sender is a participant in this exchange
        const isParticipant = [
            exchange.initiator.supabaseId,
            exchange.recipient.supabaseId
        ].includes(senderSupabaseId);

        if (!isParticipant) {
            return NextResponse.json(
                { success: false, error: 'Not authorized to send messages in this exchange' },
                { status: 403 }
            );
        }

        // Find sender's User document
        const senderUser = await User.findOne({ supabaseId: senderSupabaseId }).select('_id');
        if (!senderUser) {
            return NextResponse.json(
                { success: false, error: 'Sender user not found' },
                { status: 404 }
            );
        }

        // Determine sender's role in the exchange
        const senderRole = exchange.initiator.supabaseId === senderSupabaseId
            ? 'initiator'
            : 'recipient';

        // Create and save new message (no sequence complexity)
        const newMessage = new Message({
            exchangeId,
            content: content.trim(),
            sender: {
                userId: senderUser._id,
                supabaseId: senderSupabaseId,
                role: senderRole
            },
            type: 'user'
            // Removed: sequence, clientSequence
        });

        const savedMessage = await newMessage.save();

        // Populate sender info for response
        await savedMessage.populate('sender.userId', 'name email');

        return NextResponse.json({
            success: true,
            message: savedMessage,
            exchangeInfo: {
                status: exchange.status,
                chatAvailable: true
            }
        });

    } catch (error) {
        console.error('Error sending exchange message:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to send message' },
            { status: 500 }
        );
    }
}
