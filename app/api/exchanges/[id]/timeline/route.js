// app/api/exchanges/[id]/timeline/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import connectDB from '@/lib/mongodb';
import Exchange from '@/models/Exchange';
import NegotiationSession from '@/models/NegotiationSession';

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
            exchange.initiator?.supabaseId === user.id ||
            exchange.recipient?.supabaseId === user.id;

        if (!isParticipant) {
            return NextResponse.json(
                { success: false, error: 'Not authorized' },
                { status: 403 }
            );
        }

        // Get timeline data
        const timeline = {
            startDate: negotiation.execution?.startDate || exchange.createdAt,
            deadline: negotiation.terms?.deadline
        };

        return NextResponse.json({
            success: true,
            timeline
        });

    } catch (error) {
        console.error('Error fetching timeline:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch timeline' },
            { status: 500 }
        );
    }
}
