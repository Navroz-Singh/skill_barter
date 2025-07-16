// app/api/admin/disputes/[disputeId]/resolve/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Dispute from '@/models/Dispute';
import Exchange from '@/models/Exchange';
import NegotiationSession from '@/models/NegotiationSession';
import { createClient } from '@/lib/supabase/server';

export async function POST(request, { params }) {
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

        const { disputeId } = params;
        const { decision, reasoning } = await request.json();

        if (!decision || !reasoning) {
            return NextResponse.json({
                error: 'Decision and reasoning are required'
            }, { status: 400 });
        }

        // Update dispute with resolution
        const dispute = await Dispute.findByIdAndUpdate(
            disputeId,
            {
                status: 'resolved',
                resolvedBy: dbUser._id,
                resolution: {
                    decision,
                    reasoning,
                    resolvedAt: new Date()
                }
            },
            { new: true }
        );

        if (!dispute) {
            return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
        }

        // Parse dispute evidence to extract deliverable information
        try {
            const evidenceLines = dispute.evidence?.split('\n') || [];
            let deliverableIndex = null;
            let userRole = null;
            let otherRole = null;

            // Extract information from evidence text
            for (const line of evidenceLines) {
                if (line.includes('Deliverable Index:')) {
                    deliverableIndex = parseInt(line.split(':')[1]?.trim());
                } else if (line.includes('User Role:')) {
                    userRole = line.split(':')[1]?.trim();
                } else if (line.includes('Other Role:')) {
                    otherRole = line.split(':')[1]?.trim();
                }
            }

            // Update NegotiationSession if we have valid deliverable information
            if (deliverableIndex !== null && userRole && otherRole) {
                const negotiationSession = await NegotiationSession.findOne({
                    exchangeId: dispute.exchangeId
                });

                if (negotiationSession) {
                    // Get the deliverable that was disputed (from otherRole's deliverables)
                    const deliverable = negotiationSession.terms.deliverables[otherRole]?.[deliverableIndex];

                    if (deliverable) {
                        // Mark deliverable as confirmed by admin (acting on behalf of the disputing user)
                        deliverable.confirmedBy = dbUser._id;
                        deliverable.confirmedAt = new Date();

                        // Clear dispute flag
                        deliverable.disputeRaised = false;
                        deliverable.disputeReason = null;

                        // Mark the deliverables as modified
                        negotiationSession.markModified('terms.deliverables');

                        // Save the negotiation session
                        await negotiationSession.save();

                        console.log(`Deliverable ${deliverableIndex} confirmed and dispute cleared for exchange ${dispute.exchangeId}`);
                    }
                }
            }
        } catch (parseError) {
            console.error('Error parsing dispute evidence:', parseError);
            // Continue with the rest of the flow even if deliverable update fails
        }

        // Update admin statistics
        await User.findByIdAndUpdate(dbUser._id, {
            $inc: { 'adminMetadata.disputesHandled': 1 },
            'adminMetadata.lastAdminActivity': new Date()
        });

        // Check if there are any open disputes left for this exchange
        const openDisputesCount = await Dispute.countDocuments({
            exchangeId: dispute.exchangeId,
            status: 'open'
        });

        // If no open disputes remain, update exchange status
        if (openDisputesCount === 0) {
            await Exchange.findByIdAndUpdate(dispute.exchangeId, {
                'disputeStatus.hasDispute': false
            });
        }

        return NextResponse.json({
            message: 'Dispute resolved successfully',
            dispute: dispute.toObject(),
            hasOpenDisputes: openDisputesCount > 0
        });

    } catch (error) {
        console.error('Error resolving dispute:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
