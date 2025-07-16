// hooks/useAdminCheck.js
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useAdminCheck() {
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                const response = await fetch('/api/admin/check');
                if (response.ok) {
                    const data = await response.json();
                    setIsAdmin(data.isAdmin);
                } else {
                    router.push('/');
                }
            } catch (error) {
                console.error('Error checking admin status:', error);
                router.push('/');
            } finally {
                setLoading(false);
            }
        };

        checkAdminStatus();
    }, [router]);

    return { isAdmin, loading };
}
