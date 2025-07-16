// app/exchange/[id]/page.js
'use client';

import { Handshake, Users, Clock, MessageCircle, Loader2, UserCheck, Timer, AlertTriangle, X } from 'lucide-react';
import React, { useState, useEffect, use } from 'react';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import TimelineManager from '@/components/exchange/TimelineManager';
import { getUserAcceptanceStatus, getAcceptanceStatusMessage } from '@/utils/exchangeChatHelpers';
import ExchangeSidebar from '@/components/exchange/ExchangeSidebar';

export default function ExchangeDetailPage({ params }) {
    const { id } = use(params);
    const { user } = useUser();
    const router = useRouter();

    // State for exchange data
    const [exchange, setExchange] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startingNegotiation, setStartingNegotiation] = useState(false);

    // NEW: Cancel exchange state
    const [cancellingExchange, setCancellingExchange] = useState(false);
    const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);

    // Acceptance status state
    const [acceptanceStatus, setAcceptanceStatus] = useState(null);
    const [acceptanceMessage, setAcceptanceMessage] = useState(null);

    // Fetch exchange data
    const fetchExchange = async () => {
        if (!user) return;

        try {
            const response = await fetch(`/api/exchanges/${id}`, {
                cache: 'no-store' // Ensure fresh data
            });
            const data = await response.json();
            if (data.success) {
                setExchange(data.exchange);
                // Calculate acceptance status
                if (data.exchange) {
                    const userAcceptanceStatus = getUserAcceptanceStatus(data.exchange, user.id);
                    const userAcceptanceMessage = getAcceptanceStatusMessage(data.exchange, user.id);
                    setAcceptanceStatus(userAcceptanceStatus);
                    setAcceptanceMessage(userAcceptanceMessage);
                }
            } else {
                setError(data.error);
            }
        } catch (err) {
            console.error('Error fetching exchange:', err);
            setError('Failed to load exchange');
        } finally {
            setLoading(false);
        }
    };

    // Load exchange data
    useEffect(() => {
        fetchExchange();
    }, [user, id]);

    // Check if negotiation is available - exclude expired and cancelled
    const canNegotiate = exchange && [
        'pending', 
        'negotiating', 
        'pending_acceptance', 
        'accepted'
    ].includes(exchange.status);

    // Get user role
    const isInitiator = exchange?.initiator?.userId?._id === user?._id;
    const isRecipient = exchange?.recipient?.userId?._id === user?._id;
    const userRole = isInitiator ? 'initiator' : 'recipient';
    const otherParticipant = isInitiator ? exchange?.recipient : exchange?.initiator;
    // Selected skill title for current user's offer
    const mySkillTitle = isInitiator ? exchange?.initiatorOffer?.skillTitle : exchange?.recipientOffer?.skillTitle;

    // Check if user can start negotiation - exclude expired and cancelled
    const canStartNegotiation = exchange && (
        (exchange.status === 'pending' && isRecipient) ||
        exchange.status === 'negotiating' ||
        exchange.status === 'pending_acceptance' ||
        exchange.status === 'accepted'
    );

    // Check if exchange is in a final state
    const isFinalState = exchange && [
        'completed', 
        'cancelled', 
        'expired'
    ].includes(exchange.status);

    // NEW: Check if exchange can be cancelled
    const canCancelExchange = exchange && !isFinalState && (isInitiator || isRecipient);

    // Start negotiation function
    const handleStartNegotiation = async () => {
        if (!exchange) return;

        // If already negotiating, pending_acceptance, or accepted, just navigate
        if (['negotiating', 'pending_acceptance', 'accepted'].includes(exchange.status)) {
            router.push(`/exchange/${id}/negotiate`);
            return;
        }

        // If pending, change status to negotiating first
        if (exchange.status === 'pending' && isRecipient) {
            setStartingNegotiation(true);
            try {
                const response = await fetch(`/api/exchanges/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'negotiating' })
                });

                const data = await response.json();
                if (data.success) {
                    setExchange(data.exchange);
                    router.push(`/exchange/${id}/negotiate`);
                } else {
                    setError(data.error || 'Failed to start negotiation');
                }
            } catch (err) {
                console.error('Error starting negotiation:', err);
                setError('Failed to start negotiation');
            } finally {
                setStartingNegotiation(false);
            }
        }
    };

    // NEW: Cancel exchange function
    const handleCancelExchange = async () => {
        if (!exchange || cancellingExchange) return;

        setCancellingExchange(true);
        try {
            const response = await fetch(`/api/exchanges/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    status: 'cancelled',
                    cancelledBy: user.supabaseId,
                    cancelledAt: new Date().toISOString()
                })
            });

            const data = await response.json();
            if (data.success) {
                setExchange(data.exchange);
                setShowCancelConfirmation(false);
                // Optional: Show success message
                setError(null);
            } else {
                setError(data.error || 'Failed to cancel exchange');
            }
        } catch (err) {
            console.error('Error cancelling exchange:', err);
            setError('Failed to cancel exchange');
        } finally {
            setCancellingExchange(false);
        }
    };

    // Get status display - now includes expired status
    const getStatusDisplay = (status) => {
        const displays = {
            'pending': { 
                color: 'text-yellow-700 bg-yellow-100 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700', 
                label: 'Pending' 
            },
            'negotiating': { 
                color: 'text-blue-700 bg-blue-100 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700', 
                label: 'Negotiating' 
            },
            'pending_acceptance': { 
                color: 'text-orange-700 bg-orange-100 border-orange-300 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700', 
                label: 'Pending Acceptance' 
            },
            'accepted': { 
                color: 'text-green-700 bg-green-100 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700', 
                label: 'Accepted' 
            },
            'in_progress': { 
                color: 'text-purple-700 bg-purple-100 border-purple-300 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700', 
                label: 'In Progress' 
            },
            'completed': { 
                color: 'text-gray-700 bg-gray-100 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600', 
                label: 'Completed' 
            },
            'cancelled': { 
                color: 'text-red-700 bg-red-100 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-700', 
                label: 'Cancelled' 
            },
            'expired': { 
                color: 'text-amber-700 bg-amber-100 border-amber-300 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-700', 
                label: 'Expired' 
            }
        };
        return displays[status] || displays.pending;
    };

    // Get expiry date display
    const getExpiryInfo = () => {
        if (!exchange?.expiresAt) return null;
        
        const expiryDate = new Date(exchange.expiresAt);
        const now = new Date();
        const isExpired = now > expiryDate;
        const timeDiff = Math.abs(expiryDate - now);
        const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        return {
            expiryDate,
            isExpired,
            daysLeft,
            isExpiringSoon: daysLeft <= 3 && !isExpired
        };
    };

    const expiryInfo = getExpiryInfo();

    return (
        <div className="min-h-screen pt-10 bg-white dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Page Title */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Exchange Details
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        View exchange details and communicate with the other party
                    </p>
                    {
                        exchange?.status === "accepted" && (
                            <TimelineManager exchangeId={id} />
                        )
                    }
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg">
                        <p className="text-red-700 dark:text-red-300">{error}</p>
                    </div>
                )}

                {/* Cancelled Status Banner */}
                {exchange?.status === 'cancelled' && (
                    <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg">
                        <div className="flex items-center gap-3">
                            <X className="w-5 h-5 text-red-700 dark:text-red-300" />
                            <div className="flex-1">
                                <p className="font-medium text-red-700 dark:text-red-300">
                                    This exchange has been cancelled
                                </p>
                                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                    No further actions can be taken on this exchange.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Expired Status Banner */}
                {exchange?.status === 'expired' && (
                    <div className="mb-6 p-4 bg-amber-100 dark:bg-amber-900 border border-amber-300 dark:border-amber-700 rounded-lg">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-300" />
                            <div className="flex-1">
                                <p className="font-medium text-amber-700 dark:text-amber-300">
                                    This exchange has expired
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Expiry Warning Banner */}
                {expiryInfo?.isExpiringSoon && !isFinalState && (
                    <div className="mb-6 p-4 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Timer className="w-5 h-5 text-yellow-700 dark:text-yellow-300" />
                            <div className="flex-1">
                                <p className="font-medium text-yellow-700 dark:text-yellow-300">
                                    Exchange expiring soon
                                </p>
                                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                                    This exchange will expire in {expiryInfo.daysLeft} day{expiryInfo.daysLeft !== 1 ? 's' : ''} on {expiryInfo.expiryDate.toLocaleDateString()}.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Acceptance Status Banner */}
                {acceptanceMessage && exchange?.status === 'pending_acceptance' && (
                    <div className={`mb-6 p-4 rounded-lg border ${acceptanceMessage.bgColor}`}>
                        <div className="flex items-center gap-3">
                            <Timer className={`w-5 h-5 ${acceptanceMessage.color}`} />
                            <div className="flex-1">
                                <p className={`font-medium ${acceptanceMessage.color}`}>
                                    {acceptanceMessage.message}
                                </p>
                                {acceptanceStatus && (
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center gap-2">
                                            <UserCheck className={`w-4 h-4 ${acceptanceStatus.hasAccepted ? 'text-green-600' : 'text-gray-400'}`} />
                                            <span className={`text-sm ${acceptanceStatus.hasAccepted ? 'text-green-600' : 'text-gray-500'}`}>
                                                You: {acceptanceStatus.hasAccepted ? 'Accepted' : 'Pending'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <UserCheck className={`w-4 h-4 ${acceptanceStatus.otherUserAccepted ? 'text-green-600' : 'text-gray-400'}`} />
                                            <span className={`text-sm ${acceptanceStatus.otherUserAccepted ? 'text-green-600' : 'text-gray-500'}`}>
                                                {otherParticipant?.userId?.name || 'Other party'}: {acceptanceStatus.otherUserAccepted ? 'Accepted' : 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* NEW: Cancel Confirmation Modal */}
                {showCancelConfirmation && (
                    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                                    <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Cancel Exchange
                                </h3>
                            </div>
                            
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Are you sure you want to cancel this exchange? This action cannot be undone and neither party will be able to continue with this exchange.
                            </p>
                            
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowCancelConfirmation(false)}
                                    disabled={cancellingExchange}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    Keep Exchange
                                </button>
                                <button
                                    onClick={handleCancelExchange}
                                    disabled={cancellingExchange}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors flex items-center gap-2"
                                >
                                    {cancellingExchange ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Cancelling...
                                        </>
                                    ) : (
                                        <>
                                            <X className="w-4 h-4" />
                                            Cancel Exchange
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Exchange Details (Left Column) */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Exchange Overview */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Exchange Overview
                                </h2>

                                <div className="flex items-center gap-3">
                                    {/* Status Badge */}
                                    {exchange && (
                                        <span className={`px-3 py-1 rounded-md text-sm font-medium border ${getStatusDisplay(exchange.status).color}`}>
                                            {getStatusDisplay(exchange.status).label}
                                        </span>
                                    )}

                                    {/* NEW: Cancel Button */}
                                    {canCancelExchange && (
                                        <button
                                            onClick={() => setShowCancelConfirmation(true)}
                                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            title="Cancel Exchange"
                                        >
                                            <X className="w-4 h-4" />
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>

                            {loading ? (
                                <div className="animate-pulse space-y-4">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                                </div>
                            ) : exchange ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Exchange ID
                                            </h4>
                                            <p className="text-gray-900 dark:text-white">#{exchange.exchangeId}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Other Participant
                                        </h4>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                                                <Users className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                            </div>
                                            <div>
                                                <p className="text-gray-900 dark:text-white font-medium">
                                                    {otherParticipant?.userId?.name || 'Unknown User'}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {isInitiator ? 'Recipient' : 'Initiator'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <Clock className="w-4 h-4" />
                                            <span>Created {new Date(exchange.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {/* Offers Section */}
                        {exchange && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                                    Exchange Offers
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Your Offer */}
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                                            {`Your Offer ${exchange?.status === 'accepted' && mySkillTitle ? ' - ' + mySkillTitle : ''}`}
                                        </h3>
                                        <div className="space-y-2">
                                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                                {isInitiator
                                                    ? exchange.initiatorOffer?.description
                                                    : exchange.recipientOffer?.description
                                                    || 'No description provided'
                                                }
                                            </p>
                                            {((isInitiator && exchange.initiatorOffer?.skillTitle) ||
                                                (!isInitiator && exchange.recipientOffer?.skillTitle)) && (
                                                    <div className="text-xs text-blue-600 dark:text-blue-400">
                                                        Skill: {isInitiator
                                                            ? exchange.initiatorOffer.skillTitle
                                                            : exchange.recipientOffer.skillTitle
                                                        }
                                                    </div>
                                                )}
                                        </div>
                                    </div>

                                    {/* Their Offer */}
                                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                        <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">
                                            Their Offer
                                        </h3>
                                        <div className="space-y-2">
                                            <p className="text-sm text-green-800 dark:text-green-200">
                                                {isInitiator
                                                    ? exchange.recipientOffer?.description
                                                    : exchange.initiatorOffer?.description
                                                    || 'No description provided'
                                                }
                                            </p>
                                            {((!isInitiator && exchange.initiatorOffer?.skillTitle) ||
                                                (isInitiator && exchange.recipientOffer?.skillTitle)) && (
                                                    <div className="text-xs text-green-600 dark:text-green-400">
                                                        Skill: {isInitiator
                                                            ? exchange.recipientOffer.skillTitle
                                                            : exchange.initiatorOffer.skillTitle
                                                        }
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                </div>

                                {/* Negotiate Button Section */}
                                {canStartNegotiation && (
                                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                                    {exchange.status === 'pending' && isRecipient
                                                        ? 'Ready to Start Negotiation?'
                                                        : exchange.status === 'pending_acceptance'
                                                            ? 'Negotiation in Progress'
                                                            : exchange.status === 'accepted'
                                                                ? 'Discuss Exchange'
                                                                : 'Continue Negotiation'
                                                    }
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    {exchange.status === 'pending' && isRecipient
                                                        ? 'Accept this exchange request and start negotiating offers'
                                                        : exchange.status === 'pending_acceptance'
                                                            ? 'Exchange is in acceptance phase - continue in negotiation playground'
                                                            : exchange.status === 'accepted'
                                                                ? 'Exchange has been accepted - discuss implementation details'
                                                                : 'Use our interactive playground to negotiate offers in real-time'
                                                    }
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleStartNegotiation}
                                                disabled={startingNegotiation}
                                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors shadow-lg"
                                            >
                                                {startingNegotiation ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        Starting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Handshake className="w-5 h-5" />
                                                        {exchange.status === 'pending' && isRecipient
                                                            ? 'Start Negotiation'
                                                            : exchange.status === 'pending_acceptance'
                                                                ? 'Continue to Acceptance'
                                                                : exchange.status === 'accepted'
                                                                    ? 'Discuss'
                                                                    : 'Continue Negotiation'
                                                        }
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Message when negotiation isn't available */}
                                {!canStartNegotiation && exchange && (
                                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <MessageCircle className="w-5 h-5 text-gray-500" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {exchange.status === 'pending' && isInitiator
                                                        ? 'Waiting for recipient response'
                                                        : exchange.status === 'expired'
                                                            ? 'Exchange has expired'
                                                            : exchange.status === 'cancelled'
                                                                ? 'Exchange was cancelled'
                                                                : exchange.status === 'completed'
                                                                    ? 'Exchange completed'
                                                                    : 'Negotiation not available'
                                                    }
                                                </p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    {exchange.status === 'pending' && isInitiator
                                                        ? 'The recipient needs to accept the exchange request first'
                                                        : exchange.status === 'expired'
                                                            ? 'This exchange has expired and no further actions can be taken'
                                                            : exchange.status === 'cancelled'
                                                                ? 'This exchange was cancelled and cannot be reactivated'
                                                                : exchange.status === 'completed'
                                                                    ? 'This exchange has been completed successfully'
                                                                    : `Current status: ${getStatusDisplay(exchange.status).label}`
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar */}
                    <div className="lg:col-span-1">
                        <ExchangeSidebar exchange={exchange} user={user} />
                    </div>
                </div>
            </div>
        </div>
    );
}
