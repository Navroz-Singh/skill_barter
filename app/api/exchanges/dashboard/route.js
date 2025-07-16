// api/exchanges/dashboard

import connectDB from '@/lib/mongodb';
import Exchange from '@/models/Exchange';
import Message from '@/models/Message';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET: Fetch user's exchanges for dashboard with unread counts
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
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 50;
        const status = searchParams.get('status');
        const search = searchParams.get('search');

        // Build base query for user's exchanges
        let query = {
            $or: [
                { 'initiator.supabaseId': user.id },
                { 'recipient.supabaseId': user.id }
            ]
        };

        // Add status filter if provided
        if (status && status !== 'all') {
            if (status === 'active') {
                query.status = { $in: ['negotiating', 'accepted', 'in_progress'] };
            } else {
                query.status = status;
            }
        }

        // Add search filter if provided
        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query.$and = query.$and || [];
            query.$and.push({
                $or: [
                    { 'exchangeId': searchRegex },
                    { 'initiatorOffer.description': searchRegex },
                    { 'recipientOffer.description': searchRegex },
                    { 'initiatorOffer.skillTitle': searchRegex },
                    { 'recipientOffer.skillTitle': searchRegex }
                ]
            });
        }

        // Get total count for pagination
        const totalExchanges = await Exchange.countDocuments(query);

        // Fetch exchanges with pagination
        const exchanges = await Exchange.find(query)
            .populate('initiator.userId', 'name email')
            .populate('recipient.userId', 'name email')
            .sort({ updatedAt: -1, createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit);

        // NEW: Get unread counts for all exchanges in one efficient query
        const exchangeIds = exchanges.map(ex => ex._id);

        const unreadCounts = await Message.aggregate([
            {
                $match: {
                    exchangeId: { $in: exchangeIds },
                    'readBy.supabaseId': { $ne: user.id }
                }
            },
            {
                $group: {
                    _id: '$exchangeId',
                    unreadCount: { $sum: 1 }
                }
            }
        ]);

        // Create a map for quick lookup
        const unreadCountMap = new Map(
            unreadCounts.map(item => [item._id.toString(), item.unreadCount])
        );

        // Add unread counts to exchanges
        const exchangesWithUnread = exchanges.map(exchange => ({
            ...exchange.toObject(),
            unreadCount: unreadCountMap.get(exchange._id.toString()) || 0
        }));

        // Calculate pagination info
        const totalPages = Math.ceil(totalExchanges / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        // Calculate dashboard statistics
        const allUserExchanges = await Exchange.find({
            $or: [
                { 'initiator.supabaseId': user.id },
                { 'recipient.supabaseId': user.id }
            ]
        }).select('status');

        const stats = {
            total: allUserExchanges.length,
            active: allUserExchanges.filter(ex => ['negotiating', 'accepted', 'in_progress'].includes(ex.status)).length,
            completed: allUserExchanges.filter(ex => ex.status === 'completed').length,
            pending: allUserExchanges.filter(ex => ex.status === 'pending').length,
            cancelled: allUserExchanges.filter(ex => ex.status === 'cancelled').length
        };

        return NextResponse.json({
            success: true,
            exchanges: exchangesWithUnread, // Now includes unreadCount for each exchange
            pagination: {
                page,
                limit,
                total: totalExchanges,
                totalPages,
                hasNextPage,
                hasPrevPage
            },
            stats,
            count: exchangesWithUnread.length
        });

    } catch (error) {
        console.error('Error fetching user exchanges:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch exchanges' },
            { status: 500 }
        );
    }
}
