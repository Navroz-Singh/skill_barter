// app/profile/disputes/page.js
'use client';

import { useState, useEffect } from 'react';
import {
    MessageSquare,
    Clock,
    CheckCircle,
    AlertTriangle,
    User,
    Calendar,
    Shield,
    ExternalLink,
    Filter,
    Search
} from 'lucide-react';
import Link from 'next/link';

export default function UserDisputesPage() {
    const [disputes, setDisputes] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({});
    const [filters, setFilters] = useState({
        status: 'all',
        page: 1,
        limit: 10
    });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchDisputes();
    }, [filters]);

    const fetchDisputes = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                status: filters.status,
                page: filters.page.toString(),
                limit: filters.limit.toString()
            });

            const response = await fetch(`/api/disputes/my-disputes?${queryParams}`);
            const data = await response.json();

            if (response.ok) {
                setDisputes(data.disputes);
                setStats(data.stats);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error('Error fetching disputes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
    };

    const handlePageChange = (page) => {
        setFilters(prev => ({ ...prev, page }));
    };

    const filteredDisputes = disputes.filter(dispute => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            dispute.description.toLowerCase().includes(searchLower) ||
            dispute.metadata.exchangeTitle.toLowerCase().includes(searchLower) ||
            dispute.metadata.otherParty.toLowerCase().includes(searchLower)
        );
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Loading your disputes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    My Disputes
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    View and track the status of your exchange disputes
                </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Total Disputes"
                    value={stats.total || 0}
                    icon={MessageSquare}
                    color="blue"
                />
                <StatCard
                    title="You Raised"
                    value={stats.raised || 0}
                    icon={AlertTriangle}
                    color="amber"
                />
                <StatCard
                    title="Against You"
                    value={stats.received || 0}
                    icon={User}
                    color="red"
                />
                <StatCard
                    title="Resolved"
                    value={stats.resolved || 0}
                    icon={CheckCircle}
                    color="green"
                />
            </div>

            {/* Filters and Search */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search disputes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange({ status: e.target.value })}
                            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Status</option>
                            <option value="open">Open</option>
                            <option value="resolved">Resolved</option>
                        </select>
                    </div>

                    {/* Items per page */}
                    <select
                        value={filters.limit}
                        onChange={(e) => handleFilterChange({ limit: parseInt(e.target.value) })}
                        className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value={10}>10 per page</option>
                        <option value={20}>20 per page</option>
                        <option value={50}>50 per page</option>
                    </select>
                </div>
            </div>

            {/* Disputes List */}
            <div className="space-y-4">
                {filteredDisputes.length === 0 ? (
                    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">
                            {searchTerm ? 'No disputes found matching your search.' : 'You have no disputes yet.'}
                        </p>
                    </div>
                ) : (
                    filteredDisputes.map((dispute) => (
                        <DisputeCard key={dispute._id} dispute={dispute} />
                    ))
                )}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            Previous
                        </button>

                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Page {pagination.page} of {pagination.pages}
                        </span>

                        <button
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.pages}
                            className="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Statistics Card Component
function StatCard({ title, value, icon: Icon, color }) {
    const colorClasses = {
        blue: 'text-blue-600 dark:text-blue-400',
        amber: 'text-amber-600 dark:text-amber-400',
        red: 'text-red-600 dark:text-red-400',
        green: 'text-green-600 dark:text-green-400'
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {value}
                    </p>
                </div>
                <Icon className={`h-6 w-6 ${colorClasses[color]}`} />
            </div>
        </div>
    );
}

// Individual Dispute Card Component
function DisputeCard({ dispute }) {
    const { metadata } = dispute;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {metadata.exchangeTitle}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${metadata.isRaisedByUser
                                ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                                : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                            }`}>
                            {metadata.isRaisedByUser ? 'You raised' : 'Raised against you'}
                        </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>Other party: {metadata.otherParty}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(dispute.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${dispute.status === 'open'
                            ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                            : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        }`}>
                        {dispute.status === 'open' ? 'Open' : 'Resolved'}
                    </span>

                    <Link
                        href={`/exchange/${dispute.exchangeId._id}`}
                        className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                        View Exchange
                    </Link>
                </div>
            </div>

            {/* Dispute Description */}
            <div className="mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Description</h4>
                <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
                    {dispute.description}
                </p>
            </div>

            {/* Evidence */}
            {dispute.evidence && (
                <div className="mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Evidence</h4>
                    <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
                        {dispute.evidence}
                    </p>
                </div>
            )}

            {/* Resolution (if resolved) */}
            {dispute.status === 'resolved' && dispute.resolution && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <h4 className="font-medium text-green-900 dark:text-green-100">
                            Admin Resolution
                        </h4>
                    </div>

                    <div className="space-y-2">
                        <div>
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">Decision:</p>
                            <p className="text-sm text-green-700 dark:text-green-300">{dispute.resolution.decision}</p>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">Reasoning:</p>
                            <p className="text-sm text-green-700 dark:text-green-300">{dispute.resolution.reasoning}</p>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-green-600 dark:text-green-400">
                            <span>Resolved by: {dispute.resolvedBy?.name || 'Admin'}</span>
                            <span>•</span>
                            <span>{new Date(dispute.resolution.resolvedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Waiting for Resolution */}
            {dispute.status === 'open' && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            Waiting for Admin Resolution
                        </p>
                    </div>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        Our admin team is reviewing this dispute. You'll be notified when it's resolved.
                    </p>
                </div>
            )}
        </div>
    );
}
