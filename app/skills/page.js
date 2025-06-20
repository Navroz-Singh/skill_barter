'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/hooks/use-user';

export default function SkillsPage() {
    const { user } = useUser();
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        category: '',
        level: '',
        search: ''
    });

    useEffect(() => {
        fetchSkills();
    }, [filters]);

    const fetchSkills = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();

            if (filters.category) queryParams.append('category', filters.category);
            if (filters.level) queryParams.append('level', filters.level);
            if (filters.search) queryParams.append('search', filters.search);

            const response = await fetch(`/api/skills?${queryParams}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch skills');
            }

            setSkills(data.skills || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading skills...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-12 bg-white dark:bg-gray-900">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Discover Skills
                    </h1>
                    <p className="text-lg sm:text-xl text-[var(--parrot)] max-w-2xl mx-auto">
                        Explore amazing skills shared by our community members and find your next learning opportunity
                    </p>
                </div>

                {/* Action Buttons */}
                {user && (
                    <div className="flex justify-center gap-4 mb-8">
                        <Link
                            href="/my-skills"
                            className="group flex items-center bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            My Skills
                        </Link>
                        <Link
                            href="/skills/add"
                            className="group flex items-center bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Skill
                        </Link>
                    </div>
                )}

                {/* Search and Filters */}
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Search Skills
                            </label>
                            <input
                                type="text"
                                placeholder="Search by title, description, or tags..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[var(--parrot)] focus:border-[var(--parrot)] bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                            />
                        </div>

                        {/* Category Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Category
                            </label>
                            <select
                                value={filters.category}
                                onChange={(e) => handleFilterChange('category', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[var(--parrot)] focus:border-[var(--parrot)] bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all duration-200"
                            >
                                <option value="">All Categories</option>
                                <option value="Technology">Technology</option>
                                <option value="Design">Design</option>
                                <option value="Business">Business</option>
                                <option value="Language">Language</option>
                                <option value="Photography">Photography</option>
                                <option value="Music">Music</option>
                                <option value="Handcraft">Handcraft</option>
                                <option value="Education">Education</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {/* Level Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Level
                            </label>
                            <select
                                value={filters.level}
                                onChange={(e) => handleFilterChange('level', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[var(--parrot)] focus:border-[var(--parrot)] bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all duration-200"
                            >
                                <option value="">All Levels</option>
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                                <option value="Expert">Expert</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Skills Grid */}
                {skills.length === 0 ? (
                    <div className="text-center py-16">
                        {/* Target SVG Icon */}
                        <div className="mb-6 flex justify-center">
                            <svg className="w-16 h-16 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                                <circle cx="12" cy="12" r="6" strokeWidth="1.5" />
                                <circle cx="12" cy="12" r="2" strokeWidth="1.5" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                            {filters.search || filters.category || filters.level ? 'No skills found' : 'No skills available yet'}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                            {filters.search || filters.category || filters.level
                                ? 'Try adjusting your search filters to find more skills.'
                                : 'Be the first to share your expertise with the community!'
                            }
                        </p>
                        {user && (
                            <Link
                                href="/skills/add"
                                className="inline-flex items-center bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                                Share Your First Skill
                            </Link>
                        )}
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
                                </div>

                                {/* Owner Info */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                        {skill.owner?.avatar ? (
                                            <img src={skill.owner.avatar} alt={skill.owner.name} className="w-8 h-8 rounded-full" />
                                        ) : (
                                            <span className="text-gray-600 dark:text-gray-400 font-medium text-sm">
                                                {skill.owner?.name?.charAt(0) || 'U'}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {skill.owner?.name || 'Anonymous'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500">
                                            {new Date(skill.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                                    {skill.description}
                                </p>

                                {/* Stats */}
                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 mb-4">
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        {skill.viewCount} views
                                    </span>
                                    <span>{skill.deliveryMethod}</span>
                                </div>

                                {/* Tags */}
                                {skill.tags && skill.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-4">
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
                                )}

                                {/* Action Button */}
                                <button className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 py-2 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-105">
                                    View Details
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
