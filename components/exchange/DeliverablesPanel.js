// components/exchange/DeliverablesPanel.js
'use client';

import { useState, useMemo, useCallback } from 'react';
import {
    CheckCircle,
    Circle,
    Clock,
    Users,
    AlertTriangle,
    Check,
    X
} from 'lucide-react';

const DeliverablesPanel = ({ negotiationData, userRole, exchange, onUpdate }) => {
    const [loading, setLoading] = useState(null);
    const [showDispute, setShowDispute] = useState(null);
    const [disputeReason, setDisputeReason] = useState('');

    // Memoized deliverables data
    const deliverables = useMemo(() => {
        if (!negotiationData?.deliverables) return { initiator: [], recipient: [] };
        return negotiationData.deliverables;
    }, [negotiationData]);

    // Memoized progress data
    const progressData = useMemo(() => {
        if (!negotiationData?.progressReport) return null;
        return negotiationData.progressReport;
    }, [negotiationData]);

    // FIXED: Enhanced participant name resolution
    const participantNames = useMemo(() => {
        if (!exchange) return { currentUser: 'You', otherUser: 'Other party' };

        // Get current user name based on role
        const currentParticipant = userRole === 'initiator' ? exchange.initiator : exchange.recipient;
        const otherParticipant = userRole === 'initiator' ? exchange.recipient : exchange.initiator;

        // Extract names with multiple fallback options
        const currentUserName = currentParticipant?.userId?.name ||
            currentParticipant?.name ||
            'You';

        const otherUserName = otherParticipant?.userId?.name ||
            otherParticipant?.name ||
            'Other party';

        return {
            currentUser: currentUserName,
            otherUser: otherUserName
        };
    }, [exchange, userRole]);

    // Handle deliverable self-completion when session is in 'agreed' state
    const handleSelfComplete = useCallback(async (deliverableIndex, currentStatus, deliverable) => {
        // Prevent unmarking if deliverable is already confirmed by other user
        if (deliverable.confirmedBy && currentStatus) {
            return; // Exit early - don't allow unmarking confirmed deliverables
        }

        if (!exchange?._id || negotiationData?.negotiationStatus !== 'agreed') return;

        try {
            setLoading(`self-${deliverableIndex}`);

            const response = await fetch(`/api/exchanges/${exchange._id}/negotiation/deliverables`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deliverableIndex,
                    completed: !currentStatus
                })
            });

            const data = await response.json();

            if (data.success) {
                onUpdate();
            } else {
                console.error('Failed to update deliverable:', data.error);
            }
        } catch (err) {
            console.error('Error updating deliverable:', err);
        } finally {
            setLoading(null);
        }
    }, [exchange?._id, negotiationData?.negotiationStatus, onUpdate]);


    // Handle peer confirmation
    const handlePeerAction = useCallback(async (deliverableIndex, action, reason = '') => {
        if (!exchange?._id) return;

        try {
            setLoading(`peer-${deliverableIndex}`);

            const response = await fetch(`/api/exchanges/${exchange._id}/negotiation/deliverables`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    deliverableIndex,
                    reason
                })
            });

            const data = await response.json();
            if (data.success) {
                onUpdate();
                setShowDispute(null);
                setDisputeReason('');
            } else {
                console.error('Failed to process action:', data.error);
            }
        } catch (err) {
            console.error('Error processing action:', err);
        } finally {
            setLoading(null);
        }
    }, [exchange?._id, onUpdate]);

    // Get deliverable status
    const getDeliverableStatus = useCallback((deliverable) => {
        if (deliverable.disputeRaised) {
            return {
                status: 'disputed',
                color: 'text-red-600 dark:text-red-400',
                bgColor: 'bg-red-50 dark:bg-red-900/20',
                borderColor: 'border-red-200 dark:border-red-800'
            };
        }

        if (deliverable.completed && deliverable.confirmedBy) {
            return {
                status: 'confirmed',
                color: 'text-green-600 dark:text-green-400',
                bgColor: 'bg-green-50 dark:bg-green-900/20',
                borderColor: 'border-green-200 dark:border-green-800'
            };
        }

        if (deliverable.completed) {
            return {
                status: 'pending_confirmation',
                color: 'text-yellow-600 dark:text-yellow-400',
                bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
                borderColor: 'border-yellow-200 dark:border-yellow-800'
            };
        }

        return {
            status: 'pending',
            color: 'text-gray-600 dark:text-gray-400',
            bgColor: 'bg-gray-50 dark:bg-gray-700',
            borderColor: 'border-gray-200 dark:border-gray-600'
        };
    }, []);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Deliverables
                </h3>
            </div>

            {/* Enhanced Progress Summary */}
            {progressData && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Overall Progress
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Completed:</span>
                            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                {progressData.overall.percentage}%
                            </span>
                            <span className="text-xs text-gray-500">Confirmed:</span>
                            <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                {progressData.overall.confirmedPercentage}%
                            </span>
                        </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressData.overall.percentage}%` }}
                        />
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1 mt-1">
                        <div
                            className="bg-green-600 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${progressData.overall.confirmedPercentage}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {progressData.overall.completed} completed, {progressData.overall.confirmed} confirmed of {progressData.overall.total} total
                    </p>
                </div>
            )}

            {/* Your Deliverables */}
            <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Your Deliverables
                </h4>
                <div className="space-y-3">
                    {deliverables[userRole]?.length > 0 ? (
                        deliverables[userRole].map((deliverable, index) => {
                            const status = getDeliverableStatus(deliverable);

                            return (
                                <div
                                    key={index}
                                    className={`p-4 rounded-lg border transition-colors ${status.bgColor} ${status.borderColor}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <button
                                            onClick={() => handleSelfComplete(index, deliverable.completed, deliverable)}
                                            disabled={
                                                loading === `self-${index}` ||
                                                negotiationData?.negotiationStatus !== 'agreed' ||
                                                deliverable.disputeRaised ||
                                                deliverable.confirmedBy  // NEW: Disable if confirmed
                                            }
                                            className="flex-shrink-0 transition-colors disabled:opacity-50 mt-1"
                                        >
                                            {deliverable.completed ? (
                                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            ) : (
                                                <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                                            )}
                                        </button>


                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium ${deliverable.completed
                                                ? 'text-green-800 dark:text-green-200'
                                                : 'text-gray-900 dark:text-white'
                                                }`}>
                                                {deliverable.title}
                                            </p>

                                            {/* Status indicators */}
                                            <div className="flex items-center gap-4 mt-2">
                                                {deliverable.completed && (
                                                    <span className="text-xs text-green-600 dark:text-green-400">
                                                        ✓ Completed {new Date(deliverable.completedAt).toLocaleDateString()}
                                                    </span>
                                                )}

                                                {deliverable.confirmedBy && (
                                                    <span className="text-xs text-green-600 dark:text-green-400">
                                                        ✓ Confirmed {new Date(deliverable.confirmedAt).toLocaleDateString()}
                                                    </span>
                                                )}

                                                {deliverable.disputeRaised && (
                                                    <span className="text-xs text-red-600 dark:text-red-400">
                                                        ⚠ Disputed: {deliverable.disputeReason}
                                                    </span>
                                                )}

                                                {deliverable.completed && !deliverable.confirmedBy && !deliverable.disputeRaised && (
                                                    <span className="text-xs text-yellow-600 dark:text-yellow-400">
                                                        ⏳ Awaiting confirmation
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                            No deliverables set
                        </p>
                    )}
                </div>
            </div>

            {/* FIXED: Other participant's deliverables with correct name */}
            <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {participantNames.otherUser}'s Deliverables
                </h4>
                <div className="space-y-3">
                    {deliverables[userRole === 'initiator' ? 'recipient' : 'initiator']?.length > 0 ? (
                        deliverables[userRole === 'initiator' ? 'recipient' : 'initiator'].map((deliverable, index) => {
                            const status = getDeliverableStatus(deliverable);
                            const canConfirm = deliverable.completed && !deliverable.confirmedBy && !deliverable.disputeRaised;

                            return (
                                <div
                                    key={index}
                                    className={`p-4 rounded-lg border transition-colors ${status.bgColor} ${status.borderColor}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-1">
                                            {deliverable.disputeRaised ? (
                                                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                            ) : deliverable.confirmedBy ? (
                                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            ) : deliverable.completed ? (
                                                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                            ) : (
                                                <Circle className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium ${deliverable.confirmed
                                                ? 'text-green-800 dark:text-green-200'
                                                : 'text-gray-900 dark:text-white'
                                                }`}>
                                                {deliverable.title}
                                            </p>

                                            {/* Status indicators */}
                                            <div className="flex items-center gap-4 mt-2">
                                                {deliverable.completed && (
                                                    <span className="text-xs text-green-600 dark:text-green-400">
                                                        ✓ Completed {new Date(deliverable.completedAt).toLocaleDateString()}
                                                    </span>
                                                )}

                                                {deliverable.confirmedBy && (
                                                    <span className="text-xs text-green-600 dark:text-green-400">
                                                        ✓ Confirmed by you {new Date(deliverable.confirmedAt).toLocaleDateString()}
                                                    </span>
                                                )}

                                                {deliverable.disputeRaised && (
                                                    <span className="text-xs text-red-600 dark:text-red-400">
                                                        ⚠ Disputed: {deliverable.disputeReason}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Action buttons */}
                                            {canConfirm && (
                                                <div className="flex items-center gap-2 mt-3">
                                                    <button
                                                        onClick={() => handlePeerAction(index, 'confirm')}
                                                        disabled={loading === `peer-${index}`}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-xs font-medium rounded-md transition-colors"
                                                    >
                                                        <Check className="w-3 h-3" />
                                                        Confirm
                                                    </button>

                                                    <button
                                                        onClick={() => setShowDispute(index)}
                                                        disabled={loading === `peer-${index}`}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xs font-medium rounded-md transition-colors"
                                                    >
                                                        <X className="w-3 h-3" />
                                                        Dispute
                                                    </button>
                                                </div>
                                            )}

                                            {/* Dispute form */}
                                            {showDispute === index && (
                                                <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Dispute Reason
                                                    </label>
                                                    <textarea
                                                        value={disputeReason}
                                                        onChange={(e) => setDisputeReason(e.target.value)}
                                                        placeholder="Please explain why you're disputing this deliverable..."
                                                        className="w-full p-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                                        rows={3}
                                                    />
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <button
                                                            onClick={() => handlePeerAction(index, 'dispute', disputeReason)}
                                                            disabled={!disputeReason.trim() || loading === `peer-${index}`}
                                                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xs font-medium rounded-md transition-colors"
                                                        >
                                                            Submit Dispute
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setShowDispute(null);
                                                                setDisputeReason('');
                                                            }}
                                                            className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded-md transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                            No deliverables set
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeliverablesPanel;
