// app/api/admin/users/[userId]/toggle-admin/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
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

        const { userId } = await params;
        const { isAdmin } = await request.json();
        if(userId == dbUser._id.toString()){
            return NextResponse.json({ error: 'You cannot promote/demote yourself' }, { status: 400 });
        }

        const targetUser = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    'adminMetadata.isAdmin': isAdmin,
                    'adminMetadata.lastAdminActivity': isAdmin ? new Date() : null
                }
            },
            { new: true }
        );

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            message: `User ${isAdmin ? 'promoted to' : 'demoted from'} admin successfully`,
            user: targetUser
        });

    } catch (error) {
        console.error('Error toggling admin status:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
