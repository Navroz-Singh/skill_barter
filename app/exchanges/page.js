'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
    MessageCircle,
    ArrowRightLeft,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Plus,
    Filter,
    Search,
    Eye
} from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { formatMessageTimestamp, isChatAvailable } from '@/utils/exchangeChatHelpers';

export default function ExchangesDashboard() {
    // Core state
    const [exchanges, setExchanges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter and stats state
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // useRef for computed values to avoid recalculation
    const statsRef = useRef(null);
    const filteredExchangesRef = useRef([]);

    const { user } = useUser();

    // Fetch user's exchanges
    const fetchExchanges = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/exchanges/dashboard');
            const data = await response.json();

            if (data.success) {
                setExchanges(data.exchanges || []);
                calculateStats(data.exchanges || []);
            } else {
                setError(data.error || 'Failed to load exchanges');
            }
        } catch (err) {
            console.error('Error fetching exchanges:', err);
            setError('Failed to load exchanges');
        } finally {
            setLoading(false);
        }
    };

    // Calculate dashboard stats
    const calculateStats = (exchangeList) => {
        const stats = {
            total: exchangeList.length,
            active: exchangeList.filter(ex => ['negotiating', 'accepted', 'in_progress'].includes(ex.status)).length,
            completed: exchangeList.filter(ex => ex.status === 'completed').length,
            pending: exchangeList.filter(ex => ex.status === 'pending').length,
            unreadTotal: 0 // Will be calculated when we add unread functionality
        };
        statsRef.current = stats;
    };

    // Filter exchanges based on active filter and search
    const getFilteredExchanges = () => {
        let filtered = exchanges;

        // Apply status filter
        if (activeFilter !== 'all') {
            filtered = filtered.filter(exchange => {
                switch (activeFilter) {
                    case 'active':
                        return ['negotiating', 'accepted', 'in_progress'].includes(exchange.status);
                    case 'pending':
                        return exchange.status === 'pending';
                    case 'completed':
                        return exchange.status === 'completed';
                    default:
                        return true;
                }
            });
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(exchange =>
                exchange.exchangeId?.toLowerCase().includes(query) ||
                exchange.initiatorOffer?.description?.toLowerCase().includes(query) ||
                exchange.recipientOffer?.description?.toLowerCase().includes(query) ||
                exchange.initiator?.userId?.name?.toLowerCase().includes(query) ||
                exchange.recipient?.userId?.name?.toLowerCase().includes(query)
            );
        }

        // Sort by most recent first
        filtered.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

        filteredExchangesRef.current = filtered;
        return filtered;
    };

    // Get status color and icon
    const getStatusDisplay = (status) => {
        const displays = {
            'pending': {
                color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
                icon: <Clock className="w-4 h-4" />
            },
            'negotiating': {
                color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
                icon: <ArrowRightLeft className="w-4 h-4" />
            },
            'accepted': {
                color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
                icon: <CheckCircle className="w-4 h-4" />
            },
            'in_progress': {
                color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
                icon: <ArrowRightLeft className="w-4 h-4" />
            },
            'completed': {
                color: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20',
                icon: <CheckCircle className="w-4 h-4" />
            },
            'cancelled': {
                color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
                icon: <XCircle className="w-4 h-4" />
            }
        };
        return displays[status] || displays.pending;
    };

    // Get other participant info
    const getOtherParticipant = (exchange) => {
        const isInitiator = exchange.initiator?.supabaseId === user?.id;
        const other = isInitiator ? exchange.recipient : exchange.initiator;
        const role = isInitiator ? 'recipient' : 'initiator';
        return {
            name: other?.userId?.name || 'Unknown User',
            role: role,
            isInitiator: !isInitiator
        };
    };

    // Load exchanges on mount
    useEffect(() => {
        fetchExchanges();
    }, [user]);

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen pt-16 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                            ))}
                        </div>
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const stats = statsRef.current || { total: 0, active: 0, completed: 0, pending: 0 };
    const filteredExchanges = getFilteredExchanges();

    return (
        <div className="min-h-screen pt-16 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            My Exchanges
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Manage your skill exchanges and communications
                        </p>
                    </div>
                    <Link
                        href="/browse"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New Exchange
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Exchanges</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                            </div>
                            <ArrowRightLeft className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
                            </div>
                            <Clock className="w-8 h-8 text-green-500" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-gray-500" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                            </div>
                            <AlertCircle className="w-8 h-8 text-yellow-500" />
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Filter Buttons */}
                        <div className="flex gap-2">
                            {[
                                { key: 'all', label: 'All' },
                                { key: 'active', label: 'Active' },
                                { key: 'pending', label: 'Pending' },
                                { key: 'completed', label: 'Completed' }
                            ].map(filter => (
                                <button
                                    key={filter.key}
                                    onClick={() => setActiveFilter(filter.key)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === filter.key
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search exchanges..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Exchange List */}
                <div className="space-y-4">
                    {error ? (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
                            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                                Failed to Load Exchanges
                            </h3>
                            <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
                            <button
                                onClick={fetchExchanges}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : filteredExchanges.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
                            <ArrowRightLeft className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                {activeFilter === 'all' ? 'No Exchanges Yet' : `No ${activeFilter} Exchanges`}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {activeFilter === 'all'
                                    ? 'Start your first skill exchange by browsing available skills'
                                    : `You don't have any ${activeFilter} exchanges at the moment`
                                }
                            </p>
                            <Link
                                href="/browse"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Browse Skills
                            </Link>
                        </div>
                    ) : (
                        <>
                            {filteredExchanges.map((exchange) => {
                                const statusDisplay = getStatusDisplay(exchange.status);
                                const otherParticipant = getOtherParticipant(exchange);

                                return (
                                    <Link
                                        key={exchange._id}
                                        href={`/exchange/${exchange._id}`}
                                        className="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 hover:shadow-md"
                                    >
                                        <div className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                            Exchange #{exchange.exchangeId}
                                                        </h3>
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.color}`}>
                                                            {statusDisplay.icon}
                                                            {exchange.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        With {otherParticipant.name}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {/* NEW: Unread Count Badge */}
                                                    {exchange.unreadCount > 0 && (
                                                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                                                            <MessageCircle className="w-3 h-3" />
                                                            <span>{exchange.unreadCount > 99 ? '99+' : exchange.unreadCount}</span>
                                                        </div>
                                                    )}

                                                    {/* Chat Available Indicator */}
                                                    {isChatAvailable(exchange.status) && (
                                                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                            <span>Chat Active</span>
                                                        </div>
                                                    )}

                                                    <Eye className="w-5 h-5 text-gray-400" />
                                                </div>
                                            </div>

                                            {/* Rest of the exchange card remains the same */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                        {exchange.initiator?.supabaseId === user?.id ? 'Your Offer' : 'Their Offer'}
                                                    </p>
                                                    <p className="text-sm text-gray-900 dark:text-white">
                                                        {exchange.initiatorOffer?.description || 'No description provided'}
                                                    </p>
                                                </div>
                                                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                        {exchange.recipient?.supabaseId === user?.id ? 'Your Offer' : 'Their Offer'}
                                                    </p>
                                                    <p className="text-sm text-gray-900 dark:text-white">
                                                        {exchange.recipientOffer?.description || 'No description provided'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                                                <span>
                                                    Updated {formatMessageTimestamp(exchange.updatedAt || exchange.createdAt, false)}
                                                </span>
                                                <span className="text-blue-600 dark:text-blue-400 hover:underline">
                                                    View Details →
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}

                            {/* View All Link */}
                            {exchanges.length > 5 && (
                                <div className="text-center pt-6">
                                    <Link
                                        href="/exchanges/list"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                                    >
                                        <Filter className="w-4 h-4" />
                                        View All Exchanges
                                    </Link>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
