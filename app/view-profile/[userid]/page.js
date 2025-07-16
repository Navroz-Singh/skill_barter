'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    MapPin,
    Calendar,
    Star,
    BookOpen,
    Eye,
    Users,
    MessageCircle,
    ArrowLeft,
    Loader,
    UserX
} from 'lucide-react';

export default function PublicProfilePage() {
    const params = useParams();
    const { userid } = params;

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch user data
    const fetchPublicUserData = async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await fetch(`/api/user/public/${userid}`);

            if (!res.ok) {
                if (res.status === 404) {
                    setError('User not found');
                } else {
                    setError('Failed to load user profile');
                }
                return;
            }

            const { user: userData } = await res.json();
            setUser(userData);
        } catch (error) {
            console.error('Error fetching public user data:', error);
            setError('Failed to load user profile');
        } finally {
            setLoading(false);
        }
    };

    // Load user data on mount
    useEffect(() => {
        if (userid) {
            fetchPublicUserData();
        }
    }, [userid]);

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen pt-20 bg-white dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="h-8 w-8 animate-spin text-gray-600 dark:text-gray-400 mx-auto" />
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Loading profile...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen pt-10 bg-white dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <UserX className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {error === 'User not found' ? 'User Not Found' : 'Error Loading Profile'}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {error === 'User not found'
                            ? "The user profile you're looking for doesn't exist or is no longer available."
                            : "There was an error loading the user profile. Please try again."
                        }
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link
                            href="/browse"
                            className="inline-flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Browse
                        </Link>
                        {error !== 'User not found' && (
                            <button
                                onClick={fetchPublicUserData}
                                className="inline-flex items-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Try Again
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // No user data
    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen pt-10 bg-white dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* User Profile Card */}
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-6">

                        {/* Avatar and Basic Info */}
                        <div className="flex flex-col items-center md:items-start">
                            <img
                                src={user.avatar || '/default-avatar.png'}
                                alt={`${user.name}'s profile`}
                                className="w-24 h-24 rounded-full border-2 border-gray-200 dark:border-gray-700 mb-4"
                            />
                            <div className="text-center md:text-left">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    {user.name}
                                </h1>

                                {/* Rating */}
                                {user.reviewCount > 0 && (
                                    <div className="flex items-center gap-1 mb-2">
                                        <Star className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {user.rating.toFixed(1)}
                                        </span>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            ({user.reviewCount} reviews)
                                        </span>
                                    </div>
                                )}

                                {/* Location */}
                                {user.location && (
                                    <div className="flex items-center gap-1 mb-2">
                                        <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {user.location}
                                        </span>
                                    </div>
                                )}

                                {/* Member Since */}
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        Member since {formatDate(user.memberSince)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Bio and Stats */}
                        <div className="flex-1">
                            {/* Bio */}
                            {user.bio && (
                                <div className="mb-4">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                        About
                                    </h2>
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                        {user.bio}
                                    </p>
                                </div>
                            )}

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                                        {user.skillCount}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Skills
                                    </div>
                                </div>
                                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                                        {user.stats?.totalViews || 0}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Profile Views
                                    </div>
                                </div>
                                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                                        {user.stats?.successfulExchanges || 0}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Exchanges
                                    </div>
                                </div>
                                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                                        {user.rating > 0 ? user.rating.toFixed(1) : 'New'}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Rating
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Skills Section */}
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Available Skills ({user.skillCount})
                        </h2>
                    </div>

                    {user.skills.length === 0 ? (
                        <div className="text-center py-8">
                            <BookOpen className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                            <p className="text-gray-500 dark:text-gray-400">
                                No skills available for exchange yet.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {user.skills.map(skill => (
                                <div
                                    key={skill._id}
                                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">
                                            {skill.title}
                                        </h3>
                                    </div>

                                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
                                        {skill.description}
                                    </p>

                                    <div className="flex gap-2 mb-3">
                                        <span className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs">
                                            {skill.category}
                                        </span>
                                        <span className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs">
                                            {skill.level}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                            {skill.viewCount > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <Eye className="w-3 h-3" />
                                                    {skill.viewCount}
                                                </span>
                                            )}
                                            {skill.interestedCount > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    {skill.interestedCount}
                                                </span>
                                            )}
                                        </div>

                                        <Link
                                            href={`/skill/${skill._id}`}
                                            className="text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Contact/Exchange Action */}
                <div className="mt-6 text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Interested in exchanging skills with {user.name}?
                    </p>
                    <Link
                        href={`/browse?user=${userid}`}
                        className="inline-flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                    >
                        <MessageCircle className="w-4 h-4" />
                        View Their Skills
                    </Link>
                </div>
            </div>
        </div>
    );
}
