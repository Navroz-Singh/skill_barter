'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SkillForm from '@/components/SkillForm';
import { useUser } from '@/hooks/use-user';

export default function AddSkillPage() {
    const { user, loading } = useUser();
    const router = useRouter();
    const [successMessage, setSuccessMessage] = useState('');

    // Handle successful skill submission
    const handleSkillSuccess = (skill) => {
        setSuccessMessage(`Skill "${skill.title}" has been submitted successfully!`);

        // Updated redirect path
        setTimeout(() => {
            router.push('/skills/my-skills');
        }, 2000);
    };

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
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
                        <li><a href="/skills" className="hover:text-green-600">Skills</a></li>
                        <li>/</li>
                        <li className="text-gray-900 dark:text-white">Add Skill</li>
                    </ol>
                </nav>

                {/* Page Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Add Your Skill
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Share your expertise with the community. Whether you're a beginner or expert,
                        your skills can help others learn and grow.
                    </p>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="max-w-2xl mx-auto mb-6">
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                            <span className="block sm:inline">{successMessage}</span>
                            <span className="block text-sm mt-1">Redirecting to your skills...</span>
                        </div>
                    </div>
                )}

                {/* Skill Form */}
                <SkillForm onSuccess={handleSkillSuccess} />

                {/* Help Section */}
                <div className="max-w-2xl mx-auto mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                        💡 Tips for a Great Skill Listing
                    </h3>
                    <ul className="space-y-2 text-blue-800 dark:text-blue-200 text-sm">
                        <li>• Be specific about what you can teach</li>
                        <li>• Include your experience level honestly</li>
                        <li>• Add relevant tags to help others find your skill</li>
                        <li>• Mention if you prefer online or in-person teaching</li>
                        <li>• Provide a realistic time estimate for learning</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
