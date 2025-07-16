// app/admin/page.js
'use client';

import { useState, useEffect } from 'react';
import {
    MessageSquare,
    Clock,
    CheckCircle,
    TrendingUp,
    AlertTriangle,
    Users
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await fetch('/api/admin/dashboard');
            const data = await response.json();

            if (response.ok) {
                setDashboardData(data);
            } else {
                setError(data.error || 'Failed to fetch dashboard data');
            }
        } catch (error) {
            console.error('Error fetching dashboard:', error);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
        );
    }

    const { stats, recentDisputes } = dashboardData;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Admin Dashboard
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Manage disputes and monitor system activity
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Disputes"
                    value={stats.totalDisputes}
                    icon={MessageSquare}
                    color="blue"
                />
                <StatCard
                    title="Open Disputes"
                    value={stats.openDisputes}
                    icon={AlertTriangle}
                    color="red"
                    urgent={stats.openDisputes > 0}
                />
                <StatCard
                    title="Resolved Disputes"
                    value={stats.resolvedDisputes}
                    icon={CheckCircle}
                    color="green"
                />
                <StatCard
                    title="Exchanges with Disputes"
                    value={stats.exchangesWithDisputes}
                    icon={Users}
                    color="amber"
                />
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Resolution Performance
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Resolution Rate</span>
                            <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                                {stats.resolutionRate}%
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Average Resolution Time</span>
                            <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                {stats.averageResolutionTime}h
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Quick Actions
                        </h3>
                    </div>
                    <div className="space-y-3">
                        <Link
                            href="/admin/disputes"
                            className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
                        >
                            View All Disputes
                        </Link>
                        <Link
                            href="/admin/users"
                            className="block w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-center font-medium"
                        >
                            Manage Users
                        </Link>
                    </div>
                </div>
            </div>

            {/* Recent Disputes */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Recent Open Disputes
                    </h3>
                    <Link
                        href="/admin/disputes"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                    >
                        View All →
                    </Link>
                </div>

                {recentDisputes.length === 0 ? (
                    <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No open disputes</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {recentDisputes.map((dispute) => (
                            <div
                                key={dispute._id}
                                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            >
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {dispute.exchangeTitle}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Raised by {dispute.raisedBy.name} • {new Date(dispute.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <Link
                                    href={`/admin/disputes/exchange/${dispute.exchangeId._id}`}
                                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                                >
                                    Review
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, urgent = false }) {
    const colorClasses = {
        blue: 'text-blue-600 dark:text-blue-400',
        red: 'text-red-600 dark:text-red-400',
        green: 'text-green-600 dark:text-green-400',
        amber: 'text-amber-600 dark:text-amber-400'
    };

    return (
        <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${urgent ? 'ring-2 ring-red-500' : ''}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {value}
                    </p>
                </div>
                <Icon className={`h-8 w-8 ${colorClasses[color]}`} />
            </div>
        </div>
    );
}
