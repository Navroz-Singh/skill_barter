'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SkillForm from '@/components/skills/skill-form';
import { useUser } from '@/hooks/use-user';

export default function AddSkillPage() {
    const { user, loading } = useUser();
    const router = useRouter();
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth');
        }
    }, [user, loading, router]);

    // Handle successful skill submission
    const handleSkillSuccess = (skill) => {
        setSuccessMessage(`Skill "${skill.title}" has been submitted successfully!`);

        // Redirect to my skills page after 2 seconds
        setTimeout(() => {
            router.push('/skills/my-skills');
        }, 2000);
    };

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-10 bg-white dark:bg-gray-900">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb Navigation */}
                <nav className="mb-6 text-sm">
                    <ol className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <li><a href="/skills" className="hover:text-[var(--parrot)] transition-colors duration-200">Skills</a></li>
                        <li>/</li>
                        <li className="text-gray-900 dark:text-white">Add Skill</li>
                    </ol>
                </nav>

                {/* Page Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Add Your Skill
                    </h1>
                    <p className="text-lg sm:text-xl text-[var(--parrot)] max-w-2xl mx-auto">
                        Share your expertise with the community. Whether you're a beginner or expert,
                        your skills can help others learn and grow.
                    </p>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="max-w-2xl mx-auto mb-6">
                        <div className="bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 px-6 py-4 rounded-lg">
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <div>
                                    <span className="block font-medium">{successMessage}</span>
                                    <span className="block text-sm text-green-600 dark:text-green-400 mt-1">Redirecting to your skills...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Skill Form */}
                <SkillForm onSuccess={handleSkillSuccess} />

                {/* Help Section */}
                <div className="max-w-2xl mx-auto mt-8 p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="flex-shrink-0">
                            <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                Tips for a Great Skill Listing
                            </h3>
                            <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400 dark:text-gray-500 mt-1">•</span>
                                    <span>Be specific about what you can teach</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400 dark:text-gray-500 mt-1">•</span>
                                    <span>Include your experience level honestly</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400 dark:text-gray-500 mt-1">•</span>
                                    <span>Add relevant tags to help others find your skill</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400 dark:text-gray-500 mt-1">•</span>
                                    <span>Mention if you prefer online or in-person teaching</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400 dark:text-gray-500 mt-1">•</span>
                                    <span>Provide a realistic time estimate for learning</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
