// app/api/admin/users/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
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
        const search = searchParams.get('search') || '';
        const skip = (page - 1) * limit;

        // Build search query
        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('name email role rating reviewCount skills exchanges isActive createdAt adminMetadata stats')
            .lean();

        const total = await User.countDocuments(query);

        // Add skill and exchange counts
        const usersWithCounts = users.map(u => ({
            ...u,
            skillsCount: u.skills?.length || 0,
            exchangesCount: u.exchanges?.length || 0,
            totalViews: u.stats?.totalViews || 0,
            successfulExchanges: u.stats?.successfulExchanges || 0
        }));

        return NextResponse.json({
            users: usersWithCounts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
