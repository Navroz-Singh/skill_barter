// app/api/admin/disputes/exchange/[exchangeId]/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Exchange from '@/models/Exchange';
import Dispute from '@/models/Dispute';
import { createClient } from '@/lib/supabase/server';

export async function GET(request, { params }) {
    try {
        await connectDB();

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const dbUser = await User.findOne({ supabaseId: user.id });
        if (!dbUser?.adminMetadata?.isAdmin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { exchangeId } = params;

        // Get exchange details with populated user information
        const exchange = await Exchange.findById(exchangeId)
            .populate('initiator.userId', 'name email avatar')
            .populate('recipient.userId', 'name email avatar')
            .populate('initiatorOffer.skillId', 'title category')
            .populate('recipientOffer.skillId', 'title category');

        if (!exchange) {
            return NextResponse.json({ error: 'Exchange not found' }, { status: 404 });
        }

        // Get all disputes for this exchange
        const disputes = await Dispute.find({ exchangeId })
            .populate('raisedBy', 'name email avatar')
            .populate('resolvedBy', 'name email avatar')
            .sort({ createdAt: -1 });

        // Get exchange statistics
        const disputeStats = {
            total: disputes.length,
            open: disputes.filter(d => d.status === 'open').length,
            resolved: disputes.filter(d => d.status === 'resolved').length
        };

        return NextResponse.json({
            exchange: exchange.toObject(),
            disputes: disputes.map(dispute => dispute.toObject()),
            stats: disputeStats
        });

    } catch (error) {
        console.error('Error fetching exchange disputes:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
