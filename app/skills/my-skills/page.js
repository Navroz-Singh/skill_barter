'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useUser from '@/hooks/use-user';

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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="container mx-auto px-4">
                {/* Breadcrumb Navigation */}
                <nav className="mb-6 text-sm">
                    <ol className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                        <li><Link href="/skills" className="hover:text-green-600">Skills</Link></li>
                        <li>/</li>
                        <li className="text-gray-900 dark:text-white">My Skills</li>
                    </ol>
                </nav>

                {/* Page Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            My Skills
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Manage your shared skills and track their performance
                        </p>
                    </div>
                    <Link
                        href="/skills/add"
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                    >
                        Add New Skill
                    </Link>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                {/* Skills Grid */}
                {skills.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🎯</div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No skills shared yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Start sharing your expertise with the community!
                        </p>
                        <Link
                            href="/skills/add"
                            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors"
                        >
                            Share Your First Skill
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {skills.map((skill) => (
                            <div key={skill.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                                {/* Skill Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                            {skill.title}
                                        </h3>
                                        <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                            {skill.category}
                                        </span>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${skill.isAvailable
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {skill.isAvailable ? 'Available' : 'Unavailable'}
                                    </span>
                                </div>

                                {/* Skill Details */}
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                                    {skill.description}
                                </p>

                                {/* Skill Meta */}
                                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex justify-between">
                                        <span>Level:</span>
                                        <span className="font-medium">{skill.level}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Views:</span>
                                        <span className="font-medium">{skill.viewCount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Exchanges:</span>
                                        <span className="font-medium">{skill.exchangeCount}</span>
                                    </div>
                                    {skill.deliveryMethod && (
                                        <div className="flex justify-between">
                                            <span>Method:</span>
                                            <span className="font-medium">{skill.deliveryMethod}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Tags */}
                                {skill.tags && skill.tags.length > 0 && (
                                    <div className="mt-4">
                                        <div className="flex flex-wrap gap-1">
                                            {skill.tags.slice(0, 3).map((tag, index) => (
                                                <span
                                                    key={index}
                                                    className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded"
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
                                <div className="mt-4 flex gap-2">
                                    <button className="flex-1 bg-blue-600 text-white text-sm py-2 px-3 rounded hover:bg-blue-700 transition-colors">
                                        Edit
                                    </button>
                                    <button className="flex-1 bg-gray-600 text-white text-sm py-2 px-3 rounded hover:bg-gray-700 transition-colors">
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
