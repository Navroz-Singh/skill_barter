'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import NegotiationPlayground from '@/components/exchange/NegotiationPlayground';

export default function NegotiatePage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const { user, loading: userLoading } = useUser();

    // Page state
    const [exchange, setExchange] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch exchange data
    const fetchExchange = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/exchanges/${id}`);
            const data = await response.json();

            if (data.success) {
                setExchange(data.exchange);

                // FIXED: Check if negotiation is available (INCLUDE pending_acceptance)
                const negotiableStatuses = ['pending', 'negotiating', 'pending_acceptance', 'accepted'];
                if (!negotiableStatuses.includes(data.exchange.status)) {
                    setError(`Negotiation not available. Exchange status: ${data.exchange.status}`);
                }
            } else {
                setError(data.error || 'Exchange not found');
            }
        } catch (err) {
            console.error('Error fetching exchange:', err);
            setError('Failed to load exchange');
        } finally {
            setLoading(false);
        }
    };

    // Load exchange when user is available
    useEffect(() => {
        if (user && !userLoading) {
            fetchExchange();
        }
    }, [user, userLoading, id]);

    // Redirect if not authenticated
    useEffect(() => {
        if (!userLoading && !user) {
            router.push('/auth');
        }
    }, [user, userLoading, router]);

    // Loading state
    if (userLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading negotiation...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="max-w-md w-full mx-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
                        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Unable to Load Negotiation
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            {error}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => router.back()}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Go Back
                            </button>
                            <button
                                onClick={fetchExchange}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // No exchange found
    if (!exchange) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Exchange Not Found
                    </h2>
                    <button
                        onClick={() => router.push('/exchanges')}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        View All Exchanges
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Sticky Header Bar with Back Button */}
            <div className="sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-800 flex items-center px-4 py-2">
                <button
                    onClick={() => router.push(`/exchange/${id}`)}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Exchange
                </button>
            </div>

            {/* Negotiation Playground */}
            <NegotiationPlayground
                exchangeId={id}
                exchangeData={exchange}
            />
        </div>
    );
}
