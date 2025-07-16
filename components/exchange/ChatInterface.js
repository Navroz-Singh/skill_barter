'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, AlertCircle, MessageCircle } from 'lucide-react';
import ChatMessage from './ChatMessage';
import { useExchangeChat } from '@/hooks/useExchangeChat';
import { isChatAvailable } from '@/utils/exchangeChatHelpers';

export default function ChatInterface({ exchangeId, currentUser, exchangeStatus, isUserLoading = false }) {
    // Local UI state
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);

    // Refs
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Use the custom hook for all chat logic
    const {
        messages,
        error,
        otherUserTyping,
        loading,
        sendMessage,
        startTyping,
        stopTyping,
        markAsRead,
        isConnected,
        hasError,
        clearError,
        retryConnection
    } = useExchangeChat(exchangeId, currentUser);

    // Skeleton placeholder for initial loading
    const ChatSkeleton = () => (
        <div className="space-y-4 py-4 px-2 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-300 rounded w-3/4" />
                        <div className="h-3 bg-gray-300 rounded w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    };

    // Handle send message
    const handleSendMessage = async () => {
        if (!newMessage.trim() || sending || !isConnected) return;

        setSending(true);
        const success = await sendMessage(newMessage.trim());

        if (success) {
            setNewMessage('');
            stopTyping();
        }

        setSending(false);
    };

    // Handle key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        } else {
            startTyping();
        }
    };

    // Auto-scroll when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages.length]);

    // Mark messages as read when component becomes visible
    useEffect(() => {
        if (messages.length > 0) {
            markAsRead();
        }
    }, [messages.length, markAsRead]);

    // Check if chat is available
    const chatAvailable = isChatAvailable(exchangeStatus);

    if (!chatAvailable) {
        return (
            <div className="h-full bg-white dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center p-6">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Chat Unavailable</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        Chat is not available for exchange status: {exchangeStatus}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-white dark:bg-gray-900 flex flex-col">
            {/* Messages Area - REDUCED PADDING AND SPACING */}
            <div className="flex-1 overflow-y-auto p-2">
                {loading || isUserLoading ? (
                    <ChatSkeleton />
                ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                        <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <ChatMessage
                            key={message._id}
                            message={message}
                            currentUserSupabaseId={currentUser?.supabaseId}
                        />
                    ))
                )}

                {/* Typing Indicator - REDUCED PADDING */}
                {otherUserTyping && (
                    <div className="flex items-center gap-2 px-2 py-1">
                        <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Other user is typing...</span>
                    </div>
                )}

                {/* REMOVED EXTRA MARGIN/PADDING */}
                
            </div>

            {/* Error Display - REDUCED PADDING */}
            {hasError && (
                <div className="px-2 py-1 bg-gray-100 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-600">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                        {!isConnected && (
                            <button
                                onClick={retryConnection}
                                className="ml-auto px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
                            >
                                Retry
                            </button>
                        )}
                        <button
                            onClick={clearError}
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                            ×
                        </button>
                    </div>
                    <div ref={messagesEndRef} className="h-0" /> 
                </div>
            )}

            {/* Message Input - REDUCED PADDING */}
            <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-end gap-2">
                    <div className="flex-1">
                        <textarea
                            ref={inputRef}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder={isConnected ? "Type your message..." : "Connecting..."}
                            rows={1}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 transition-all resize-none disabled:opacity-50 text-sm"
                            style={{ minHeight: '36px', maxHeight: '100px' }}
                            disabled={sending || !isConnected}
                        />
                    </div>
                    
                    
                    <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending || !isConnected}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:transform-none disabled:shadow-none"
                    >
                        {sending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
