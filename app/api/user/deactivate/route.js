// app/api/user/deactivate/route.js

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function PATCH(req) {
    try {
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { isActive } = await req.json();

        await connectDB();

        const updatedUser = await User.findOneAndUpdate(
            { supabaseId: user.id },
            {
                isActive: isActive,
                lastActive: new Date()
            },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            isActive: updatedUser.isActive,
            message: isActive ? 'Account reactivated successfully' : 'Account deactivated successfully'
        });
    } catch (error) {
        console.error('Account activation toggle error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
