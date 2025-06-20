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
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

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

    // Handle skill deletion
    const handleDelete = async (skillId) => {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/skills/${skillId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete skill');
            }

            // Remove skill from local state
            setSkills(skills.filter(skill => skill.id !== skillId));
            setDeleteConfirm(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    // Handle skill availability toggle
    const toggleAvailability = async (skillId, currentStatus) => {
        try {
            const response = await fetch(`/api/skills/${skillId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isAvailable: !currentStatus })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update skill');
            }

            // Update skill in local state
            setSkills(skills.map(skill =>
                skill.id === skillId
                    ? { ...skill, isAvailable: !currentStatus }
                    : skill
            ));
        } catch (err) {
            setError(err.message);
        }
    };

    // Show loading state
    if (loading || isLoading) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
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
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb Navigation */}
                <nav className="mb-6 text-sm">
                    <ol className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <li><Link href="/skills" className="hover:text-[var(--parrot)] transition-colors duration-200">Skills</Link></li>
                        <li>/</li>
                        <li className="text-gray-900 dark:text-white">My Skills</li>
                    </ol>
                </nav>

                {/* Page Header */}
                <div className="text-center mb-4">
                    <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        My Skills
                    </h1>
                    <p className="text-lg sm:text-xl text-[var(--parrot)] max-w-2xl mx-auto mb-6">
                        Manage your shared skills and track their performance
                    </p>

                    {/* User Stats */}
                    {user && (
                        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 max-w-2xl mx-auto mb-8">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {skills.length}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Skills</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {skills.filter(skill => skill.isAvailable).length}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Active Skills</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {skills.reduce((total, skill) => total + (skill.viewCount || 0), 0)}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Views</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Add New Skill Button */}
                    <Link
                        href="/skills/add"
                        className="inline-flex items-center bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add New Skill
                    </Link>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg max-w-2xl mx-auto">
                        {error}
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteConfirm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-md w-full p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Delete Skill
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Are you sure you want to delete "{deleteConfirm.title}"? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 border border-gray-200 dark:border-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm.id)}
                                    disabled={isDeleting}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Skills Grid */}
                {skills.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="mb-6 flex justify-center">
                            <svg className="w-16 h-16 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                            No skills shared yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                            Start sharing your expertise with the community and help others learn new skills.
                        </p>
                        <Link
                            href="/skills/add"
                            className="inline-flex items-center bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                            Share Your First Skill
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {skills.map((skill) => (
                            <div key={skill.id} className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:border-[var(--parrot)] hover:shadow-xl transition-all duration-200">
                                {/* Skill Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                                            {skill.title}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="inline-block bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs px-2 py-1 rounded-full font-medium">
                                                {skill.category}
                                            </span>
                                            <span className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                                                {skill.level}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleAvailability(skill.id, skill.isAvailable)}
                                        className={`text-xs px-2 py-1 rounded-full transition-colors duration-200 ${skill.isAvailable
                                            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'
                                            : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800'
                                            }`}
                                    >
                                        {skill.isAvailable ? 'Available' : 'Unavailable'}
                                    </button>
                                </div>

                                {/* Skill Details */}
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                                    {skill.description}
                                </p>

                                {/* Skill Meta */}
                                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    <div className="flex justify-between">
                                        <span>Level:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{skill.level}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Views:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{skill.viewCount || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Exchanges:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{skill.exchangeCount || 0}</span>
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
                                                    className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-2 py-1 rounded"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                            {skill.tags.length > 3 && (
                                                <span className="text-xs text-gray-500 dark:text-gray-500">
                                                    +{skill.tags.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <Link
                                        href={`/skills/edit/${skill.id}`}
                                        className="flex-1 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white text-sm py-2 px-3 rounded-lg font-medium transition-all duration-200 border border-gray-200 dark:border-gray-700 text-center"
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => setDeleteConfirm(skill)}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-3 rounded-lg font-medium transition-all duration-200"
                                    >
                                        Delete
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
