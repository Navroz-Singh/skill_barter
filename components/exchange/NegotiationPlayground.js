'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    ArrowRightLeft,
    CheckCircle,
    XCircle,
    MessageCircle,
    AlertCircle,
    Clock,
    Target,
    UserCheck,
    Timer,
    Handshake
} from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import ChatInterface from './ChatInterface';
import UserOfferPanel from './UserOfferPanel';
import TheirOfferPanel from './TheirOfferPanel';
import AgreementStatusCompact from './AgreementStatusCompact';
import exchangeSocketManager from '@/lib/socket';

export default function NegotiationPlayground({ exchangeId, exchangeData }) {
    const { user, loading: userLoading } = useUser();

    // Core state
    const [exchange, setExchange] = useState(exchangeData);
    const [negotiationData, setNegotiationData] = useState(null);
    const [agreementData, setAgreementData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Exchange acceptance state
    const [accepting, setAccepting] = useState(false);
    const [acceptanceStatus, setAcceptanceStatus] = useState(null);

    // NEW: Confirmation modal state
    const [showAcceptanceModal, setShowAcceptanceModal] = useState(false);

    // Notification state for updates
    const [hasOfferUpdates, setHasOfferUpdates] = useState(false);
    const [updateMessage, setUpdateMessage] = useState('');

    // Computed values
    const isInitiator = user ? (exchange?.initiator?.userId?._id === user?._id) : null;
    const userRole = isInitiator === null ? null : (isInitiator ? 'initiator' : 'recipient');

    const negotiationStage = negotiationData?.status === 'drafting' ? 'drafting' :
        negotiationData?.status === 'negotiating' ? 'active' :
            agreementData?.bothAgreed ? 'agreed' :

                    negotiationData ? 'active' : 'waiting';

    const canAcceptExchange = negotiationStage === 'agreed' &&
        exchange?.status === 'pending_acceptance' &&
        !acceptanceStatus?.userAccepted;

    const canEdit = negotiationStage === 'active' || negotiationStage === 'drafting';

    // Fetch or create negotiation session
    const fetchNegotiationData = async () => {
        if (!exchangeId || !user) return;

        try {
            setLoading(true);
            let response = await fetch(`/api/exchanges/${exchangeId}/negotiation/offer`);
            let data = await response.json();

            if (!data.success && data.error === 'Negotiation session not found') {
                response = await fetch(`/api/exchanges/${exchangeId}/negotiation/offer`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                data = await response.json();
            }

            if (data.success) {
                setNegotiationData(data.negotiation);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to load negotiation data');
        } finally {
            setLoading(false);
        }
    };

    const fetchAgreementData = async () => {
        if (!exchangeId || !user) return;

        try {
            const response = await fetch(`/api/exchanges/${exchangeId}/negotiation/agreement`);
            const data = await response.json();

            if (data.success) {
                setAgreementData(data.agreementStatus);
            }
        } catch (err) {
            setError('Failed to load agreement data');
        }
    };

    const fetchAcceptanceStatus = async () => {
        if (!exchangeId || !user) return;

        try {
            const response = await fetch(`/api/exchanges/${exchangeId}`);
            const data = await response.json();

            if (data.success && data.exchange) {
                // Extract acceptance status from exchange data
                const userIsInitiator = data.exchange.initiator.userId._id === user?._id;
                const userAccepted = userIsInitiator ? data.exchange.initiatorAccepted : data.exchange.recipientAccepted;
                const otherAccepted = userIsInitiator ? data.exchange.recipientAccepted : data.exchange.initiatorAccepted;

                setAcceptanceStatus({
                    userAccepted,
                    otherUserAccepted: otherAccepted,
                    bothAccepted: userAccepted && otherAccepted
                });

                // Update exchange state
                setExchange(data.exchange);
            }
        } catch (err) {
            setError('Failed to load acceptance status');
        }
    };

    // Load all data on mount
    useEffect(() => {
        if (exchangeId && user) {
            fetchNegotiationData();
            fetchAgreementData();
            fetchAcceptanceStatus();
        }
        console.log(user)
    }, [exchangeId, user]);

    // NEW: Handle showing acceptance confirmation modal
    const handleShowAcceptanceModal = () => {
        setShowAcceptanceModal(true);
    };

    // Handle confirming acceptance
    const acceptExchangeSilently = async () => {
        if (!exchangeId || !user) return;
        if (acceptanceStatus?.userAccepted) return;
        try {
            setAccepting(true);
            setError(null);
            const response = await fetch(`/api/exchanges/${exchangeId}/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (data.success) {
                setAcceptanceStatus(prev => ({
                    ...prev,
                    userAccepted: true,
                    bothAccepted: data.bothAccepted || false,
                    otherUserAccepted: data.bothAccepted ? true : prev?.otherUserAccepted
                }));
                setExchange(prev => ({
                    ...prev,
                    status: data.bothAccepted ? 'accepted' : 'pending_acceptance'
                }));
                setUpdateMessage(data.bothAccepted ?
                    'Both parties accepted! Exchange is now active.' :
                    'You automatically accepted the exchange. Waiting for other party.'
                );
                setHasOfferUpdates(true);
                // broadcast
                if (exchangeSocketManager.isReady()) {
                    exchangeSocketManager.socket?.emit('exchange-accepted', {
                        exchangeId,
                        userSupabaseId: user.id,
                        bothAccepted: data.bothAccepted || false,
                        message: data.message
                    });
                }
            }
        } catch (err) {
            console.error('Auto-accept failed:', err);
        } finally {
            setAccepting(false);
        }
    };

    // Effect: auto-accept when both parties agree
    useEffect(() => {
        if (agreementData?.bothAgreed && !acceptanceStatus?.userAccepted) {
            acceptExchangeSilently();
        }
    }, [agreementData?.bothAgreed, acceptanceStatus?.userAccepted]);

    // Effect: update banner message when both parties accepted
    useEffect(() => {
        if (acceptanceStatus?.bothAccepted) {
            setUpdateMessage('Both parties accepted! Exchange is now active.');
            setHasOfferUpdates(true);
        }
    }, [acceptanceStatus?.bothAccepted]);

    const handleConfirmAcceptance = async () => {
        try {
            setAccepting(true);
            setError(null);
            setShowAcceptanceModal(false);

            const response = await fetch(`/api/exchanges/${exchangeId}/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (data.success) {
                // Update local state
                setAcceptanceStatus(prev => ({
                    ...prev,
                    userAccepted: true,
                    bothAccepted: data.bothAccepted || false
                }));

                // Refresh exchange data
                fetchAcceptanceStatus();

                // Show success message
                setUpdateMessage(data.bothAccepted ?
                    'Both parties accepted! Exchange is now active.' :
                    'You accepted the exchange. Waiting for other party.'
                );
                setHasOfferUpdates(true);

                // Broadcast acceptance via socket
                if (exchangeSocketManager.isReady()) {
                    exchangeSocketManager.socket?.emit('exchange-accepted', {
                        exchangeId,
                        userSupabaseId: user.id,
                        bothAccepted: data.bothAccepted || false,
                        message: data.message
                    });
                }
            } else {
                setError(data.error || 'Failed to accept exchange');
            }
        } catch (err) {
            console.error('Error accepting exchange:', err);
            setError('Failed to accept exchange');
        } finally {
            setAccepting(false);
        }
    };

    // Socket connection for negotiation updates
    useEffect(() => {
        if (!exchangeSocketManager.isReady() || !exchangeId) return;

        const handleNegotiationUpdate = (data) => {
            if (data.exchangeId === exchangeId && data.userSupabaseId !== user?.id) {
                setHasOfferUpdates(true);
                setUpdateMessage(`Other party updated their ${data.fieldName}`);
            }
        };

        const handleAgreementUpdate = (data) => {
            if (data.exchangeId !== exchangeId) return;

            console.log('Agreement update received:', data);

            // If the update indicates both parties have agreed, immediately sync local UI
            if (data.bothAgreed) {
                // Optimistically set agreement + exchange status so the accept controls appear instantly
                setAgreementData(prev => ({
                    ...prev,
                    bothAgreed: true,
                    // Preserve existing flags if present; fall back to true for the other side
                    userAgreed: prev?.userAgreed ?? false,
                    otherUserAgreed: true
                }));

                setExchange(prev => ({
                    ...prev,
                    status: 'pending_acceptance'
                }));

                setUpdateMessage('Both parties agreed! Exchange is ready for acceptance.');
                setHasOfferUpdates(true);
            }

            // Background refresh for authoritative data
            fetchNegotiationData();
            fetchAgreementData();
            fetchAcceptanceStatus();
        };

        const handleExchangeAccepted = (data) => {
            if (data.exchangeId === exchangeId && data.userSupabaseId !== user?.id) {
                fetchAcceptanceStatus();
                setUpdateMessage(data.bothAccepted ?
                    'Both parties accepted! Exchange is now active.' :
                    'Other party accepted the exchange.'
                );
                setHasOfferUpdates(true);
            }
        };

        exchangeSocketManager.socket?.on('negotiation-field-updated', handleNegotiationUpdate);
        exchangeSocketManager.socket?.on('negotiation-agreement-updated', handleAgreementUpdate);
        exchangeSocketManager.socket?.on('exchange-accepted', handleExchangeAccepted);

        return () => {
            exchangeSocketManager.socket?.off('negotiation-field-updated', handleNegotiationUpdate);
            exchangeSocketManager.socket?.off('negotiation-agreement-updated', handleAgreementUpdate);
            exchangeSocketManager.socket?.off('exchange-accepted', handleExchangeAccepted);
        };
        console.log(user)
    }, [exchangeId, user?.id]);

    const handleOfferUpdate = useCallback(async(updatedNegotiation) => {
        setNegotiationData(updatedNegotiation);

        if (exchangeSocketManager.isReady()) {
            exchangeSocketManager.socket?.emit('negotiation-field-updated', {
                exchangeId,
                userSupabaseId: user?.supabaseId,
                fieldName: 'offer',
                timestamp: new Date().toISOString()
            });
        }
    }, [exchangeId, user?.id]);

    // FIXED: Update agreement state immediately for instant UI feedback
    const handleAgreementChange = useCallback(async(bothAgreed, message, newAgreementData) => {
        console.log('Agreement change detected:', { bothAgreed, message, newAgreementData });

        // IMMEDIATE STATE UPDATE
        if (newAgreementData) {
            setAgreementData(newAgreementData);
        }

        // 🔧 FIX: Update exchange status immediately when both parties agree
        if (bothAgreed) {
            if (bothAgreed) {
                setExchange(prev => ({ ...prev, status: 'pending_acceptance' }));
            }

            setUpdateMessage('Both parties agreed! Exchange is ready for acceptance.');
        } else {
            setUpdateMessage(message || 'Agreement status updated');
        }
        setHasOfferUpdates(true);

        // Background refresh for consistency
        await Promise.all([
            fetchNegotiationData(),
            fetchAgreementData(),
            fetchAcceptanceStatus()
        ]);

        // Socket broadcast
        if (exchangeSocketManager.isReady()) {
            exchangeSocketManager.socket?.emit('negotiation-agreement-updated', {
                exchangeId,
                userSupabaseId: user?.supabaseId,
                bothAgreed,
                message,
                timestamp: new Date().toISOString()
            });
        }
    }, [exchangeId, user?.id]);


    const handleUpdatesViewed = useCallback(() => {
        setHasOfferUpdates(false);
        setUpdateMessage('');
    }, []);

    // Better loading state
    if (!exchange || userLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 animate-pulse">
                <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                        <div className="lg:col-span-2 h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header with Agreement Status Integration */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
                <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow" style={{ backgroundColor: 'var(--parrot)' }}>
                                    <ArrowRightLeft className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        Exchange Negotiation
                                    </h1>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Exchange #{exchange.exchangeId}
                                    </p>
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border ${negotiationStage === 'active'
                                ? 'border-gray-300 dark:border-gray-600 text-white shadow-sm'
                                : negotiationStage === 'drafting'
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600'
                                    : negotiationStage === 'agreed'
                                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600'
                                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600'
                                }`} style={negotiationStage === 'active' ? { backgroundColor: 'var(--parrot)' } : {}}>
                                {negotiationStage === 'active' && <Target className="w-4 h-4" />}
                                {negotiationStage === 'drafting' && <Clock className="w-4 h-4" />}
                                {negotiationStage === 'agreed' && <CheckCircle className="w-4 h-4" />}
                                {negotiationStage === 'waiting' && <Clock className="w-4 h-4" />}
                                <span className="capitalize">
                                    {negotiationStage === 'active' ? 'Negotiating' :
                                        negotiationStage === 'drafting' ? 'Drafting' :
                                            negotiationStage === 'agreed' ? 'Terms Agreed' : 'Waiting'}
                                </span>
                            </div>
                        </div>

                        {/* Agreement + Accept Actions */}
                        <div className="flex items-center gap-3">
                            {/* Show Agreement Status when appropriate - FIXED: Pass agreementData as props */}
                            {user && exchangeId && (
                                exchange?.status !== 'accepted' &&
                                exchange?.status !== 'in_progress' &&
                                exchange?.status !== 'completed' &&
                                exchange?.status !== 'cancelled'
                            ) && (
                                    <AgreementStatusCompact
                                        exchangeId={exchangeId}
                                        currentUser={user}
                                        agreementData={agreementData}
                                        onAgreementChange={handleAgreementChange}
                                    />
                                )}

                            {/* Accept Exchange Button Logic */}
                            {negotiationStage === 'agreed' && exchange?.status === 'pending_acceptance' && (
                                <div className="flex items-center gap-3">
                                    {/* Show other party's acceptance status */}
                                    {acceptanceStatus?.otherUserAccepted && !acceptanceStatus?.userAccepted && (
                                        <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                                            Other party accepted
                                        </div>
                                    )}



                                    {/* Show "You accepted" state when user has accepted but other hasn't */}
                                    {acceptanceStatus?.userAccepted && !acceptanceStatus?.bothAccepted && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-300 dark:border-blue-600">
                                            <CheckCircle className="w-4 h-4" />
                                            <span className="text-sm font-medium">You accepted - waiting for other party</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Exchange Accepted Status - both parties accepted */}
                            {acceptanceStatus?.bothAccepted && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg border border-green-300 dark:border-green-600">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="text-sm font-medium">Exchange Accepted</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Update notification banner */}
            {hasOfferUpdates && (
                <div className="mx-4 mt-4 p-4 rounded-md border bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600">
                    <div className="flex items-center gap-3">
                        <UserCheck className="w-5 h-5 text-blue-700 dark:text-blue-300" />
                        <p className="font-medium text-blue-700 dark:text-blue-300">
                            {updateMessage}
                        </p>
                        <button
                            onClick={handleUpdatesViewed}
                            className="ml-auto text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                        >
                            <XCircle className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Error Banner */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 mx-4 mt-4 rounded-md">
                    <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                        <div>
                            <p className="text-red-700 dark:text-red-300">{error}</p>
                        </div>
                        <button
                            onClick={() => setError(null)}
                            className="ml-auto text-red-500 hover:text-red-700"
                        >
                            <XCircle className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* NEW: Acceptance Confirmation Modal */}
            {showAcceptanceModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                                    <Handshake className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Confirm Exchange Acceptance
                                </h3>
                            </div>

                            <div className="mb-6">
                                <p className="text-gray-600 dark:text-gray-300 mb-4">
                                    By accepting this exchange, you agree to:
                                </p>
                                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    <li>Complete the agreed terms and deliverables</li>
                                    <li>Communicate professionally throughout the exchange</li>
                                    <li>Mark the exchange as complete when finished</li>
                                    <li>Provide honest feedback after completion</li>
                                </ul>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowAcceptanceModal(false)}
                                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmAcceptance}
                                    disabled={accepting}
                                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {accepting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Accepting...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Accept Exchange
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-[80vh]">
                    {/* User's Offer Panel */}
                    <UserOfferPanel
                        exchangeId={exchangeId}
                        currentUser={user}
                        onOfferUpdate={handleOfferUpdate}
                    />

                    {/* Chat Panel */}
                    <div className="lg:col-span-2 self-start bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                            <div className="flex items-center gap-2">
                                <MessageCircle className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Discussion</h3>
                            </div>
                        </div>
                        <div className="h-[calc(92vh-120px)]">
                            <ChatInterface
                                exchangeId={exchangeId}
                                currentUser={user}
                                exchangeStatus={exchange.status}
                                isUserLoading={userLoading}
                            />
                        </div>
                    </div>

                    {/* Their Offer Panel */}
                    <TheirOfferPanel
                        exchangeId={exchangeId}
                        currentUser={user}
                        hasUpdates={hasOfferUpdates}
                        onUpdatesViewed={handleUpdatesViewed}
                    />
                </div>
            </div>
        </div>
    );
}
