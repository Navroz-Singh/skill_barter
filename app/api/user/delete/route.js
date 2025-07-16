// app/api/user/delete/route.js

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Skill from '@/models/Skill';
import Exchange from '@/models/Exchange';

export async function DELETE(req) {
    try {
        // Client scoped to the current user's session (for auth)
const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

// Prepare Supabase Admin client (service role) for user deletion
const supabaseAdmin = createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

        // Delete user's skills
        await Skill.deleteMany({ ownerSupabaseId: user.id });

        // Cancel user's exchanges (don't delete to preserve other user's data)
        await Exchange.updateMany(
            {
                $or: [
                    { 'initiator.supabaseId': user.id },
                    { 'recipient.supabaseId': user.id }
                ]
            },
            { status: 'cancelled' }
        );

        // Delete user account from MongoDB
        await User.deleteOne({ supabaseId: user.id });

        // Delete user from Supabase
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

        if (deleteError) {
            console.error('Supabase user deletion error:', deleteError);
            // Continue anyway as MongoDB cleanup is done
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Account deletion error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
