'use client';

import { useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { CheckCheck, Clock } from 'lucide-react';

export default function ChatMessage({ message, currentUserSupabaseId }) {
    const isCurrentUser = message.sender?.supabaseId === currentUserSupabaseId;

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

    // Render user message (system messages no longer exist in our simplified system)
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
