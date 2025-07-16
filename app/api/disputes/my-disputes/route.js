// app/api/disputes/my-disputes/route.js
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
        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'all';
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const skip = (page - 1) * limit;

        // Build query for disputes involving this user
        let disputeQuery = {
            $or: [
                { raisedBy: dbUser._id }, // Disputes raised by user
                { exchangeId: { $in: await getExchangeIds(dbUser._id) } } // Disputes on user's exchanges
            ]
        };

        if (status !== 'all') {
            disputeQuery.status = status;
        }

        // Get disputes with populated data
        const disputes = await Dispute.find(disputeQuery)
            .populate('raisedBy', 'name email avatar')
            .populate('resolvedBy', 'name email avatar')
            .populate({
                path: 'exchangeId',
                populate: [
                    { path: 'initiator.userId', select: 'name email avatar' },
                    { path: 'recipient.userId', select: 'name email avatar' }
                ]
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Add metadata for each dispute
        const disputesWithMetadata = disputes.map(dispute => {
            const exchange = dispute.exchangeId;
            const isRaisedByUser = dispute.raisedBy._id.toString() === dbUser._id.toString();
            const userRole = exchange.initiator.userId._id.toString() === dbUser._id.toString() ? 'initiator' : 'recipient';

            return {
                ...dispute.toObject(),
                metadata: {
                    isRaisedByUser,
                    userRole,
                    exchangeTitle: `${exchange.initiatorOffer?.skillTitle || 'Unknown'} ↔ ${exchange.recipientOffer?.skillTitle || 'Unknown'}`,
                    otherParty: userRole === 'initiator'
                        ? exchange.recipient.userId.name
                        : exchange.initiator.userId.name
                }
            };
        });

        // Get total count for pagination
        const total = await Dispute.countDocuments(disputeQuery);

        // Get summary statistics
        const stats = await getDisputeStats(dbUser._id);

        return NextResponse.json({
            disputes: disputesWithMetadata,
            stats,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching user disputes:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// Helper function to get exchange IDs where user is a participant
async function getExchangeIds(userId) {
    const exchanges = await Exchange.find({
        $or: [
            { 'initiator.userId': userId },
            { 'recipient.userId': userId }
        ]
    }).select('_id');

    return exchanges.map(ex => ex._id);
}

// Helper function to get dispute statistics for user
async function getDisputeStats(userId) {
    const exchangeIds = await getExchangeIds(userId);

    const [raised, received, resolved, open] = await Promise.all([
        Dispute.countDocuments({ raisedBy: userId }),
        Dispute.countDocuments({
            exchangeId: { $in: exchangeIds },
            raisedBy: { $ne: userId }
        }),
        Dispute.countDocuments({
            $or: [
                { raisedBy: userId },
                { exchangeId: { $in: exchangeIds } }
            ],
            status: 'resolved'
        }),
        Dispute.countDocuments({
            $or: [
                { raisedBy: userId },
                { exchangeId: { $in: exchangeIds } }
            ],
            status: 'open'
        })
    ]);

    return { raised, received, resolved, open, total: raised + received };
}
