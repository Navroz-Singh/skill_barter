// hooks/useExchangeChat.js

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useExchangeSocket } from '@/lib/socket';
import { validateMessageContent, isDuplicateMessage, generateTempMessageId } from '@/utils/exchangeChatHelpers';

export function useExchangeChat(exchangeId, currentUser) {
    // Core state
    const [messages, setMessages] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [error, setError] = useState(null);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const [loading, setLoading] = useState(false);

    // Refs for non-rendering values
    const socketManagerRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const isTypingRef = useRef(false);

    // Initialize socket manager
    if (!socketManagerRef.current) {
        socketManagerRef.current = useExchangeSocket();
    }

    // Load messages from API
    const loadMessages = useCallback(async () => {
        if (!exchangeId) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/exchanges/${exchangeId}/messages`, {cache: 'no-store'});
            const data = await response.json();

            if (data.success) {
                // Simple timestamp-based sorting
                const sortedMessages = data.messages.sort((a, b) => {
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                });
                setMessages(sortedMessages);
            } else {
                setError(data.error || 'Failed to load messages');
            }
        } catch (err) {
            console.error('Error loading messages:', err);
            setError('Failed to load messages');
        } finally {
            setLoading(false);
        }
    }, [exchangeId]);

    // Send message
    const sendMessage = useCallback(async (content) => {
        const validation = validateMessageContent(content);
        if (!validation.isValid) {
            setError(validation.error);
            return false;
        }

        const tempId = generateTempMessageId();

        // Optimistic update
        const optimisticMessage = {
            _id: tempId,
            content: validation.trimmedContent,
            type: 'user',
            sender: {
                supabaseId: currentUser.supabaseId,
                role: 'unknown'
            },
            createdAt: new Date(),
            readBy: [{ supabaseId: currentUser.supabaseId }],
            status: 'sending'
        };

        setMessages(prev => [...prev, optimisticMessage]);

        try {
            const socketSent = socketManagerRef.current?.isReady();

            if (socketSent) {
                // Prefer socket: saves on server & broadcasts, avoids double-write
                socketManagerRef.current.sendExchangeMessage(
                    exchangeId,
                    validation.trimmedContent,
                    tempId
                );

                // Success will be reflected when `message-delivered` comes back
                return true;
            }

            // Fallback to REST API when socket not connected
            const response = await fetch(`/api/exchanges/${exchangeId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: validation.trimmedContent }),
                cache: 'no-store'
            });
            const data = await response.json();

            if (data.success) {
                setMessages(prev =>
                    prev.map(msg =>
                        msg._id === tempId ? { ...data.message, status: 'sent' } : msg
                    )
                );
                return true;
            }

            throw new Error(data.error || 'Failed to send');
        } catch (error) {
            console.error('Error sending message:', error);

            // Mark message as failed
            setMessages(prev =>
                prev.map(msg =>
                    msg._id === tempId
                        ? { ...msg, status: 'failed' }
                        : msg
                )
            );

            setError('Failed to send message');
            return false;
        }
    }, [exchangeId, currentUser?.supabaseId]);

    // Typing indicators
    const startTyping = useCallback(() => {
        if (!isTypingRef.current && connectionStatus === 'connected') {
            isTypingRef.current = true;
            socketManagerRef.current.startTyping();
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            stopTyping();
        }, 3000);
    }, [connectionStatus]);

    const stopTyping = useCallback(() => {
        if (isTypingRef.current) {
            isTypingRef.current = false;
            socketManagerRef.current.stopTyping();
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
    }, []);

    // Mark messages as read
    const markAsRead = useCallback(async () => {
        try {
            await fetch(`/api/exchanges/${exchangeId}/mark-read`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }, [exchangeId]);

    // Connect to exchange chat
    const connectToExchange = useCallback(async () => {
        const socketManager = socketManagerRef.current;

        try {
            // Check if chat is available
            const statusRes = await fetch(`/api/exchanges/${exchangeId}/chat-status`);
            const statusData = await statusRes.json();

            if (!statusData.success || !statusData.chatStatus.available) {
                setError(statusData.error || statusData.chatStatus.message || 'Chat not available');
                setConnectionStatus('disconnected');
                return;
            }

            // Connect socket
            await socketManager.connect();
            socketManager.joinExchangeChat(exchangeId);

            setConnectionStatus('connected');
            setError(null);

        } catch (error) {
            console.error('Connection failed:', error);
            setConnectionStatus('disconnected');
            setError('Failed to connect to chat');
        }
    }, [exchangeId]);

    // Load messages on mount
    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    // Connect to socket on mount
    useEffect(() => {
        connectToExchange();

        return () => {
            socketManagerRef.current?.leaveExchangeChat();
        };
    }, [connectToExchange]);

    // Socket event handlers
    useEffect(() => {
        const socketManager = socketManagerRef.current;
        if (!socketManager?.isReady()) return;

        // Handle new messages from other users
        const handleNewMessage = (messageData) => {
            if (messageData.sender.supabaseId !== currentUser?.supabaseId) {
                // Simple duplicate check by ID
                if (!isDuplicateMessage(messageData, messages)) {
                    setMessages(prev => [...prev, { ...messageData, status: 'received' }]);

                    // Auto-mark as read after a short delay
                    setTimeout(markAsRead, 1000);
                }
            }
        };

        // Handle message delivery confirmation
        const handleMessageDelivered = (data) => {
            if (data.tempId) {
                setMessages(prev =>
                    prev.map(msg =>
                        msg._id === data.tempId
                            ? { ...msg, _id: data.messageId, status: 'delivered' }
                            : msg
                    )
                );
            }
        };

        // Handle typing indicators
        const handleTyping = (typingData) => {
            if (typingData.userSupabaseId !== currentUser?.supabaseId) {
                setOtherUserTyping(typingData.isTyping);
            }
        };

        // Handle chat closed
        const handleChatClosed = (data) => {
            setError(`Chat closed: ${data.reason}`);
            setConnectionStatus('disconnected');
        };

        // Handle chat errors
        const handleChatError = (error) => {
            setError(error.message || 'Chat error occurred');
            setConnectionStatus('disconnected');
        };

        // Handle connection events
        const handleDisconnect = () => {
            setConnectionStatus('disconnected');
            setError('Disconnected from chat');
        };

        const handleReconnect = () => {
            setConnectionStatus('connected');
            setError(null);
            loadMessages(); // Refresh messages on reconnect
        };

        // Attach event listeners
        socketManager.onNewExchangeMessage(handleNewMessage);
        socketManager.onMessageDelivered(handleMessageDelivered);
        socketManager.onUserTyping(handleTyping);
        socketManager.onChatClosed(handleChatClosed);
        socketManager.onChatError(handleChatError);

        socketManager.socket?.on('disconnect', handleDisconnect);
        socketManager.socket?.on('reconnect', handleReconnect);

        return () => {
            // Cleanup event listeners
            socketManager.offNewExchangeMessage(handleNewMessage);
            socketManager.offMessageDelivered(handleMessageDelivered);
            socketManager.offUserTyping(handleTyping);
            socketManager.offChatClosed(handleChatClosed);
            socketManager.offChatError(handleChatError);

            socketManager.socket?.off('disconnect', handleDisconnect);
            socketManager.socket?.off('reconnect', handleReconnect);
        };
    }, [currentUser?.supabaseId, messages, markAsRead, loadMessages]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopTyping();
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [stopTyping]);

    return {
        // State
        messages,
        connectionStatus,
        error,
        otherUserTyping,
        loading,

        // Actions
        sendMessage,
        startTyping,
        stopTyping,
        markAsRead,
        loadMessages,

        // Utils
        isConnected: connectionStatus === 'connected',
        hasError: !!error,
        clearError: () => setError(null),
        retryConnection: connectToExchange
    };
}
