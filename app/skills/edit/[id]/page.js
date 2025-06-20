'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/use-user';
import Link from 'next/link';

export default function EditSkillPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, loading } = useUser();

    const [skill, setSkill] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        level: 'Beginner',
        tags: '',
        location: '',
        deliveryMethod: 'Both',
        estimatedDuration: '',
        isAvailable: true
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Redirect if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth');
        }
    }, [user, loading, router]);

    // Fetch skill on mount
    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const res = await fetch(`/api/skills/${id}`);
                const data = await res.json();
                if (res.ok) {
                    setSkill(data.skill);
                } else {
                    throw new Error(data.error || 'Failed to load skill');
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        })();
    }, [id]);

    // Populate form when skill is loaded
    useEffect(() => {
        if (skill) {
            setFormData({
                title: skill.title || '',
                description: skill.description || '',
                category: skill.category || '',
                level: skill.level || 'Beginner',
                tags: skill.tags ? skill.tags.join(', ') : '',
                location: skill.location || '',
                deliveryMethod: skill.deliveryMethod || 'Both',
                estimatedDuration: skill.estimatedDuration || '',
                isAvailable: skill.isAvailable !== undefined ? skill.isAvailable : true
            });
        }
    }, [skill]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const skillData = {
                ...formData,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
            };

            const response = await fetch(`/api/skills/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(skillData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update skill');
            }

            router.push('/my-skills');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Show loading state
    if (loading || isLoading) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading skill...</p>
                </div>
            </div>
        );
    }

    // Show error state
    if (error && !skill) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="mb-4 text-red-600 dark:text-red-400">
                        <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Error Loading Skill</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                    <button
                        onClick={() => router.push('/my-skills')}
                        className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 rounded-lg font-medium transition-all duration-200"
                    >
                        Back to My Skills
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-8 bg-white dark:bg-gray-900">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb Navigation */}
                <nav className="mb-6 text-sm">
                    <ol className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <li><Link href="/skills" className="hover:text-[var(--parrot)] transition-colors duration-200">Skills</Link></li>
                        <li>/</li>
                        <li><Link href="/my-skills" className="hover:text-[var(--parrot)] transition-colors duration-200">My Skills</Link></li>
                        <li>/</li>
                        <li className="text-gray-900 dark:text-white">Edit Skill</li>
                    </ol>
                </nav>

                {/* Page Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Edit Your Skill
                    </h1>
                    <p className="text-lg sm:text-xl text-[var(--parrot)] max-w-2xl mx-auto">
                        Update your skill information to keep it current and relevant for the community
                    </p>
                </div>

                {/* Edit Form Container */}
                <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                        Update Your Skill
                    </h2>

                    {error && (
                        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Skill Title */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Skill Title *
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                maxLength={100}
                                placeholder="e.g., Web Development, Guitar Playing"
                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[var(--parrot)] focus:border-[var(--parrot)] bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                            />
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                {formData.title.length}/100 characters
                            </p>
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Description *
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                rows={4}
                                maxLength={1000}
                                placeholder="Describe your skill, what you can teach, and your experience..."
                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[var(--parrot)] focus:border-[var(--parrot)] bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                            />
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                {formData.description.length}/1000 characters
                            </p>
                        </div>

                        {/* Category and Level Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Category */}
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Category *
                                </label>
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[var(--parrot)] focus:border-[var(--parrot)] bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all duration-200"
                                >
                                    <option value="">Select a category</option>
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

                            {/* Skill Level */}
                            <div>
                                <label htmlFor="level" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Your Level *
                                </label>
                                <select
                                    id="level"
                                    name="level"
                                    value={formData.level}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[var(--parrot)] focus:border-[var(--parrot)] bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all duration-200"
                                >
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                    <option value="Expert">Expert</option>
                                </select>
                            </div>
                        </div>

                        {/* Location and Delivery Method Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Location */}
                            <div>
                                <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    id="location"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="e.g., New York, Online, Mumbai"
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[var(--parrot)] focus:border-[var(--parrot)] bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                                />
                            </div>

                            {/* Delivery Method */}
                            <div>
                                <label htmlFor="deliveryMethod" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Delivery Method
                                </label>
                                <select
                                    id="deliveryMethod"
                                    name="deliveryMethod"
                                    value={formData.deliveryMethod}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[var(--parrot)] focus:border-[var(--parrot)] bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all duration-200"
                                >
                                    <option value="In-person">In-person</option>
                                    <option value="Online">Online</option>
                                    <option value="Both">Both</option>
                                </select>
                            </div>
                        </div>

                        {/* Estimated Duration */}
                        <div>
                            <label htmlFor="estimatedDuration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Estimated Duration
                            </label>
                            <input
                                type="text"
                                id="estimatedDuration"
                                name="estimatedDuration"
                                value={formData.estimatedDuration}
                                onChange={handleChange}
                                placeholder="e.g., 2 hours, 1 week, 3 sessions"
                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[var(--parrot)] focus:border-[var(--parrot)] bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                            />
                        </div>

                        {/* Tags */}
                        <div>
                            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Tags (comma-separated)
                            </label>
                            <input
                                type="text"
                                id="tags"
                                name="tags"
                                value={formData.tags}
                                onChange={handleChange}
                                placeholder="e.g., React, JavaScript, Frontend"
                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[var(--parrot)] focus:border-[var(--parrot)] bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                            />
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                Separate tags with commas. Each tag max 30 characters.
                            </p>
                        </div>

                        {/* Availability Toggle */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isAvailable"
                                name="isAvailable"
                                checked={formData.isAvailable}
                                onChange={handleChange}
                                className="h-4 w-4 text-[var(--parrot)] focus:ring-[var(--parrot)] border-gray-300 dark:border-gray-600 rounded"
                            />
                            <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                This skill is currently available for exchange
                            </label>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => router.push('/my-skills')}
                                className="flex-1 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 border border-gray-200 dark:border-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 py-3 px-4 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-[var(--parrot)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                                {isSubmitting ? 'Updating...' : 'Update Skill'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
