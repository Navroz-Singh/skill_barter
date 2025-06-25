'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Users, Clock, AlertTriangle } from 'lucide-react';
import ChatInterface from './ChatInterface';
import { useUser } from '@/hooks/use-user';
import {
    isChatAvailable,
    getExchangeStatusInfo,
    validateChatAccess,
    getExchangeTimeline
} from '@/utils/exchangeChatHelpers';

export default function ExchangeWithChat({ exchangeId, exchangeData = null }) {
    // Core state (minimal useState)
    const [exchange, setExchange] = useState(exchangeData);
    const [loading, setLoading] = useState(!exchangeData);
    const [error, setError] = useState(null);
    const [showChat, setShowChat] = useState(false);

    // Refs for non-rendering values
    const chatAccessRef = useRef(null);
    const timelineRef = useRef(null);
    const statusInfoRef = useRef(null);

    // User data
    const { user } = useUser();

    // Fetch exchange data if not provided
    const fetchExchangeData = async () => {
        if (exchangeData) return; // Skip if data already provided

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/exchanges/${exchangeId}`);
            const data = await response.json();

            if (data.success) {
                setExchange(data.exchange);
            } else {
                setError(data.error || 'Failed to load exchange');
            }
        } catch (err) {
            console.error('Error fetching exchange:', err);
            setError('Failed to load exchange data');
        } finally {
            setLoading(false);
        }
    };

    // Calculate derived values (cached in refs)
    useEffect(() => {
        if (exchange && user) {
            // Validate chat access
            chatAccessRef.current = validateChatAccess(exchange, user.id);

            // Get timeline info
            timelineRef.current = getExchangeTimeline(exchange);

            // Get status info
            statusInfoRef.current = getExchangeStatusInfo(exchange.status);
        }
    }, [exchange, user]);

    // Load data on mount
    useEffect(() => {
        fetchExchangeData();
    }, [exchangeId]);

    // Loading state
    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !exchange) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Unable to Load Exchange
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                    <button
                        onClick={fetchExchangeData}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Get cached values
    const chatAccess = chatAccessRef.current;
    const timeline = timelineRef.current;
    const statusInfo = statusInfoRef.current;

    return (
        <div className="space-y-6">
            {/* Exchange Status Header */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${isChatAvailable(exchange.status) ? 'bg-green-500' : 'bg-gray-400'
                            }`}></div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Exchange Communication
                        </h2>
                    </div>

                    {timeline?.daysRemaining && (
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${timeline.isExpiringSoon
                                ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}>
                            <Clock className="w-4 h-4" />
                            <span>{timeline.daysRemaining} days remaining</span>
                        </div>
                    )}
                </div>

                {/* Status Message */}
                {statusInfo && (
                    <div className={`p-4 rounded-lg border ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
                        <p className={`text-sm font-medium ${statusInfo.color}`}>
                            {statusInfo.message}
                        </p>
                    </div>
                )}

                {/* Participants Info */}
                <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            You are the {chatAccess?.userRole || 'participant'}
                        </span>
                    </div>

                    {isChatAvailable(exchange.status) && (
                        <button
                            onClick={() => setShowChat(!showChat)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                        >
                            <MessageCircle className="w-4 h-4" />
                            {showChat ? 'Hide Chat' : 'Open Chat'}
                        </button>
                    )}
                </div>
            </div>

            {/* Chat Interface */}
            {showChat && chatAccess?.canAccess && (
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="border-b border-gray-200 dark:border-gray-700 p-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Exchange Chat
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Communicate with the other party about this exchange
                        </p>
                    </div>

                    <div className="p-4">
                        <ChatInterface
                            exchangeId={exchangeId}
                            currentUser={user}
                            exchangeStatus={exchange.status}
                        />
                    </div>
                </div>
            )}

            {/* Chat Unavailable Message */}
            {showChat && !chatAccess?.canAccess && (
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="text-center">
                        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Chat Unavailable
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            {chatAccess?.reason || 'Chat is not available for this exchange'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
