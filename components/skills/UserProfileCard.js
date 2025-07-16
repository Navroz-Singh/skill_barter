'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star, CheckCircle, Handshake, MessageCircle, ArrowRightLeft, Loader2, User } from 'lucide-react';
import ExchangeRequestModal from '@/components/modals/ExchangeRequestModal';

export default function UserProfileCard({ skillData, currentUser }) {
    const router = useRouter();

    // useState only for values that need re-rendering
    const [loading, setLoading] = useState(false);
    const [existingExchange, setExistingExchange] = useState(null);
    const [checkingExchange, setCheckingExchange] = useState(false);
    const [showExchangeModal, setShowExchangeModal] = useState(false); // NEW: Modal state
    const [SkillOwner, setSkillOwner] = useState(null);

    // Derived flags – always up-to-date on every render
    const isOwnSkill = currentUser?.id === skillData.ownerSupabaseId;
    const canInitiateExchange = !!currentUser && !isOwnSkill;
    // Cache flag to avoid repeated API calls
    const hasCheckedExchangeRef = useRef(false);

    // Check for existing exchanges with this skill owner
    const checkExistingExchange = async () => {
        if (!canInitiateExchange || hasCheckedExchangeRef.current) return;

        setCheckingExchange(true);
        hasCheckedExchangeRef.current = true;

        try {
            const response = await fetch(
                `/api/exchanges?skillId=${skillData._id}&otherUserId=${skillData.ownerSupabaseId}`,
                {
                    cache: 'no-store'
                }
            );
            const data = await response.json();

            if (data.success && data.exchanges?.length > 0) {
                // Find active exchange (not completed, cancelled, or expired)
                const activeExchange = data.exchanges.find(ex =>
                    ['pending', 'negotiating', 'accepted', 'in_progress'].includes(ex.status)
                );
                setExistingExchange(activeExchange || null);
            } else {
                console.log('No existing exchanges found');
            }
        } catch (error) {
            console.error('Error checking existing exchanges:', error);
        } finally {
            setCheckingExchange(false);
        }
    };

    // UPDATED: Create new exchange with selected type from modal
    const startExchange = async (exchangeType) => {
        if (!canInitiateExchange || loading) return;

        setLoading(true);
        try {
            const response = await fetch('/api/exchanges', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientSkillId: skillData._id,
                    recipientUserId: skillData.owner._id,
                    recipientSupabaseId: skillData.ownerSupabaseId,
                    exchangeType, // Use selected type from modal
                    initiatorOffer: {
                        type: exchangeType === 'skill_for_money' ? 'money' : 'skill',
                        description: exchangeType === 'skill_for_money'
                            ? `Interested in paying for "${skillData.title}"`
                            : `Interested in exchanging skills for "${skillData.title}"`,
                        deliveryMethod: 'Both'
                    },
                    recipientOffer: {
                        type: 'skill',
                        skillTitle: skillData.title,
                        description: skillData.description,
                        deliveryMethod: skillData.deliveryMethod || 'Both'
                    }
                }),
                cache: 'no-store'
            });

            const data = await response.json();

            if (data.success) {
                setShowExchangeModal(false); // Close modal
                router.push(`/exchange/${data.exchange._id}`);
            } else {
                alert(data.error || 'Failed to create exchange');
            }
        } catch (error) {
            console.error('Error creating exchange:', error);
            alert('Failed to create exchange. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchSkillOwner = async (params) => {
        const response = await fetch(`/api/user/${skillData.ownerSupabaseId}`)
        const data = await response.json();
        setSkillOwner(data.user);
    }

    const ratingArray = [];
    for(let i = 1; i <= skillData.owner.rating; i++) {
        ratingArray.push(i);
    }

    // NEW: Handle start exchange button click (shows modal)
    const handleStartExchange = () => {
        setShowExchangeModal(true);
    };

    // Navigate to existing exchange
    const goToExistingExchange = () => {
        if (existingExchange) {
            router.push(`/exchange/${existingExchange._id}`);
        }
    };

    // View user profile
    const viewProfile = () => {
        // console.log(skillData);
        router.push(`/view-profile/${skillData.owner?._id}`);
    };

    // Check for existing exchanges once the user is known and exchange is allowed
    useEffect(() => {
        if (canInitiateExchange) {
            checkExistingExchange();
        }
        fetchSkillOwner()
    }, [canInitiateExchange]);

    return (
        <div className="space-y-6">
            {/* USER PROFILE CARD */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 sticky top-4">
                <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        {skillData.owner.avatar ? (
                            <img
                                src={skillData.owner.avatar}
                                alt="Profile"
                                className="w-full h-full rounded-full object-cover"
                            />
                        ) : (
                            skillData.owner.name?.[0]?.toUpperCase() || skillData.owner.email?.[0]?.toUpperCase() || 'U'
                        )}
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {skillData.owner?.name || skillData.owner?.firstName || 'Anonymous'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                        Skill Provider
                    </p>

                    <div className="flex items-center justify-center gap-1 mb-4">
                        {ratingArray.map((star) => (
                            <Star
                                key={star}
                                className="w-4 h-4 fill-yellow-400 text-yellow-400"
                            />
                        ))}
                        <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">{skillData.owner.rating ? skillData.owner.rating.toFixed(1) : '0.0'} ({skillData.owner.reviewCount || 0} reviews)</span>
                    </div>
                </div>

                {/* USER STATS */}
                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-center">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{SkillOwner?.stats?.totalSkills}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Skills</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{SkillOwner?.stats?.successfulExchanges}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Exchanges</div>
                    </div>
                </div>

                {/* ACTION BUTTONS - EXCHANGE INTEGRATED */}
                <div className="space-y-3">
                    {/* Primary Action Button */}
                    {isOwnSkill ? (
                        // User's own skill
                        <button
                            disabled
                            className="w-full px-4 py-3 bg-gray-400 cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                        >
                            Your Skill
                        </button>
                    ) : !currentUser ? (
                        // User not logged in
                        <button
                            onClick={() => router.push('/auth')}
                            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                        >
                            Sign In to Exchange
                        </button>
                    ) : existingExchange ? (
                        // Has existing exchange
                        <button
                            onClick={goToExistingExchange}
                            className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                            <MessageCircle className="w-4 h-4" />
                            Continue Exchange
                        </button>
                    ) : (
                        // UPDATED: Default - Show modal on click
                        <button
                            onClick={handleStartExchange}
                            disabled={loading || checkingExchange}
                            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-2"
                        >
                            {checkingExchange ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Checking...
                                </>
                            ) : (
                                <>
                                    <ArrowRightLeft className="w-4 h-4" />
                                    Start Exchange
                                </>
                            )}
                        </button>
                    )}

                    {/* Secondary Action - View Profile */}
                    <button
                        onClick={viewProfile}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <User className="w-4 h-4" />
                        View Profile
                    </button>
                </div>

                {/* EXISTING EXCHANGE STATUS */}
                {existingExchange && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                Active Exchange
                            </span>
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                            Status: {existingExchange.status.replace('_', ' ')}
                        </p>
                    </div>
                )}

                {/* TRUST INDICATORS */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Verified</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Handshake className="w-4 h-4 text-blue-500" />
                            <span>Trusted</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* NEW: Exchange Request Modal */}
            <ExchangeRequestModal
                isOpen={showExchangeModal}
                onClose={() => setShowExchangeModal(false)}
                onSubmit={startExchange}
                skillData={skillData}
                loading={loading}
            />
        </div>
    );
}
