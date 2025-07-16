// components/modals/ExchangeRequestModal.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRightLeft, CheckCircle, Loader2 } from 'lucide-react';

export default function ExchangeRequestModal({ 
    isOpen, 
    onClose, 
    onSubmit, 
    skillData, 
    loading = false 
}) {
    const modalRef = useRef(null);
    const [mounted, setMounted] = useState(false);
    // Auto-select skill_for_skill since it's the only option
    const [selectedType] = useState('skill_for_skill');

    // Ensure component is mounted (for SSR)
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Handle escape key and body scroll lock
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

    // Handle form submission
    const handleSubmit = () => {
        onSubmit(selectedType);
    };

    // Single exchange type configuration
    const exchangeType = {
        value: 'skill_for_skill',
        title: 'Skill Exchange',
        description: 'I\'ll teach or provide a skill in return for learning this skill',
        icon: ArrowRightLeft,
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-700',
        selectedBorderColor: 'border-blue-500 dark:border-blue-400',
        iconColor: 'text-blue-600 dark:text-blue-400'
    };

    if (!mounted || !isOpen) return null;

    const modalContent = (
        <div
            ref={modalRef}
            className="fixed inset-0 bg-white/10 dark:bg-black/20 backdrop-blur-md flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            onClick={handleBackdropClick}
        >
            <div 
                className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/30 dark:border-gray-700/50 max-w-lg w-full mx-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200/30 dark:border-gray-700/30 bg-gradient-to-r from-white/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-700/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Request Skill Exchange
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Start a skill exchange for &quot;{skillData?.title}&quot;
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1.5 rounded-lg hover:bg-gray-100/60 dark:hover:bg-gray-700/60"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-6">
                    <div className="space-y-4">
                        {/* Exchange Type Display */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Exchange Type:
                            </h4>
                            
                            <div className={`w-full p-4 rounded-xl border-2 ${exchangeType.selectedBorderColor} ${exchangeType.bgColor} shadow-md`}>
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl ${exchangeType.bgColor} border ${exchangeType.borderColor} flex items-center justify-center flex-shrink-0`}>
                                        <ArrowRightLeft className={`w-6 h-6 ${exchangeType.iconColor}`} />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h5 className="font-medium text-gray-900 dark:text-white">
                                                {exchangeType.title}
                                            </h5>
                                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            {exchangeType.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Information Section */}
                        <div className="p-4 bg-gray-50/80 dark:bg-gray-700/40 rounded-lg border border-gray-200/60 dark:border-gray-600/60">
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                What happens next:
                            </h5>
                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                <li>• You&apos;ll specify what skill you can offer in return</li>
                                <li>• Both parties can negotiate the exchange details</li>
                                <li>• Once agreed, you can start the skill exchange</li>
                            </ul>
                        </div>

                        {/* Skill Information */}
                        {skillData && (
                            <div className="p-4 bg-blue-50/60 dark:bg-blue-900/20 rounded-lg border border-blue-200/60 dark:border-blue-700/60">
                                <h5 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                                    You&apos;re requesting:
                                </h5>
                                <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                                    {skillData.title}
                                </p>
                                {skillData.category && (
                                    <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                                        Category: {skillData.category}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-t border-gray-200/30 dark:border-gray-700/30 bg-gradient-to-r from-gray-50/80 to-white/80 dark:from-gray-700/40 dark:to-gray-800/40">
                    <div className="flex items-center justify-end gap-3">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/90 dark:bg-gray-600/90 border border-gray-300/60 dark:border-gray-500/60 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-lg transition-colors shadow-lg disabled:shadow-none"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating Exchange...
                                </>
                            ) : (
                                <>
                                    <ArrowRightLeft className="w-4 h-4" />
                                    Start Skill Exchange
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
