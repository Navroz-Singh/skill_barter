'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, AlertCircle, MessageCircle, Wifi, WifiOff } from 'lucide-react';
import ChatMessage from './ChatMessage';
import { useExchangeChat } from '@/hooks/useExchangeChat';
import { isChatAvailable } from '@/utils/exchangeChatHelpers';

export default function ChatInterface({ exchangeId, currentUser, exchangeStatus }) {
    // Local UI state
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);

    // Refs
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Use the custom hook for all chat logic
    const {
        messages,
        connectionStatus,
        error,
        otherUserTyping,
        sendMessage,
        startTyping,
        stopTyping,
        markAsRead,
        isConnected,
        hasError,
        clearError
    } = useExchangeChat(exchangeId, currentUser);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
            <div className="h-96 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
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
        <div className="h-96 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Chat Header with Connection Status */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Exchange Chat</h3>
                    {isConnected ? (
                        <Wifi className="w-4 h-4 text-green-500" />
                    ) : (
                        <WifiOff className="w-4 h-4 text-red-500" />
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {messages.length} messages
                    </span>
                    <div className={`px-2 py-1 rounded text-xs ${isConnected
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                        }`}>
                        {connectionStatus}
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {messages.length === 0 ? (
                    <div className="text-center py-8">
                        <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <ChatMessage
                            key={message._id}
                            message={message}
                            currentUserSupabaseId={currentUser.id}
                        />
                    ))
                )}

                {/* Typing Indicator */}
                {otherUserTyping && (
                    <div className="flex items-center gap-2 px-4 py-2">
                        <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Other user is typing...</span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Error Display */}
            {hasError && (
                <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                        <button
                            onClick={clearError}
                            className="ml-auto text-red-500 hover:text-red-700 dark:hover:text-red-300"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-end gap-3">
                    <div className="flex-1">
                        <textarea
                            ref={inputRef}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder={isConnected ? "Type your message..." : "Connecting..."}
                            rows={1}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none disabled:opacity-50"
                            style={{ minHeight: '44px', maxHeight: '120px' }}
                            disabled={sending || !isConnected}
                        />
                    </div>
                    <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending || !isConnected}
                        className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:transform-none disabled:shadow-none"
                    >
                        {sending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
