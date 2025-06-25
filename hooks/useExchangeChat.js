'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useExchangeSocket } from '@/lib/socket';
import { validateMessageContent } from '@/utils/exchangeChatHelpers';

export function useExchangeChat(exchangeId, currentUser) {
    // Core state (minimal useState)
    const [messages, setMessages] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [error, setError] = useState(null);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const [connectionQuality, setConnectionQuality] = useState('good');

    // NEW Step 10: Synchronization state
    const [isSyncing, setIsSyncing] = useState(false);

    // Refs for non-rendering values
    const socketManagerRef = useRef(null);
    const messageQueueRef = useRef([]);
    const reconnectTimeoutRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const isTypingRef = useRef(false);
    const lastMessageIdRef = useRef(null);

    // Retry management
    const retryCountRef = useRef(0);
    const maxRetriesRef = useRef(5);
    const heartbeatIntervalRef = useRef(null);
    const lastHeartbeatRef = useRef(Date.now());

    // NEW Step 10: Message ordering and conflict resolution
    const messageSequenceRef = useRef(0);
    const lastServerSequenceRef = useRef(0);
    const pendingMessagesRef = useRef(new Map()); // tempId -> message
    const messageHistoryRef = useRef(new Set()); // Track all message IDs
    const lastSyncTimestampRef = useRef(null);

    // Initialize socket manager
    if (!socketManagerRef.current) {
        socketManagerRef.current = useExchangeSocket();
    }

    // NEW Step 10: Enhanced message ordering utility
    const sortMessagesByOrder = useCallback((messages) => {
        return messages.sort((a, b) => {
            // First sort by server sequence if available
            if (a.sequence && b.sequence) {
                return a.sequence - b.sequence;
            }
            // Fallback to timestamp
            const timeA = new Date(a.createdAt).getTime();
            const timeB = new Date(b.createdAt).getTime();
            return timeA - timeB;
        });
    }, []);

    // NEW Step 10: Enhanced duplicate detection
    const isDuplicateMessage = useCallback((newMessage) => {
        // Check by message ID
        if (messageHistoryRef.current.has(newMessage._id)) {
            return true;
        }

        // Check by content and timestamp for potential duplicates
        const timeWindow = 5000; // 5 seconds
        const newTime = new Date(newMessage.createdAt).getTime();

        return messages.some(existing =>
            existing.sender?.supabaseId === newMessage.sender?.supabaseId &&
            existing.content === newMessage.content &&
            Math.abs(new Date(existing.createdAt).getTime() - newTime) < timeWindow
        );
    }, [messages]);

    // NEW Step 10: Message reconciliation after reconnection
    const reconcileMessages = useCallback(async (serverMessages) => {
        setIsSyncing(true);

        try {
            // Create a map of server messages by ID
            const serverMap = new Map(serverMessages.map(msg => [msg._id, msg]));

            // Get current local messages
            const localMessages = [...messages];

            // Find messages that exist locally but not on server (failed sends)
            const localOnlyMessages = localMessages.filter(local =>
                local._id.startsWith('temp-') && !serverMap.has(local._id)
            );

            // Find messages that exist on server but not locally (missed while offline)
            const serverOnlyMessages = serverMessages.filter(server =>
                !messageHistoryRef.current.has(server._id)
            );

            // Merge and sort all messages
            const reconciledMessages = [
                ...localMessages.filter(msg =>
                    !msg._id.startsWith('temp-') || serverMap.has(msg._id)
                ),
                ...serverOnlyMessages
            ];

            // Sort by sequence/timestamp
            const sortedMessages = sortMessagesByOrder(reconciledMessages);

            // Update message history tracking
            sortedMessages.forEach(msg => {
                if (msg._id && !msg._id.startsWith('temp-')) {
                    messageHistoryRef.current.add(msg._id);
                }
            });

            // Update sequence tracking
            const lastMessage = sortedMessages[sortedMessages.length - 1];
            if (lastMessage?.sequence) {
                lastServerSequenceRef.current = lastMessage.sequence;
            }

            setMessages(sortedMessages);

            // Re-queue failed local messages
            localOnlyMessages.forEach(msg => {
                if (msg.status === 'failed' || msg.status === 'sending') {
                    messageQueueRef.current.push({
                        content: msg.content,
                        tempId: msg._id,
                        priority: 'high' // High priority for failed messages
                    });
                }
            });

            return true;
        } catch (error) {
            console.error('Error reconciling messages:', error);
            return false;
        } finally {
            setIsSyncing(false);
        }
    }, [messages, sortMessagesByOrder]);

    // Enhanced message synchronization with reconciliation
    const syncMessages = useCallback(async () => {
        try {
            const url = lastSyncTimestampRef.current
                ? `/api/exchanges/${exchangeId}/messages?since=${lastSyncTimestampRef.current}`
                : `/api/exchanges/${exchangeId}/messages`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                await reconcileMessages(data.messages);
                lastMessageIdRef.current = data.messages[data.messages.length - 1]?._id;
                lastSyncTimestampRef.current = new Date().toISOString();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error syncing messages:', error);
            return false;
        }
    }, [exchangeId, reconcileMessages]);

    // Simple heartbeat monitoring
    const startHeartbeat = useCallback(() => {
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
        }

        heartbeatIntervalRef.current = setInterval(() => {
            const now = Date.now();
            const timeSinceLastBeat = now - lastHeartbeatRef.current;

            if (timeSinceLastBeat > 10000) {
                setConnectionQuality('poor');
            } else if (timeSinceLastBeat > 5000) {
                setConnectionQuality('fair');
            } else {
                setConnectionQuality('good');
            }

            if (socketManagerRef.current?.isConnected) {
                socketManagerRef.current.socket?.emit('heartbeat');
            }
        }, 3000);
    }, []);

    const stopHeartbeat = useCallback(() => {
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
        }
    }, []);

    // Enhanced retry logic with exponential backoff
    const getRetryDelay = useCallback(() => {
        const baseDelay = 1000;
        const maxDelay = 30000;
        const delay = Math.min(baseDelay * Math.pow(2, retryCountRef.current), maxDelay);
        return delay;
    }, []);

    // Message delivery confirmation
    const confirmMessageDelivery = useCallback((messageId, tempId) => {
        setMessages(prev =>
            prev.map(msg => {
                if (msg._id === messageId || msg._id === tempId) {
                    // Remove from pending tracking
                    if (tempId) {
                        pendingMessagesRef.current.delete(tempId);
                    }
                    // Add to message history
                    messageHistoryRef.current.add(messageId);
                    return { ...msg, _id: messageId, status: 'delivered' };
                }
                return msg;
            })
        );
    }, []);

    // NEW Step 10: Enhanced queue processing with priorities
    const processMessageQueue = useCallback(async () => {
        const queue = [...messageQueueRef.current];
        messageQueueRef.current = [];

        // Sort queue by priority (high priority first)
        queue.sort((a, b) => {
            const priorityOrder = { high: 0, normal: 1, low: 2 };
            return priorityOrder[a.priority || 'normal'] - priorityOrder[b.priority || 'normal'];
        });

        for (const messageData of queue) {
            try {
                await sendMessage(messageData.content);
                // Small delay between messages to avoid overwhelming server
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error('Error processing queued message:', error);
                // Re-queue failed message with lower priority
                messageQueueRef.current.push({
                    ...messageData,
                    priority: 'low',
                    retryCount: (messageData.retryCount || 0) + 1
                });
            }
        }
    }, []);

    // Enhanced send message with sequence tracking
    const sendMessage = useCallback(async (content) => {
        const validation = validateMessageContent(content);
        if (!validation.isValid) {
            setError(validation.error);
            return false;
        }

        // Generate sequence number for ordering
        messageSequenceRef.current += 1;
        const clientSequence = messageSequenceRef.current;

        const messageData = {
            content: validation.trimmedContent,
            timestamp: new Date().toISOString(),
            tempId: `temp-${Date.now()}-${clientSequence}`,
            clientSequence
        };

        // Optimistic update with sequence
        const optimisticMessage = {
            _id: messageData.tempId,
            content: messageData.content,
            type: 'user',
            sender: {
                supabaseId: currentUser.id,
                role: 'unknown'
            },
            createdAt: new Date(),
            readBy: [{ supabaseId: currentUser.id }],
            status: 'sending',
            clientSequence,
            sequence: null // Will be set by server
        };

        setMessages(prev => {
            const updated = [...prev, optimisticMessage];
            return sortMessagesByOrder(updated);
        });

        // Track pending message
        pendingMessagesRef.current.set(messageData.tempId, optimisticMessage);

        try {
            const response = await fetch(`/api/exchanges/${exchangeId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: messageData.content,
                    clientSequence
                })
            });

            const data = await response.json();

            if (data.success) {
                // Update sequence tracking
                if (data.message.sequence) {
                    lastServerSequenceRef.current = Math.max(
                        lastServerSequenceRef.current,
                        data.message.sequence
                    );
                }

                // Replace optimistic message with real message
                setMessages(prev => {
                    const updated = prev.map(msg =>
                        msg._id === messageData.tempId
                            ? { ...data.message, status: 'sent' }
                            : msg
                    );
                    return sortMessagesByOrder(updated);
                });

                // Track message ID
                messageHistoryRef.current.add(data.message._id);

                // Send via socket for real-time
                if (socketManagerRef.current?.isConnected) {
                    socketManagerRef.current.sendExchangeMessage(
                        exchangeId,
                        messageData.content,
                        data.message._id,
                        data.message.sequence
                    );
                }
                return true;
            } else {
                throw new Error(data.error);
            }

        } catch (error) {
            console.error('Error sending message:', error);

            // Mark message as failed
            setMessages(prev =>
                prev.map(msg =>
                    msg._id === messageData.tempId
                        ? { ...msg, status: 'failed' }
                        : msg
                )
            );

            // Queue for retry if connection issue
            if (connectionStatus !== 'connected') {
                messageQueueRef.current.push({
                    ...messageData,
                    priority: 'high'
                });
            }

            setError('Failed to send message. Will retry when connected.');
            return false;
        }
    }, [exchangeId, currentUser.id, connectionStatus, sortMessagesByOrder]);

    // Handle typing indicators
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

    // Enhanced connection management with retry logic
    const connectToExchange = useCallback(async () => {
        const socketManager = socketManagerRef.current;

        try {
            await socketManager.connect();
            socketManager.joinExchangeChat(exchangeId);
            setConnectionStatus('connected');
            setConnectionQuality('good');
            setError(null);

            retryCountRef.current = 0;
            startHeartbeat();

            // Sync messages first, then process queue
            await syncMessages();
            await processMessageQueue();

        } catch (error) {
            console.error('Socket connection failed:', error);
            setConnectionStatus('disconnected');
            setConnectionQuality('offline');

            if (retryCountRef.current < maxRetriesRef.current) {
                const delay = getRetryDelay();
                retryCountRef.current++;

                setError(`Connection failed. Retrying in ${Math.ceil(delay / 1000)}s... (${retryCountRef.current}/${maxRetriesRef.current})`);

                reconnectTimeoutRef.current = setTimeout(() => {
                    connectToExchange();
                }, delay);
            } else {
                setError('Connection failed. Please refresh the page to try again.');
            }
        }
    }, [exchangeId, syncMessages, processMessageQueue, startHeartbeat, getRetryDelay]);

    // Socket connection management
    useEffect(() => {
        connectToExchange();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            stopHeartbeat();
            socketManagerRef.current?.leaveExchangeChat();
        };
    }, [connectToExchange, stopHeartbeat]);

    // Enhanced socket event handlers
    useEffect(() => {
        const socketManager = socketManagerRef.current;
        if (!socketManager?.isReady()) return;

        // NEW Step 10: Enhanced message handling with conflict resolution
        const handleNewMessage = (messageData) => {
            if (messageData.sender.supabaseId !== currentUser.id) {
                // Check for duplicates
                if (isDuplicateMessage(messageData)) {
                    return;
                }

                setMessages(prev => {
                    const updated = [...prev, { ...messageData, status: 'received' }];
                    return sortMessagesByOrder(updated);
                });

                // Track message and update sequence
                messageHistoryRef.current.add(messageData._id);
                if (messageData.sequence) {
                    lastServerSequenceRef.current = Math.max(
                        lastServerSequenceRef.current,
                        messageData.sequence
                    );
                }

                setTimeout(markAsRead, 1000);
            }
        };

        // Handle system messages
        const handleSystemMessage = (systemData) => {
            if (!isDuplicateMessage(systemData)) {
                setMessages(prev => {
                    const updated = [...prev, { ...systemData, status: 'system' }];
                    return sortMessagesByOrder(updated);
                });
                messageHistoryRef.current.add(systemData._id);
            }
        };

        // Handle typing indicators
        const handleTyping = (typingData) => {
            if (typingData.userSupabaseId !== currentUser.id) {
                setOtherUserTyping(typingData.isTyping);
            }
        };

        // Enhanced message delivery confirmation
        const handleMessageDelivered = (data) => {
            confirmMessageDelivery(data.messageId, data.tempId);
        };

        // Handle heartbeat responses
        const handleHeartbeatResponse = () => {
            lastHeartbeatRef.current = Date.now();
            setConnectionQuality('good');
        };

        // Enhanced connection status handlers
        const handleDisconnect = () => {
            setConnectionStatus('disconnected');
            setConnectionQuality('offline');
            setError('Disconnected. Attempting to reconnect...');
            stopHeartbeat();

            setTimeout(() => {
                connectToExchange();
            }, 2000);
        };

        const handleReconnect = () => {
            setConnectionStatus('connected');
            setConnectionQuality('good');
            setError(null);
            retryCountRef.current = 0;
            startHeartbeat();
            syncMessages(); // Sync with reconciliation
        };

        // Attach event listeners
        socketManager.onNewExchangeMessage(handleNewMessage);
        socketManager.onOfferSystemMessage(handleSystemMessage);
        socketManager.onStatusSystemMessage(handleSystemMessage);
        socketManager.onUserTyping(handleTyping);
        socketManager.onChatClosed(() => setError('Chat has been closed'));

        socketManager.socket?.on('message-delivered', handleMessageDelivered);
        socketManager.socket?.on('heartbeat-response', handleHeartbeatResponse);
        socketManager.socket?.on('disconnect', handleDisconnect);
        socketManager.socket?.on('reconnect', handleReconnect);

        return () => {
            socketManager.offNewExchangeMessage(handleNewMessage);
            socketManager.offOfferSystemMessage(handleSystemMessage);
            socketManager.offStatusSystemMessage(handleSystemMessage);
            socketManager.offUserTyping(handleTyping);
            socketManager.socket?.off('message-delivered', handleMessageDelivered);
            socketManager.socket?.off('heartbeat-response', handleHeartbeatResponse);
            socketManager.socket?.off('disconnect', handleDisconnect);
            socketManager.socket?.off('reconnect', handleReconnect);
        };
    }, [currentUser.id, syncMessages, markAsRead, confirmMessageDelivery, connectToExchange, startHeartbeat, stopHeartbeat, isDuplicateMessage, sortMessagesByOrder]);

    // Initial message sync
    useEffect(() => {
        syncMessages();
    }, [syncMessages]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopTyping();
            stopHeartbeat();
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [stopTyping, stopHeartbeat]);

    return {
        // State
        messages,
        connectionStatus,
        connectionQuality,
        error,
        otherUserTyping,
        isSyncing, // NEW

        // Actions
        sendMessage,
        startTyping,
        stopTyping,
        markAsRead,
        syncMessages,

        // Utils
        isConnected: connectionStatus === 'connected',
        hasError: !!error,
        clearError: () => setError(null),
        retryConnection: connectToExchange
    };
}
