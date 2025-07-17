import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');

    // Ensure we have auth code from OAuth provider
    if (!code) {
        console.error('No auth code provided');
        return NextResponse.redirect(`${origin}/auth`);
    }

    const supabase = await createClient();

    try {
        // Step 1: Exchange OAuth code for session (correct method for server-side)
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error('OAuth exchange error:', error);
            return NextResponse.redirect(`${origin}/auth`);
        }

        // Step 2: Verify user session was created
        if (!data.user) {
            console.error('No user data after OAuth exchange');
            return NextResponse.redirect(`${origin}/auth`);
        }

        // Step 3: Sync user to MongoDB (non-blocking)
        try {
            const syncResponse = await fetch(`${origin}/api/user/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${data.session?.access_token}`,
                },
            });

            if (!syncResponse.ok) {
                console.warn('MongoDB sync failed:', await syncResponse.text());
                // Continue - user can still use the app
            }
        } catch (syncError) {
            console.warn('MongoDB sync error:', syncError);
            // Continue - user can still use the app
        }

        // Step 4: Success - redirect to dashboard
        return NextResponse.redirect(`${origin}/profile`);

    } catch (error) {
        console.error('OAuth callback error:', error);
        return NextResponse.redirect(`${origin}/auth`);
    }
}
