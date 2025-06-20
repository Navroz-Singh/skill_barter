'use client';

import { useState } from 'react';
import { useUser } from '@/hooks/use-user';

export default function SkillForm({ onSuccess }) {
    const { user } = useUser();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        level: 'Beginner',
        tags: '',
        location: '',
        deliveryMethod: 'Both',
        estimatedDuration: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Submit skill to backend
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            setError('Please log in to submit a skill');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            // Convert tags string to array and prepare data
            const skillData = {
                ...formData,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
            };

            const response = await fetch('/api/skills', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(skillData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to submit skill');
            }

            // Reset form on success
            setFormData({
                title: '',
                description: '',
                category: '',
                level: 'Beginner',
                tags: '',
                location: '',
                deliveryMethod: 'Both',
                estimatedDuration: ''
            });

            // Call success callback if provided
            if (onSuccess) {
                onSuccess(result.skill);
            }

        } catch (err) {
            setError(err.message || 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                Share Your Skill
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

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 py-3 px-4 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-[var(--parrot)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Skill'}
                </button>
            </form>
        </div>
    );
}
