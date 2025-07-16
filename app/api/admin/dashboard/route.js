// app/api/admin/dashboard/route.js
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Dispute from '@/models/Dispute';
import Exchange from '@/models/Exchange';

export async function GET() {
    try {
        await connectDB();

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify admin status
        const adminUser = await User.findOne({ supabaseId: user.id });
        if (!adminUser?.adminMetadata?.isAdmin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Get dispute statistics
        const [
            totalDisputes,
            openDisputes,
            resolvedDisputes,
            exchangesWithDisputes,
            recentDisputes
        ] = await Promise.all([
            Dispute.countDocuments(),
            Dispute.countDocuments({ status: 'open' }),
            Dispute.countDocuments({ status: 'resolved' }),
            Exchange.countDocuments({ 'disputeStatus.hasDispute': true }),
            Dispute.find({ status: 'open' })
                .populate('raisedBy', 'name email')
                .populate('exchangeId')
                .sort({ createdAt: -1 })
                .limit(5)
        ]);

        // Calculate resolution metrics
        const averageResolutionTime = resolvedDisputes > 0 ?
            await calculateAverageResolutionTime() : 0;

        return NextResponse.json({
            stats: {
                totalDisputes,
                openDisputes,
                resolvedDisputes,
                exchangesWithDisputes,
                resolutionRate: totalDisputes > 0 ?
                    Math.round((resolvedDisputes / totalDisputes) * 100) : 0,
                averageResolutionTime // in hours
            },
            recentDisputes: recentDisputes.map(dispute => ({
                ...dispute.toObject(),
                exchangeTitle: `${dispute.exchangeId?.initiatorOffer?.skillTitle || 'Unknown'} ↔ ${dispute.exchangeId?.recipientOffer?.skillTitle || 'Unknown'}`
            }))
        });

    } catch (error) {
        console.error('Error fetching admin dashboard:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// Helper function to calculate average resolution time
async function calculateAverageResolutionTime() {
    const resolvedDisputes = await Dispute.find({
        status: 'resolved',
        'resolution.resolvedAt': { $exists: true }
    }).select('createdAt resolution.resolvedAt');

    if (resolvedDisputes.length === 0) return 0;

    const totalTime = resolvedDisputes.reduce((sum, dispute) => {
        const created = new Date(dispute.createdAt);
        const resolved = new Date(dispute.resolution.resolvedAt);
        return sum + (resolved - created);
    }, 0);

    // Return average time in hours
    return Math.round(totalTime / resolvedDisputes.length / (1000 * 60 * 60));
}
