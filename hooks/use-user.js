'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export function useUser() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        // Get initial user state
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        };

        getUser();

        // Listen for auth state changes (login/logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setUser(session?.user ?? null);
                setLoading(false);

                // When user signs in, sync their data to MongoDB
                if (event === 'SIGNED_IN' && session?.user) {
                    try {
                        await fetch('/api/user/sync', { method: 'POST' });
                    } catch (error) {
                        console.error('Failed to sync user:', error);
                    }
                }
            }
        );

        // Cleanup subscription on component unmount
        return () => subscription.unsubscribe();
    }, [supabase.auth]);

    return { user, loading };
}
