// app/api/admin/check/route.js
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
    try {
        await connectDB();

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ isAdmin: false }, { status: 401 });
        }

        const adminUser = await User.findOne({ supabaseId: user.id });
        const isAdmin = adminUser?.adminMetadata?.isAdmin || false;

        return NextResponse.json({ isAdmin });

    } catch (error) {
        console.error('Error checking admin status:', error);
        return NextResponse.json({ isAdmin: false }, { status: 500 });
    }
}
