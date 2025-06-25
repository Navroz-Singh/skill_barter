'use client';

import { useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { CheckCheck, Clock, ArrowRightLeft, AlertCircle, Bot } from 'lucide-react';

export default function ChatMessage({ message, currentUserSupabaseId }) {
    const isCurrentUser = message.sender?.supabaseId === currentUserSupabaseId;
    const isSystemMessage = message.type !== 'user';

    // useRef for formatted time to avoid recalculations on re-renders
    const formattedTimeRef = useRef(null);
    if (!formattedTimeRef.current) {
        try {
            const date = new Date(message.createdAt);
            formattedTimeRef.current = formatDistanceToNow(date, { addSuffix: true });
        } catch {
            formattedTimeRef.current = 'Just now';
        }
    }

    // Check if message is read by other user (computed value, no useState needed)
    const isReadByOther = message.readBy?.some(
        read => read.supabaseId !== currentUserSupabaseId
    );

    // System message content helper (pure function, no state needed)
    const getSystemMessageContent = () => {
        const { systemData } = message;
        switch (systemData?.event) {
            case 'offer_updated':
                return {
                    icon: <ArrowRightLeft className="w-4 h-4" />,
                    text: `${systemData.details.offerType === 'initiator' ? 'Initiator' : 'Recipient'} updated their offer`,
                    color: 'text-blue-600 dark:text-blue-400'
                };
            case 'status_changed':
                return {
                    icon: <AlertCircle className="w-4 h-4" />,
                    text: `Exchange status changed to "${systemData.details.newStatus}"`,
                    color: 'text-green-600 dark:text-green-400'
                };
            case 'exchange_created':
                return {
                    icon: <Bot className="w-4 h-4" />,
                    text: 'Exchange conversation started',
                    color: 'text-gray-600 dark:text-gray-400'
                };
            default:
                return {
                    icon: <Bot className="w-4 h-4" />,
                    text: 'System notification',
                    color: 'text-gray-600 dark:text-gray-400'
                };
        }
    };

    // Render system message
    if (isSystemMessage) {
        const systemContent = getSystemMessageContent();
        return (
            <div className="flex items-center justify-center my-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm border border-gray-200 dark:border-gray-700">
                    <div className={systemContent.color}>
                        {systemContent.icon}
                    </div>
                    <span className={`font-medium ${systemContent.color}`}>{systemContent.text}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formattedTimeRef.current}</span>
                </div>
            </div>
        );
    }

    // Render user message
    return (
        <div className={`flex items-start gap-3 group ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
            {/* User Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white transition-all duration-200 ${isCurrentUser
                    ? 'bg-blue-500 group-hover:bg-blue-600'
                    : 'bg-gray-500 group-hover:bg-gray-600'
                }`}>
                {message.sender?.role === 'initiator' ? 'I' : 'R'}
            </div>

            {/* Message Content */}
            <div className={`flex flex-col max-w-[75%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                {/* Sender Name */}
                <div className={`text-xs text-gray-500 dark:text-gray-400 mb-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                    {isCurrentUser ? 'You' : `${message.sender?.role === 'initiator' ? 'Initiator' : 'Recipient'}`}
                </div>

                {/* Message Bubble */}
                <div className={`relative px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 group-hover:shadow-md ${isCurrentUser
                        ? 'bg-blue-500 text-white rounded-br-md'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-md'
                    }`}>
                    {/* Message Text */}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {message.content}
                    </p>

                    {/* Message Meta Info */}
                    <div className={`flex items-center gap-1 mt-2 text-xs ${isCurrentUser
                            ? 'text-blue-100 justify-end'
                            : 'text-gray-500 dark:text-gray-400 justify-start'
                        }`}>
                        {/* Timestamp */}
                        <span>{formattedTimeRef.current}</span>

                        {/* Read Status (only for current user's messages) */}
                        {isCurrentUser && (
                            <div className="flex items-center gap-1 ml-2">
                                {isReadByOther ? (
                                    <CheckCheck className="w-3 h-3 text-blue-200" />
                                ) : (
                                    <Clock className="w-3 h-3 text-blue-300" />
                                )}
                                <span className="text-blue-200">
                                    {isReadByOther ? 'Read' : 'Sent'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
