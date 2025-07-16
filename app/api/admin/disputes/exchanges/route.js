// app/api/admin/disputes/exchanges/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Exchange from '@/models/Exchange';
import Dispute from '@/models/Dispute';
import { createClient } from '@/lib/supabase/server';

export async function GET(request) {
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

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const status = searchParams.get('status') || 'all';
        const skip = (page - 1) * limit;

        // Build query for exchanges with disputes
        let query = { 'disputeStatus.hasDispute': true };

        // Get exchanges that have disputes
        const exchanges = await Exchange.find(query)
            .populate('initiator.userId', 'name email')
            .populate('recipient.userId', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Get dispute counts and details for each exchange
        const exchangesWithDisputes = await Promise.all(
            exchanges.map(async (exchange) => {
                const disputeQuery = { exchangeId: exchange._id };
                if (status !== 'all') {
                    disputeQuery.status = status;
                }

                const [allDisputes, openDisputes, resolvedDisputes] = await Promise.all([
                    Dispute.countDocuments({ exchangeId: exchange._id }),
                    Dispute.countDocuments({ exchangeId: exchange._id, status: 'open' }),
                    Dispute.countDocuments({ exchangeId: exchange._id, status: 'resolved' })
                ]);

                const recentDispute = await Dispute.findOne({ exchangeId: exchange._id })
                    .populate('raisedBy', 'name email')
                    .sort({ createdAt: -1 });

                return {
                    ...exchange.toObject(),
                    disputeCount: allDisputes,
                    openDisputeCount: openDisputes,
                    resolvedDisputeCount: resolvedDisputes,
                    recentDispute: recentDispute ? {
                        ...recentDispute.toObject(),
                        raisedByName: recentDispute.raisedBy?.name || 'Unknown'
                    } : null
                };
            })
        );

        // Filter based on status if needed
        const filteredExchanges = status === 'all'
            ? exchangesWithDisputes
            : exchangesWithDisputes.filter(ex => {
                if (status === 'open') return ex.openDisputeCount > 0;
                if (status === 'resolved') return ex.resolvedDisputeCount > 0 && ex.openDisputeCount === 0;
                return true;
            });

        const total = await Exchange.countDocuments(query);

        return NextResponse.json({
            exchanges: filteredExchanges,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching exchanges with disputes:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
