'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/hooks/use-user';

export default function MySkillsPage() {
    const { user, loading } = useUser();
    const router = useRouter();
    const [skills, setSkills] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch user's skills
    useEffect(() => {
        if (user) {
            fetchMySkills();
        }
    }, [user]);

    const fetchMySkills = async () => {
        try {
            const response = await fetch('/api/skills/my-skills');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch skills');
            }

            setSkills(data.skills || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Show loading state
    if (loading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your skills...</p>
                </div>
            </div>
        );
    }

    // Redirect if not authenticated
    if (!user) {
        router.push('/auth');
        return null;
    }

    return (
        <div className="min-h-screen pt-8 bg-white dark:bg-gray-900">
            <div className="container mx-auto px-4 py-8">
                {/* Breadcrumb Navigation */}
                <nav className="mb-6 text-sm">
                    <ol className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                        <li><Link href="/skills" className="hover:text-gray-900 dark:hover:text-white">Skills</Link></li>
                        <li>/</li>
                        <li className="text-gray-900 dark:text-white">My Skills</li>
                    </ol>
                </nav>

                {/* Page Header */}
                <div className="text-center mb-4">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        My Skills
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-6">
                        Manage your shared skills and track their performance
                    </p>

                    {/* User Stats */}
                    {user && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 max-w-2xl mx-auto mb-8">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {user.stats?.totalSkills || 0}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Skills</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {user.stats?.activeSkills || 0}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Active Skills</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {user.stats?.totalViews || 0}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Views</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Add New Skill Button */}
                    <Link
                        href="/skills/add"
                        className="inline-flex items-center bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add New Skill
                    </Link>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg max-w-2xl mx-auto">
                        {error}
                    </div>
                )}

                {/* Skills Grid */}
                {skills.length === 0 ? (
                    <div className="text-center py-6">
                        <h3 className="text-lg font-medium text-gray-500 dark:text-white mb-4">
                            No skills shared yet
                        </h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {skills.map((skill) => (
                            <div key={skill.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200">
                                {/* Skill Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                                            {skill.title}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full font-medium">
                                                {skill.category}
                                            </span>
                                            <span className="inline-block bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs px-2 py-1 rounded-full">
                                                {skill.level}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${skill.isAvailable
                                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                            : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                                        }`}>
                                        {skill.isAvailable ? 'Available' : 'Unavailable'}
                                    </span>
                                </div>

                                {/* Skill Details */}
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                                    {skill.description}
                                </p>

                                {/* Skill Meta */}
                                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                                    <div className="flex justify-between">
                                        <span>Level:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{skill.level}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Views:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{skill.viewCount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Exchanges:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{skill.exchangeCount}</span>
                                    </div>
                                    {skill.deliveryMethod && (
                                        <div className="flex justify-between">
                                            <span>Method:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">{skill.deliveryMethod}</span>
                                        </div>
                                    )}
                                    {skill.estimatedDuration && (
                                        <div className="flex justify-between">
                                            <span>Duration:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">{skill.estimatedDuration}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Tags */}
                                {skill.tags && skill.tags.length > 0 && (
                                    <div className="mb-4">
                                        <div className="flex flex-wrap gap-1">
                                            {skill.tags.slice(0, 3).map((tag, index) => (
                                                <span
                                                    key={index}
                                                    className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                            {skill.tags.length > 3 && (
                                                <span className="text-xs text-gray-500">
                                                    +{skill.tags.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <button className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm py-2 px-3 rounded-lg font-medium transition-colors">
                                        Edit
                                    </button>
                                    <button className="flex-1 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 text-sm py-2 px-3 rounded-lg font-medium transition-colors">
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
