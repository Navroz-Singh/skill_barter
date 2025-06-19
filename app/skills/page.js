'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';

export default function SkillsPage() {
    const { user } = useUser();
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSkills();
    }, []);

    const fetchSkills = async () => {
        try {
            const response = await fetch('/api/skills');
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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="container mx-auto px-4">
                {/* Page Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            All Skills
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Discover skills shared by our community
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {user && (
                            <>
                                <Link
                                    href="/skills/my-skills"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    My Skills
                                </Link>
                                <Link
                                    href="/skills/add"
                                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                                >
                                    Add Skill
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Content will be added here for skills listing */}
                <div className="text-center py-12">
                    <p className="text-gray-600 dark:text-gray-400">
                        Skills listing functionality coming soon...
                    </p>
                </div>
            </div>
        </div>
    );
}
