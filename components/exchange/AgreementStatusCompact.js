'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Clock, Users, AlertCircle, Loader2 } from 'lucide-react';
import ConfirmTermsAgreementModal from '@/components/modals/ConfirmTermsAgreementModal';

export default function AgreementStatusCompact({ 
    exchangeId, 
    currentUser, 
    agreementData: propAgreementData, // FIXED: Accept agreement data from parent
    onAgreementChange 
}) {
    const [localAgreementData, setLocalAgreementData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [agreeing, setAgreeing] = useState(false);
    const [error, setError] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // FIXED: Use prop data when available, fallback to local state
    const agreementData = propAgreementData || localAgreementData;

    // Fetch agreement data (only if no prop data provided)
    const fetchAgreementData = async () => {
        if (!exchangeId || !currentUser) return;
        
        // FIXED: Skip fetch if parent already provides data
        if (propAgreementData) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`/api/exchanges/${exchangeId}/negotiation/agreement`);
            const data = await response.json();
            
            if (data.success) {
                setLocalAgreementData(data.agreementStatus);
            } else {
                setError(data.error || 'Failed to load agreement data');
            }
        } catch (err) {
            setError('Failed to load agreement status');
        } finally {
            setLoading(false);
        }
    };

    // FIXED: Handle both prop data and local fetching
    useEffect(() => {
        if (propAgreementData) {
            // Use prop data immediately, no loading needed
            setLoading(false);
            setError(null);
        } else {
            // Fetch data if no props provided
            fetchAgreementData();
        }
    }, [exchangeId, currentUser, propAgreementData]);

    // Handle agree button click
    const handleAgreeClick = () => {
        setShowConfirmModal(true);
    };

    // FIXED: Handle modal confirmation with immediate parent state update
    const handleConfirmAgreement = async () => {
        if (!exchangeId || !currentUser) return;
        
        setAgreeing(true);
        setError(null);
        
        try {
            const response = await fetch(`/api/exchanges/${exchangeId}/negotiation/agreement`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();
            
            if (data.success) {
                // FIXED: Update local state for immediate UI feedback
                if (!propAgreementData) {
                    setLocalAgreementData(data.agreementStatus);
                }
                
                setShowConfirmModal(false);
                
                // FIXED: Pass the new agreement data to parent for immediate sync
                onAgreementChange?.(
                    data.bothAgreed, 
                    data.message, 
                    data.agreementStatus // Pass the new data to parent
                );
            } else {
                setError(data.error || 'Failed to submit agreement');
            }
        } catch (err) {
            setError('Failed to update agreement');
        } finally {
            setAgreeing(false);
        }
    };

    // Handle modal close
    const handleCloseModal = () => {
        if (!agreeing) {
            setShowConfirmModal(false);
        }
    };

    // FIXED: Only show loading if we don't have prop data and are still loading
    if (loading && !propAgreementData) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Loading...</span>
            </div>
        );
    }

    // Error state (only if no data at all)
    if (error && !agreementData) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
                <button 
                    onClick={fetchAgreementData}
                    className="text-xs text-red-600 hover:text-red-700 underline ml-1"
                >
                    Retry
                </button>
            </div>
        );
    }

    // No data available
    if (!agreementData) {
        return null;
    }

    // Extract agreement status (works with both prop and local data)
    const { 
        userAgreed, 
        otherUserAgreed, 
        bothAgreed,
        userRole 
    } = agreementData;

    // Hide component if both parties agreed
    if (bothAgreed) {
        return null;
    }

    return (
        <>
            <div className="flex items-center gap-3">
                {/* Agreement Status Indicator */}
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Users className="w-4 h-4 text-gray-500" />
                    <div className="flex items-center gap-1">
                        <div 
                            className={`w-2 h-2 rounded-full ${userAgreed ? 'bg-green-500' : 'bg-gray-300'}`} 
                            title={`You: ${userAgreed ? 'Agreed' : 'Pending'}`}
                        />
                        <div 
                            className={`w-2 h-2 rounded-full ${otherUserAgreed ? 'bg-green-500' : 'bg-gray-300'}`}
                            title={`Other party: ${otherUserAgreed ? 'Agreed' : 'Pending'}`}
                        />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {userAgreed && otherUserAgreed ? 'Both Agreed' : 
                         userAgreed ? 'Waiting for other party' :
                         otherUserAgreed ? 'Your agreement needed' : 'Agreement pending'}
                    </span>
                </div>

                {/* Agree button */}
                {!userAgreed && (
                    <button
                        onClick={handleAgreeClick}
                        disabled={agreeing}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                    >
                        <CheckCircle className="w-4 h-4" />
                        Agree to Terms
                    </button>
                )}

                {/* FIXED: Success state shows immediately when userAgreed becomes true */}
                {userAgreed && !otherUserAgreed && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg border border-green-300 dark:border-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">You agreed</span>
                    </div>
                )}

                {/* Error display */}
                {error && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded">
                        <AlertCircle className="w-3 h-3 text-red-500" />
                        <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            <ConfirmTermsAgreementModal
                isOpen={showConfirmModal}
                onClose={handleCloseModal}
                onConfirm={handleConfirmAgreement}
                loading={agreeing}
            />
        </>
    );
}
