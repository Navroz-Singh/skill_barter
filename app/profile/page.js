'use client';

import { useState, useEffect } from 'react';
import {
    BookOpen,
    Activity,
    Star,
    Users,
    Repeat,
    ArrowRight,
    Loader,
    TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import MetricCard from '@/components/profile/MetricCard';
import SkillViewsChart from '@/components/profile/SkillViewsChart';
import ExchangesChart from '@/components/profile/ExchangesChart';

export default function ProfileDashboard() {
    // Existing state management
    const [user, setUser] = useState(null);
    const [skills, setSkills] = useState([]);
    const [exchanges, setExchanges] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // New analytics state
    const [analyticsData, setAnalyticsData] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [analyticsError, setAnalyticsError] = useState(null);

    // Existing fetch functions (unchanged)
    const fetchUserData = async () => {
        try {
            const res = await fetch('/api/user/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!res.ok) throw new Error('Failed to fetch user data');
            const { user } = await res.json();
            return user;
        } catch (error) {
            console.error('Error fetching user data:', error);
            return null;
        }
    };

    const fetchSkills = async () => {
        try {
            const res = await fetch('/api/skills/my-skills');
            if (!res.ok) throw new Error('Failed to fetch skills');
            const { skills } = await res.json();
            return skills || [];
        } catch (error) {
            console.error('Error fetching skills:', error);
            return [];
        }
    };

    const fetchExchanges = async () => {
        try {
            const res = await fetch('/api/exchanges/dashboard');
            if (!res.ok) throw new Error('Failed to fetch exchanges');
            const data = await res.json();
            return {
                exchanges: data.exchanges || [],
                stats: data.stats || {},
            };
        } catch (error) {
            console.error('Error fetching exchanges:', error);
            return { exchanges: [], stats: {} };
        }
    };

    // New analytics fetch function
    const fetchAnalytics = async () => {
        try {
            setAnalyticsLoading(true);
            setAnalyticsError(null);

            const res = await fetch('/api/analytics/dashboard');
            if (!res.ok) {
                if (res.status === 401) {
                    throw new Error('Authentication required');
                }
                throw new Error('Failed to fetch analytics data');
            }

            const data = await res.json();
            console.log(data);
            if (data.success) {
                setAnalyticsData(data.data);
            } else {
                throw new Error(data.error || 'Failed to fetch analytics');
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
            setAnalyticsError(error.message);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    // Load all data
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch main dashboard data in parallel
                const [userData, skillsData, exchangeData] = await Promise.all([
                    fetchUserData(),
                    fetchSkills(),
                    fetchExchanges(),
                ]);

                setUser(userData);
                setSkills(skillsData);
                setExchanges(exchangeData.exchanges);
                setStats(exchangeData.stats);

                // Fetch analytics data separately (non-blocking)
                fetchAnalytics();
            } catch (error) {
                console.error('Error loading dashboard data:', error);
                setError('Failed to load dashboard data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Calculate metrics (unchanged)
    const skillMetrics = {
        total: user?.stats?.totalSkills ?? skills.length ?? 0,
        active: user?.stats?.activeSkills ?? skills.filter(s => s.isAvailable).length ?? 0,
        views: user?.stats?.totalViews ?? skills.reduce((acc, s) => acc + (s.viewCount || 0), 0),
        interested: skills.reduce((acc, s) => acc + (s.interestedUsers?.length || 0), 0),
    };

    const exchangeMetrics = {
        total: stats?.total ?? 0,
        completed: stats?.completed ?? 0,
        active: stats?.active ?? 0,
        pending: stats?.pending ?? 0,
    };

    // Loading state (unchanged)
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <Loader className="h-8 w-8 animate-spin text-gray-600 dark:text-gray-400 mx-auto" />
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    // Error state (unchanged)
    if (error) {
        return (
            <div className="text-center py-12">
                <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Compact Header with User Name */}
            <div>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Dashboard
                        </h1>
                        {user?.name && (
                            <div className='flex gap-6'>
                                <p className="text-lg text-gray-600 dark:text-gray-400">
                                    Welcome back, {user.name}!
                                </p>
                                <div className="flex justify-center items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                    <span className="text-md font-medium text-gray-900 dark:text-white">
                                        {user.rating ? user.rating.toFixed(1) : '0.0'}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        ({user.reviewCount || 0} reviews)
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Here's an overview of your activity and performance.
                </p>
            </div>

            {/* Analytics Charts Section */}
            <div>
                <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Analytics Overview
                    </h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SkillViewsChart
                        data={analyticsData?.skillViews}
                        loading={analyticsLoading}
                    />
                    <ExchangesChart
                        data={analyticsData?.exchanges}
                        loading={analyticsLoading}
                    />
                </div>

                {/* Analytics Error State */}
                {analyticsError && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-700 dark:text-red-300">
                            Failed to load analytics: {analyticsError}
                        </p>
                        <button
                            onClick={fetchAnalytics}
                            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
                        >
                            Try again
                        </button>
                    </div>
                )}
            </div>

            {/* Skills Metrics */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Skills Overview
                    </h2>
                    <Link
                        href="/my-skills"
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center"
                    >
                        View all skills
                        <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <MetricCard
                        title="Total Skills"
                        value={skillMetrics.total}
                        icon={<BookOpen className="h-5 w-5" />}
                    />
                    <MetricCard
                        title="Active Skills"
                        value={skillMetrics.active}
                        icon={<Activity className="h-5 w-5" />}
                    />
                    <MetricCard
                        title="Interested Users"
                        value={skillMetrics.interested}
                        icon={<Users className="h-5 w-5" />}
                    />
                </div>
            </div>

            {/* Exchange Metrics */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Exchange Activity
                    </h2>
                    <Link
                        href="/exchanges"
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center"
                    >
                        View all exchanges
                        <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        title="Total Exchanges"
                        value={exchangeMetrics.total}
                        icon={<Repeat className="h-5 w-5" />}
                    />
                    <MetricCard
                        title="Completed"
                        value={exchangeMetrics.completed}
                        icon={<Star className="h-5 w-5" />}
                    />
                    <MetricCard
                        title="In Progress"
                        value={exchangeMetrics.active}
                        icon={<Activity className="h-5 w-5" />}
                    />
                    <MetricCard
                        title="Pending Actions"
                        value={exchangeMetrics.pending}
                        icon={<Activity className="h-5 w-5" />}
                    />
                </div>
            </div>
        </div>
    );
}
