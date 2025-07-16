// components/modals/ConfirmTermsAgreementModal.js
'use client';

import { useEffect, useRef } from 'react';
import {createPortal} from 'react-dom';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';

export default function ConfirmTermsAgreementModal({ isOpen, onClose, onConfirm, loading = false }) {
    const modalRef = useRef(null);
    const confirmButtonRef = useRef(null);

    // Focus management
    useEffect(() => {
        if (isOpen && confirmButtonRef.current) {
            confirmButtonRef.current.focus();
        }
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    // Handle backdrop click
    const handleBackdropClick = (e) => {
        if (e.target === modalRef.current) {
            onClose();
        }
    };

    if (!isOpen) return null;

    const ModalContent = (
        <div
            ref={modalRef}
            className="fixed inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-sm flex items-center justify-center z-9999 p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Confirm Agreement
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-4">
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                    You're about to agree to the negotiated terms
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    By agreeing, you confirm that you accept all current offer details,
                                    deliverables, timelines, and compensation terms as negotiated.
                                </p>
                            </div>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h5 className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                                        Important Notice
                                    </h5>
                                    <p className="text-sm text-amber-700 dark:text-amber-300">
                                        Once you agree to these terms, you cannot withdraw your agreement.
                                        The negotiation will proceed to the acceptance phase where both
                                        parties must formally accept the exchange.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded p-3">
                            <strong>Next steps:</strong> After you agree, the other party will be notified.
                            Once both parties agree, you'll be able to formally accept the exchange to begin implementation.
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center justify-end gap-3">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            ref={confirmButtonRef}
                            onClick={onConfirm}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors shadow-sm"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    Yes, I Agree to Terms
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
    return createPortal(ModalContent, document.body);
}
