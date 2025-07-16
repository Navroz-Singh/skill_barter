// app/profile/skills/page.js

'use client';

import { useState, useEffect } from 'react';
import { Plus, Loader } from 'lucide-react';
import Link from 'next/link';
import SkillCard from '@/components/profile/SkillCard';

export default function SkillsPage() {
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch skills data
    const fetchSkills = async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await fetch('/api/skills/my-skills');
            if (!res.ok) throw new Error('Failed to fetch skills');

            const { skills } = await res.json();
            setSkills(skills || []);
        } catch (error) {
            console.error('Error fetching skills:', error);
            setError('Failed to load skills. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Load data on mount
    useEffect(() => {
        fetchSkills();
    }, []);

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <Loader className="h-8 w-8 animate-spin text-gray-600 dark:text-gray-400 mx-auto" />
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Loading your skills...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="text-center py-12">
                <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>
                <button
                    onClick={fetchSkills}
                    className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        My Skills
                    </h1>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                        Manage and showcase your skills to the community
                    </p>
                </div>
                <Link
                    href="/my-skills/add"
                    className="inline-flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Add Skill
                </Link>
            </div>

            {/* Skills Grid */}
            {skills.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                        You haven't added any skills yet.
                    </p>
                    <Link
                        href="/my-skills/add"
                        className="inline-flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200"
                    >
                        <Plus className="h-4 w-4" />
                        Add Your First Skill
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {skills.map(skill => (
                        <SkillCard key={skill.id} skill={skill} />
                    ))}
                </div>
            )}
        </div>
    );
}
