// api/exchanges/route.js

import connectDB from '@/lib/mongodb';
import Exchange from '@/models/Exchange';
import User from '@/models/User';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET: Check existing exchanges between current user and skill owner
export async function GET(request) {
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

        const { searchParams } = new URL(request.url);
        const skillId = searchParams.get('skillId');
        const otherUserId = searchParams.get('otherUserId');

        // Validate required parameters
        if (!skillId || !otherUserId) {
            return NextResponse.json(
                { success: false, error: 'Missing skillId or otherUserId' },
                { status: 400 }
            );
        }

        // Use authenticated user's ID
        const currentUserSupabaseId = user.id;

        // Find exchanges where current user and other user are involved with the specific skill
        const exchanges = await Exchange.find({
            $or: [
                {
                    // Current user is initiator, other user is recipient, skill matches
                    $and: [
                        { 'initiator.supabaseId': currentUserSupabaseId },
                        { 'recipient.supabaseId': otherUserId },
                        {
                            $or: [
                                { 'recipientOffer.skillId': skillId },
                                { 'initiatorOffer.skillId': skillId }
                            ]
                        }
                    ]
                },
                {
                    // Current user is recipient, other user is initiator, skill matches
                    $and: [
                        { 'recipient.supabaseId': currentUserSupabaseId },
                        { 'initiator.supabaseId': otherUserId },
                        {
                            $or: [
                                { 'recipientOffer.skillId': skillId },
                                { 'initiatorOffer.skillId': skillId }
                            ]
                        }
                    ]
                }
            ]
        })
            .populate('initiator.userId', 'name email')
            .populate('recipient.userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(10); // Limit to recent exchanges

        return NextResponse.json({
            success: true,
            exchanges,
            count: exchanges.length
        });

    } catch (error) {
        console.error('Error checking existing exchanges:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to check existing exchanges' },
            { status: 500 }
        );
    }
}

// POST: Create a new exchange
export async function POST(request) {
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

        const data = await request.json();

        // Extract and validate required fields (removed initiatorSupabaseId since we get it from auth)
        const {
            recipientSkillId,
            recipientUserId,
            recipientSupabaseId,
            exchangeType,
            initiatorOffer,
            recipientOffer
        } = data;

        // Use authenticated user as initiator
        const initiatorSupabaseId = user.id;

        // Validate required fields
        if (!recipientSkillId || !recipientUserId || !recipientSupabaseId || !exchangeType || !initiatorOffer || !recipientOffer) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // UPDATED: Validate exchangeType (removed 'money_for_skill')
        const validExchangeTypes = ['skill_for_skill', 'skill_for_money'];
        if (!validExchangeTypes.includes(exchangeType)) {
            return NextResponse.json(
                { success: false, error: 'Invalid exchangeType' },
                { status: 400 }
            );
        }

        // Prevent self-exchange
        if (initiatorSupabaseId === recipientSupabaseId) {
            return NextResponse.json(
                { success: false, error: 'Cannot create exchange with yourself' },
                { status: 400 }
            );
        }

        // Find initiator user document
        const initiatorUser = await User.findOne({ supabaseId: initiatorSupabaseId });
        if (!initiatorUser) {
            return NextResponse.json(
                { success: false, error: 'User account not found. Please complete profile setup.' },
                { status: 404 }
            );
        }

        // Check for existing active exchanges between these users for this skill
        const existingExchange = await Exchange.findOne({
            $or: [
                {
                    $and: [
                        { 'initiator.supabaseId': initiatorSupabaseId },
                        { 'recipient.supabaseId': recipientSupabaseId },
                        { 'recipientOffer.skillId': recipientSkillId },
                        { status: { $in: ['pending', 'negotiating', 'accepted', 'in_progress'] } }
                    ]
                },
                {
                    $and: [
                        { 'initiator.supabaseId': recipientSupabaseId },
                        { 'recipient.supabaseId': initiatorSupabaseId },
                        { 'initiatorOffer.skillId': recipientSkillId },
                        { status: { $in: ['pending', 'negotiating', 'accepted', 'in_progress'] } }
                    ]
                }
            ]
        });

        if (existingExchange) {
            return NextResponse.json(
                { success: false, error: 'Active exchange already exists between these users for this skill' },
                { status: 409 }
            );
        }

        // Create new exchange document
        const newExchange = new Exchange({
            initiator: {
                userId: initiatorUser._id,
                supabaseId: initiatorSupabaseId
            },
            recipient: {
                userId: recipientUserId,
                supabaseId: recipientSupabaseId
            },
            exchangeType,
            initiatorOffer: {
                ...initiatorOffer,
                type: initiatorOffer.type || 'skill'
            },
            recipientOffer: {
                ...recipientOffer,
                skillId: recipientSkillId,
                type: recipientOffer.type || 'skill'
            },
            status: 'pending'
        });

        const savedExchange = await newExchange.save();

        // Populate the saved exchange for response
        await savedExchange.populate('initiator.userId', 'name email');
        await savedExchange.populate('recipient.userId', 'name email');

        return NextResponse.json({
            success: true,
            exchange: savedExchange,
            message: 'Exchange created successfully'
        });

    } catch (error) {
        console.error('Error creating exchange:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create exchange' },
            { status: 500 }
        );
    }
}
