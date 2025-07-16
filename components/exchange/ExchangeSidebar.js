// components/exchange/ExchangeSidebar.js
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { AlertCircle, AlertTriangle, Star, CheckCircle, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import DeliverablesPanel from './DeliverablesPanel';
import PaymentPanel from './PaymentPanel';
import ProgressOverview from './ProgressOverview';
import ReviewModal from './ReviewModal';

const ExchangeSidebar = ({ exchange, user }) => {
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [negotiationData, setNegotiationData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [reviewLoading, setReviewLoading] = useState(false);

    // Get user's MongoDB ID for review checking
    const userMongoId = useMemo(() => {
        if (!exchange || !user) return null;

        // Get the user's MongoDB ID from the exchange participants
        const isInitiator = exchange.initiator?.supabaseId === user.supabaseId;
        return isInitiator
            ? exchange.initiator?.userId?._id
            : exchange.recipient?.userId?._id;
    }, [exchange, user]);

    // Check if user has already reviewed this exchange
    const checkReviewStatus = useCallback(async () => {
        if (!exchange?._id || !userMongoId) return;

        try {
            setReviewLoading(true);
            const response = await fetch(
                `/api/exchanges/${exchange._id}/reviews?checkUserId=${userMongoId}`,
                { cache: 'no-store' }
            );
            const data = await response.json();

            if (data.success) {
                setHasReviewed(data.hasReviewed);
            }
        } catch (err) {
            console.error('Error checking review status:', err);
        } finally {
            setReviewLoading(false);
        }
    }, [exchange?._id, userMongoId]);

    // Check if user can review (only for completed exchanges and hasn't reviewed yet)
    const canReview = useMemo(() => {
        return exchange?.status === "completed" &&
            (exchange.initiator?.supabaseId === user?.supabaseId ||
                exchange.recipient?.supabaseId === user?.supabaseId) &&
            !hasReviewed &&
            !reviewLoading;
    }, [exchange, user, hasReviewed, reviewLoading]);

    // Get other participant name for review
    const otherParticipantName = useMemo(() => {
        if (!exchange || !user) return '';

        const isInitiator = exchange.initiator?.supabaseId === user.supabaseId;
        const otherParticipant = isInitiator ? exchange.recipient : exchange.initiator;

        return otherParticipant?.userId?.name || 'Other party';
    }, [exchange, user]);

    // Memoized user role calculation
    const userRole = useMemo(() => {
        if (!exchange || !user) return null;
        return exchange.initiator?.supabaseId === user.supabaseId ? 'initiator' : 'recipient';
    }, [exchange, user]);

    // Check if sidebar should be displayed
    const shouldShowSidebar = useMemo(() => {
        return exchange && ["accepted", "in_progress", "completed"].includes(exchange.status);
    }, [exchange]);

    // Fetch negotiation data
    const fetchNegotiationData = useCallback(async () => {
        if (!exchange?._id || !shouldShowSidebar) return;

        try {
            setLoading(true);
            const response = await fetch(`/api/exchanges/${exchange._id}/negotiation/deliverables`, {
                cache: 'no-store'
            });
            const data = await response.json();

            if (data.success) {
                setNegotiationData(data);
            } else {
                setError(data.error || 'Failed to load negotiation data');
            }
        } catch (err) {
            console.error('Error fetching negotiation data:', err);
            setError('Failed to load negotiation data');
        } finally {
            setLoading(false);
        }
    }, [exchange?._id, shouldShowSidebar]);

    // Handle review modal close with status refresh
    const handleReviewModalClose = useCallback(() => {
        setShowReviewModal(false);
        // Refresh review status after modal closes (in case review was submitted)
        checkReviewStatus();
    }, [checkReviewStatus]);

    // Load data on component mount
    useEffect(() => {
        fetchNegotiationData();
        checkReviewStatus();
    }, [fetchNegotiationData, checkReviewStatus]);

    // Don't render if conditions not met
    if (!shouldShowSidebar) {
        return null;
    }

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Dispute Status Section */}
            {exchange.disputeStatus?.hasDispute && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <h4 className="font-medium text-red-900 dark:text-red-100">
                            Dispute Active
                        </h4>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                        This exchange has active disputes that need resolution.
                    </p>
                    <Link
                        href="/profile/disputes"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                    >
                        <MessageSquare className="w-4 h-4" />
                        View Disputes
                    </Link>
                </div>
            )}

            {/* Show deliverables and progress overview only if status is NOT completed */}
            {exchange.status !== "completed" && (
                <>
                    {/* Show deliverables for skill-for-skill */}
                    {exchange.exchangeType === "skill_for_skill" && (
                        <DeliverablesPanel
                            negotiationData={negotiationData}
                            userRole={userRole}
                            exchange={exchange}
                            onUpdate={fetchNegotiationData}
                        />
                    )}

                    {/* Show payment info for money-for-skill */}
                    {exchange.exchangeType === "skill_for_money" && (
                        <PaymentPanel
                            negotiationData={negotiationData}
                            userRole={userRole}
                            exchange={exchange}
                            onUpdate={fetchNegotiationData}
                        />
                    )}

                    {/* Progress overview for both types */}
                    {negotiationData?.progressReport && (
                        <ProgressOverview
                            progressReport={negotiationData.progressReport}
                            exchange={exchange}
                        />
                    )}
                </>
            )}

            {/* Review Section - Show for completed exchanges */}
            {exchange?.status === "completed" && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    {canReview ? (
                        // Show review button if user hasn't reviewed yet
                        <>
                            <div className="flex items-center gap-3 mb-4">
                                <Star className="w-5 h-5 text-yellow-400" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Review Exchange
                                </h3>
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Share your experience working with {otherParticipantName}
                            </p>

                            <button
                                onClick={() => setShowReviewModal(true)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors"
                            >
                                <Star className="w-4 h-4" />
                                Write Review
                            </button>

                            <ReviewModal
                                isOpen={showReviewModal}
                                onClose={handleReviewModalClose}
                                exchangeId={exchange?._id}
                                otherUserName={otherParticipantName}
                            />
                        </>
                    ) : hasReviewed ? (
                        // Show thank you message if user has already reviewed
                        <>
                            <div className="flex items-center gap-3 mb-4">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Review Submitted
                                </h3>
                            </div>

                            <div className="text-center py-4">
                                <div className="flex items-center justify-center gap-2 mb-3">
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                </div>
                                <p className="text-gray-900 dark:text-white font-medium mb-2">
                                    Thank you for your review!
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Your feedback about {otherParticipantName} has been submitted successfully.
                                </p>
                            </div>
                        </>
                    ) : reviewLoading ? (
                        // Show loading state while checking review status
                        <div className="animate-pulse">
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default ExchangeSidebar;
