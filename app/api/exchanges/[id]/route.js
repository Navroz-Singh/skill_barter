// api/exchanges/[id]

import connectDB from '@/lib/mongodb';
import Exchange from '@/models/Exchange';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET: Get single exchange by ID
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

        // Check if user is a participant in this exchange
        const isParticipant =
            exchange.initiator.supabaseId === user.id ||
            exchange.recipient.supabaseId === user.id;

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

// PATCH: Update exchange status or offers
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

        // Check if user is a participant in this exchange
        const isInitiator = existingExchange.initiator.supabaseId === user.id;
        const isRecipient = existingExchange.recipient.supabaseId === user.id;
        const isParticipant = isInitiator || isRecipient;

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

        // Validate status changes (both participants can change status in most cases)
        if (updateData.status) {
            const validStatusTransitions = {
                'pending': ['negotiating', 'cancelled'],
                'negotiating': ['accepted', 'cancelled'],
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

        // Add updatedAt timestamp
        updateData.updatedAt = new Date();

        // Update the exchange
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
