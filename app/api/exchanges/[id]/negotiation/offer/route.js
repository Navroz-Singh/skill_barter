// api/exchanges/[id]/negotiation/offer/route.js

import connectDB from '@/lib/mongodb';
import NegotiationSession from '@/models/NegotiationSession';
import Exchange from '@/models/Exchange';
import Skill from '@/models/Skill';
import User from '@/models/User';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getUserRoleInExchange, canEditField } from '@/utils/roleBasedPermissions';

// GET: Get user's editable offer based on their role
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

        // Get exchange
        const exchange = await Exchange.findById(exchangeId);
        if (!exchange) {
            return NextResponse.json(
                { success: false, error: 'Exchange not found' },
                { status: 404 }
            );
        }

        // Get dbUser by supabaseId
        const dbUser = await User.findOne({ supabaseId: user.id });
        if (!dbUser) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Check if user is participant
        const isParticipant =
            exchange.initiator.userId.equals(dbUser._id) ||
            exchange.recipient.userId.equals(dbUser._id);

        if (!isParticipant) {
            return NextResponse.json(
                { success: false, error: 'Not authorized to access this negotiation' },
                { status: 403 }
            );
        }

        // Find or create negotiation session
        let negotiation = await NegotiationSession.findOne({ exchangeId });

        if (!negotiation) {
            // Auto-create if doesn't exist
            negotiation = new NegotiationSession({
                exchangeId,
                terms: {
                    descriptions: {
                        initiator: exchange.initiatorOffer?.description || '',
                        recipient: exchange.recipientOffer?.description || ''
                    },
                    deliverables: {
                        initiator: [],
                        recipient: []
                    },
                    // NEW: Selected skill IDs per role
                    skillIds: {
                        initiator: null,
                        recipient: null
                    },
                    hours: {
                        initiator: 0,
                        recipient: 0
                    },
                    amount: 0,
                    currency: 'USD',
                    paymentTimeline: 'completion', // NEW: Add default payment timeline
                    method: 'flexible'
                },
                status: 'drafting',
                lastModifiedBy: dbUser._id
            });

            await negotiation.save();
        }

        // Get user's role and what they can edit
        const roleInfo = getUserRoleInExchange(exchange, user.id);

        return NextResponse.json({
            success: true,
            roleInfo,
            negotiation,
            canEdit: ['drafting', 'negotiating'].includes(negotiation.status)
        });

    } catch (error) {
        console.error('Error fetching/creating negotiation:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch negotiation' },
            { status: 500 }
        );
    }
}

// PATCH: Update specific offer field based on user role
export async function PATCH(request, { params }) {
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
        const { fieldName, fieldValue } = await request.json();

        // Validate input
        if (!fieldName || fieldValue === undefined) {
            return NextResponse.json(
                { success: false, error: 'Missing fieldName or fieldValue' },
                { status: 400 }
            );
        }

        // Get exchange and negotiation
        const exchange = await Exchange.findById(exchangeId);
        const negotiation = await NegotiationSession.findOne({ exchangeId });

        if (!exchange || !negotiation) {
            return NextResponse.json(
                { success: false, error: 'Exchange or negotiation not found' },
                { status: 404 }
            );
        }

        // Get dbUser by supabaseId
        const dbUser = await User.findOne({ supabaseId: user.id });
        if (!dbUser) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Check if user is participant
        const isParticipant =
            exchange.initiator.userId.equals(dbUser._id) ||
            exchange.recipient.userId.equals(dbUser._id);

        if (!isParticipant) {
            return NextResponse.json(
                { success: false, error: 'Not authorized to modify this negotiation' },
                { status: 403 }
            );
        }

        // Check if negotiation allows editing
        if (!['drafting', 'negotiating'].includes(negotiation.status)) {
            return NextResponse.json(
                { success: false, error: `Cannot edit in current status: ${negotiation.status}` },
                { status: 400 }
            );
        }

        // Get user's role and check permissions
        const roleInfo = getUserRoleInExchange(exchange, user.id);

        if (!canEditField(roleInfo.businessRole, fieldName)) {
            return NextResponse.json(
                { success: false, error: `${roleInfo.businessRole} cannot edit ${fieldName}` },
                { status: 403 }
            );
        }

        // Update the specific field
        const updateData = {};

        if (fieldName === 'description') {
            updateData[`terms.descriptions.${roleInfo.exchangeRole}`] = fieldValue;
        } else if (fieldName === 'deliverables') {
            updateData[`terms.deliverables.${roleInfo.exchangeRole}`] = fieldValue;
        } else if (fieldName === 'hours') {
            updateData[`terms.hours.${roleInfo.exchangeRole}`] = fieldValue;
        } else if (fieldName === 'deadline') {
            updateData['terms.deadline'] = fieldValue;
        } else if (fieldName === 'method') {
            updateData['terms.method'] = fieldValue;
        } else if (fieldName === 'skill_id') {
            // Only the initiator can modify the selected skill – recipients are locked to the pre-chosen skill
            if (roleInfo.exchangeRole !== 'initiator') {
                return NextResponse.json(
                    { success: false, error: 'Only the initiator can change the skill selection' },
                    { status: 403 }
                );
            }
            updateData[`terms.skillIds.${roleInfo.exchangeRole}`] = fieldValue;

            // Sync selected skill to the main Exchange document so it is visible in offers
            try {
                const skillDoc = await Skill.findById(fieldValue).select('title');
                if (!skillDoc) {
                    return NextResponse.json(
                        { success: false, error: 'Selected skill not found' },
                        { status: 400 }
                    );
                }
                if (roleInfo.exchangeRole === 'initiator') {
                    exchange.initiatorOffer.type = 'skill';
                    exchange.initiatorOffer.skillId = fieldValue;
                    exchange.initiatorOffer.skillTitle = skillDoc.title;
                } else {
                    exchange.recipientOffer.type = 'skill';
                    exchange.recipientOffer.skillId = fieldValue;
                    exchange.recipientOffer.skillTitle = skillDoc.title;
                }
                await exchange.save();
            } catch (err) {
                console.error('Error syncing skill to exchange:', err);
            }
        } else if (fieldName === 'amount') {
            updateData['terms.amount'] = fieldValue;
        } else if (fieldName === 'currency') {
            updateData['terms.currency'] = fieldValue;
        } else if (fieldName === 'payment_timeline') { // NEW: Handle payment timeline
            updateData['terms.paymentTimeline'] = fieldValue;
        } else {
            return NextResponse.json(
                { success: false, error: 'Invalid field name' },
                { status: 400 }
            );
        }

        // Update negotiation
        updateData.lastModifiedBy = user.id;
        updateData.status = 'negotiating';

        // Reset agreements when terms change
        updateData['agreed.initiator'] = false;
        updateData['agreed.recipient'] = false;
        updateData['agreed.initiatorAt'] = null;
        updateData['agreed.recipientAt'] = null;

        const updatedNegotiation = await NegotiationSession.findOneAndUpdate(
            { exchangeId },
            updateData,
            { new: true }
        );

        return NextResponse.json({
            success: true,
            negotiation: updatedNegotiation,
            fieldUpdated: fieldName,
            message: `${fieldName} updated successfully`
        });

    } catch (error) {
        console.error('Error updating offer:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update offer' },
            { status: 500 }
        );
    }
}
