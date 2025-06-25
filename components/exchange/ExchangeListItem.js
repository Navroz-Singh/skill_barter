'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { MessageCircle, Clock, User, ArrowRight } from 'lucide-react';
import {
    isChatAvailable,
    getExchangeStatusInfo,
    formatMessageTimestamp,
    getUnreadMessageCount
} from '@/utils/exchangeChatHelpers';

export default function ExchangeListItem({ exchange, currentUser, unreadCount = 0 }) {
    // Cache computed values in refs to avoid recalculation
    const statusInfoRef = useRef(getExchangeStatusInfo(exchange.status));
    const chatAvailableRef = useRef(isChatAvailable(exchange.status));
    const userRoleRef = useRef(
        exchange.initiator.supabaseId === currentUser?.id ? 'initiator' : 'recipient'
    );
    const otherParticipantRef = useRef(
        userRoleRef.current === 'initiator' ? exchange.recipient : exchange.initiator
    );

    return (
        <Link
            href={`/exchange/${exchange._id}`}
            className="block bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 hover:shadow-md"
        >
            <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`w-3 h-3 rounded-full ${chatAvailableRef.current ? 'bg-green-500' : 'bg-gray-400'
                                }`}></div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Exchange #{exchange.exchangeId}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfoRef.current.bgColor} ${statusInfoRef.current.color}`}>
                                {exchange.status}
                            </span>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {exchange.exchangeType.replace('_', ' for ')}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Unread Message Badge */}
                        {unreadCount > 0 && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                                <MessageCircle className="w-3 h-3" />
                                <span>{unreadCount}</span>
                            </div>
                        )}

                        <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                </div>

                {/* Participants */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                You ({userRoleRef.current})
                            </span>
                        </div>
                        <span className="text-gray-400">↔</span>
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {otherParticipantRef.current.userId?.name || 'Other Party'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Status Message */}
                <div className={`p-3 rounded-lg ${statusInfoRef.current.bgColor} border ${statusInfoRef.current.borderColor}`}>
                    <p className={`text-sm ${statusInfoRef.current.color}`}>
                        {statusInfoRef.current.message}
                    </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>Updated {formatMessageTimestamp(exchange.updatedAt, false)}</span>
                    </div>

                    {chatAvailableRef.current && (
                        <div className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
                            <MessageCircle className="w-4 h-4" />
                            <span>Chat Available</span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
