// app/profile/exchanges/page.js

'use client';

import { useState, useEffect } from 'react';
import { Plus, Loader } from 'lucide-react';
import Link from 'next/link';
import ExchangeCard from '@/components/profile/ExchangeCard';

export default function ExchangesPage() {
    const [exchanges, setExchanges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch exchanges data
    const fetchExchanges = async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await fetch('/api/exchanges/dashboard');
            if (!res.ok) throw new Error('Failed to fetch exchanges');

            const data = await res.json();
            setExchanges(data.exchanges || []);
        } catch (error) {
            console.error('Error fetching exchanges:', error);
            setError('Failed to load exchanges. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Load data on mount
    useEffect(() => {
        fetchExchanges();
    }, []);

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <Loader className="h-8 w-8 animate-spin text-gray-600 dark:text-gray-400 mx-auto" />
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Loading your exchanges...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="text-center py-12">
                <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>
                <button
                    onClick={fetchExchanges}
                    className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        My Exchanges
                    </h1>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                        Track and manage your skill exchanges
                    </p>
                </div>
                <Link
                    href="/browse"
                    className="inline-flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Start Exchange
                </Link>
            </div>

            {/* Exchanges Grid */}
            {exchanges.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                        You haven't started any exchanges yet.
                    </p>
                    <Link
                        href="/browse"
                        className="inline-flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200"
                    >
                        <Plus className="h-4 w-4" />
                        Browse Skills to Exchange
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {exchanges.map(exchange => (
                        <ExchangeCard key={exchange._id} exchange={exchange} />
                    ))}
                </div>
            )}
        </div>
    );
}
