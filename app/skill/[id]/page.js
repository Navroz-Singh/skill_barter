'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import SkillDetailsCard from '@/components/skills/SkillDetailsCard';
import UserProfileCard from '@/components/skills/UserProfileCard';

export default function SkillDetailPage({ params }) {
    const { id } = React.use(params);

    // Core state
    const [skillData, setSkillData] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isClient, setIsClient] = useState(false);

    // FETCH SKILL DETAILS
    const fetchSkillDetails = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/skills/${id}`);
            const data = await response.json();
            
            if (data.skill) {
                setSkillData(data.skill);
            } else {
                setError(data.error || 'Failed to load skill');
            }
        } catch (err) {
            setError('Failed to load skill details');
            console.error('Error fetching skill:', err);
        } finally {
            setLoading(false);
        }
    };

    // FETCH CURRENT USER
    const fetchUserData = async () => {
        try {
            const supabase = createClient();
            const { data: { user }, error } = await supabase.auth.getUser();

            if (!error && user) {
                setCurrentUser(user);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    // INITIAL LOAD
    useEffect(() => {
        if (id) {
            setIsClient(true);
            fetchSkillDetails();
            fetchUserData();
        }
    }, [id]);

    // Loading states
    if (!isClient) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div className="h-64 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !skillData) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Skill Not Found</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                        <button
                            onClick={() => window.history.back()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-10 bg-white dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* BACK BUTTON */}
                <button
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-6"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-medium">Back to Browse</span>
                </button>

                {/* MAIN CONTENT GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <SkillDetailsCard skillData={skillData} />
                    <UserProfileCard
                        skillData={skillData}
                        currentUser={currentUser}
                    />
                </div>
            </div>
        </div>
    );
}
