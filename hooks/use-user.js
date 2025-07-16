'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export function useUser() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const supabase = createClient();

    // Fetch user data from MongoDB
    const fetchUserFromMongoDB = async () => {
        try {
            setError(null);
            const response = await fetch('/api/user/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // User not authenticated
                    setUser(null);
                    return;
                }
                throw new Error('Failed to fetch user data');
            }

            const { user: mongoUser } = await response.json();
            setUser(mongoUser);
        } catch (error) {
            console.error('Error fetching user from MongoDB:', error);
            setError(error.message);
            setUser(null);
        }
    };

    useEffect(() => {
        // Get initial session quickly from localStorage (no network)
        const getUser = async () => {
            try {
                // Use getSession for faster local check
                const { data: { session } } = await supabase.auth.getSession();
                const supabaseUser = session?.user;

                if (supabaseUser) {
                    // User is authenticated, fetch full data from MongoDB
                    await fetchUserFromMongoDB();
                } else {
                    // User not authenticated
                    setUser(null);
                }
            } catch (error) {
                console.error('Error getting initial user:', error);
                setError(error.message);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        getUser();

        // Listen for auth state changes (login/logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                try {
                    setLoading(true);
                    setError(null);

                    if (event === 'SIGNED_OUT' || !session?.user) {
                        // User signed out
                        setUser(null);
                    } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
                        // User signed in or token refreshed, fetch MongoDB data
                        await fetchUserFromMongoDB();
                    }
                } catch (error) {
                    console.error('Auth state change error:', error);
                    setError(error.message);
                } finally {
                    setLoading(false);
                }
            }
        );

        // Cleanup subscription on component unmount
        return () => subscription.unsubscribe();
    }, [supabase.auth]);

    // Refresh user data (useful for profile updates)
    const refreshUser = async () => {
        setLoading(true);
        await fetchUserFromMongoDB();
        setLoading(false);
    };

    return {
        user,        // MongoDB user object with full profile data
        loading,
        error,
        refreshUser,  // Function to manually refresh user data
    };
}
