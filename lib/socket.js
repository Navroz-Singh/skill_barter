// lib/socket.js

'use client';

import { io } from 'socket.io-client';
import { createClient } from '@/lib/supabase/client';

class ExchangeSocketManager {
    constructor() {
        this.socket = null;
        this.currentExchangeId = null;
        this.currentUser = null;
        this.isConnected = false;
        this.connectionAttempts = 0;
        this.userRole = null; // 'initiator' or 'recipient'
        this.maxConnectionAttempts = 5;
        this.reconnectDelay = 1000;
    }

    // Get the appropriate socket URL for the environment
    getSocketUrl() {
        if (typeof window === 'undefined') {
            // Server-side rendering
            return null;
        }

        if (process.env.NODE_ENV === 'production') {
            // Production: Use the same domain as the current site
            const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
            const host = window.location.host;
            return `${protocol}//${host}`;
        } else {
            // Development: Use localhost
            return 'http://localhost:3000';
        }
    }

    // Initialize socket connection with enhanced configuration
    async connect() {
        if (this.socket?.connected) return this.socket;

        try {
            // Get current user for authentication
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('User not authenticated');
            }

            this.currentUser = user;

            const socketUrl = this.getSocketUrl();
            if (!socketUrl) {
                throw new Error('Cannot determine socket URL');
            }

            // Connect to Socket.IO server with enhanced configuration
            this.socket = io(socketUrl, {
                autoConnect: true,
                reconnection: true,
                reconnectionAttempts: this.maxConnectionAttempts,
                reconnectionDelay: this.reconnectDelay,
                reconnectionDelayMax: 5000,
                maxReconnectionAttempts: this.maxConnectionAttempts,
                timeout: 20000,
                transports: ['websocket', 'polling'],
                upgrade: true,
                rememberUpgrade: true,
                forceNew: false,
                // Production-specific configurations
                ...(process.env.NODE_ENV === 'production' && {
                    secure: true,
                    rejectUnauthorized: true
                })
            });

            // Setup event listeners
            this.setupEventListeners();

            return this.socket;

        } catch (error) {
            console.error('Socket connection failed:', error);
            this.connectionAttempts++;
            
            // Retry connection with exponential backoff
            if (this.connectionAttempts < this.maxConnectionAttempts) {
                const delay = this.reconnectDelay * Math.pow(2, this.connectionAttempts);
                console.log(`Retrying connection in ${delay}ms (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts})`);
                
                setTimeout(() => {
                    this.connect();
                }, delay);
            }
            
            throw error;
        }
    }

    // Setup socket event listeners with enhanced error handling
    setupEventListeners() {
        if (!this.socket) return;

        // Connection events
        this.socket.on('connect', () => {
            console.log('Exchange socket connected:', this.socket.id);
            this.isConnected = true;
            this.connectionAttempts = 0;

            // Rejoin current exchange if we were in one
            if (this.currentExchangeId) {
                this.joinExchangeChat(this.currentExchangeId);
            }
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Exchange socket disconnected:', reason);
            this.isConnected = false;
            
            // Handle different disconnect reasons
            if (reason === 'io server disconnect') {
                // Server initiated disconnect - try to reconnect
                setTimeout(() => {
                    if (!this.socket?.connected) {
                        this.connect();
                    }
                }, this.reconnectDelay);
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error.message || error);
            this.isConnected = false;
            this.connectionAttempts++;
            
            // Log different error types for debugging
            if (error.description) {
                console.error('Connection error details:', error.description);
            }
            if (error.context) {
                console.error('Connection error context:', error.context);
            }
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log('Socket reconnected after', attemptNumber, 'attempts');
            this.isConnected = true;
            this.connectionAttempts = 0;
            
            // Rejoin current exchange after reconnection
            if (this.currentExchangeId) {
                this.joinExchangeChat(this.currentExchangeId);
            }
        });

        this.socket.on('reconnect_attempt', (attemptNumber) => {
            console.log(`Reconnection attempt ${attemptNumber}/${this.maxConnectionAttempts}`);
        });

        this.socket.on('reconnect_error', (error) => {
            console.error('Reconnection error:', error.message || error);
        });

        this.socket.on('reconnect_failed', () => {
            console.error('Failed to reconnect after maximum attempts');
            // Could emit custom event for UI to handle
        });

        // Error handling
        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        this.socket.on('chat-error', (error) => {
            console.error('Exchange chat error:', error.message || 'Unknown chat error');
        });

        // Enhanced chat-joined event handling
        this.socket.on('chat-joined', (data) => {
            console.log('Successfully joined exchange chat:', data);
            this.userRole = data.userRole;
        });
    }

    // Join exchange chat with enhanced error handling
    joinExchangeChat(exchangeId) {
        if (!this.socket) {
            console.error('Socket not initialized');
            return false;
        }

        if (!this.socket.connected) {
            console.error('Socket not connected - attempting to connect first');
            this.connect().then(() => {
                if (this.socket?.connected) {
                    this.joinExchangeChat(exchangeId);
                }
            }).catch(error => {
                console.error('Failed to connect for joining exchange chat:', error);
            });
            return false;
        }

        if (!this.currentUser) {
            console.error('User not authenticated');
            return false;
        }

        // Leave current exchange chat if different
        if (this.currentExchangeId && this.currentExchangeId !== exchangeId) {
            this.leaveExchangeChat();
        }

        this.currentExchangeId = exchangeId;
        this.socket.emit('join-exchange-chat', {
            exchangeId,
            userSupabaseId: this.currentUser.id
        });

        console.log(`Joining exchange chat: ${exchangeId}`);
        return true;
    }

    // Leave exchange chat
    leaveExchangeChat() {
        if (!this.socket || !this.currentExchangeId) return false;

        this.socket.emit('leave-exchange-chat');
        console.log(`Left exchange chat: ${this.currentExchangeId}`);

        this.currentExchangeId = null;
        this.userRole = null;
        return true;
    }

    // Send exchange message with enhanced validation
    sendExchangeMessage(exchangeId, content, tempId = null) {
        if (!this.socket || !this.socket.connected) {
            console.error('Cannot send message: Socket not connected');
            return false;
        }

        if (!this.currentUser) {
            console.error('Cannot send message: User not authenticated');
            return false;
        }

        if (!content || !content.trim()) {
            console.error('Cannot send empty message');
            return false;
        }

        if (!exchangeId) {
            console.error('Missing exchangeId');
            return false;
        }

        this.socket.emit('send-exchange-message', {
            exchangeId,
            content: content.trim(),
            messageId: tempId // For delivery confirmation
        });

        return true;
    }

    // Enhanced offer update notification
    notifyOfferUpdate(exchangeId, offerType, newOffer) {
        if (!this.isSocketReady()) return false;

        this.socket.emit('offer-updated', {
            exchangeId,
            offerType, // 'initiator' or 'recipient'
            newOffer,
            userSupabaseId: this.currentUser.id
        });

        return true;
    }

    // Notify negotiation field update (triggers notification button)
    notifyNegotiationFieldUpdate(exchangeId, fieldName, userRole) {
        if (!this.isSocketReady()) return false;

        this.socket.emit('negotiation-field-updated', {
            exchangeId,
            fieldName,
            userRole,
            userSupabaseId: this.currentUser.id,
            timestamp: new Date().toISOString()
        });

        return true;
    }

    // Notify negotiation agreement update
    notifyNegotiationAgreement(exchangeId, agreed, userRole) {
        if (!this.isSocketReady()) return false;

        this.socket.emit('negotiation-agreement-updated', {
            exchangeId,
            agreed,
            userRole,
            userSupabaseId: this.currentUser.id,
            timestamp: new Date().toISOString()
        });

        return true;
    }

    // Notify negotiation status change
    notifyNegotiationStatusChange(exchangeId, newStatus, previousStatus) {
        if (!this.isSocketReady()) return false;

        this.socket.emit('negotiation-status-changed', {
            exchangeId,
            newStatus,
            previousStatus,
            userSupabaseId: this.currentUser.id,
            timestamp: new Date().toISOString()
        });

        return true;
    }

    // Notify status change for real-time updates
    notifyStatusChange(exchangeId, newStatus, previousStatus, acceptanceData = null) {
        if (!this.isSocketReady()) return false;

        this.socket.emit('status-changed', {
            exchangeId,
            newStatus,
            previousStatus,
            acceptanceData, // Include acceptance data
            userSupabaseId: this.currentUser.id
        });

        return true;
    }

    // Notify user acceptance for real-time updates
    notifyUserAcceptance(exchangeId, newStatus, acceptanceData, message) {
        if (!this.isSocketReady()) return false;

        this.socket.emit('user-accepted', {
            exchangeId,
            userSupabaseId: this.currentUser.id,
            newStatus,
            acceptanceData,
            message
        });

        return true;
    }

    // Typing indicators with rate limiting
    startTyping() {
        if (!this.socket || !this.socket.connected || !this.currentExchangeId) return false;
        
        // Rate limit typing events
        if (!this._lastTypingEvent || Date.now() - this._lastTypingEvent > 1000) {
            this.socket.emit('typing-start');
            this._lastTypingEvent = Date.now();
        }
        return true;
    }

    stopTyping() {
        if (!this.socket || !this.socket.connected || !this.currentExchangeId) return false;
        this.socket.emit('typing-stop');
        return true;
    }

    // Helper method to check if socket is ready for operations
    isSocketReady() {
        if (!this.socket || !this.socket.connected) {
            console.error('Cannot perform operation: Socket not connected');
            return false;
        }

        if (!this.currentUser) {
            console.error('Cannot perform operation: User not authenticated');
            return false;
        }

        return true;
    }

    // Check if connected and ready
    isReady() {
        return this.isConnected && this.socket && this.socket.connected && this.currentUser;
    }

    // Get current exchange info
    getCurrentExchange() {
        return {
            exchangeId: this.currentExchangeId,
            userRole: this.userRole
        };
    }

    // Get current user info
    getCurrentUser() {
        return this.currentUser;
    }

    // Event listeners for components with null checking

    // New exchange message received
    onNewExchangeMessage(callback) {
        if (!this.socket) return false;
        this.socket.on('new-exchange-message', callback);
        return true;
    }

    // Message delivery confirmation
    onMessageDelivered(callback) {
        if (!this.socket) return false;
        this.socket.on('message-delivered', callback);
        return true;
    }

    // Real-time offer updates (for negotiation playground)
    onOfferUpdated(callback) {
        if (!this.socket) return false;
        this.socket.on('offer-updated-realtime', callback);
        return true;
    }

    // Real-time status changes
    onStatusChanged(callback) {
        if (!this.socket) return false;
        this.socket.on('status-changed-realtime', callback);
        return true;
    }

    // Real-time user acceptance events
    onUserAcceptedExchange(callback) {
        if (!this.socket) return false;
        this.socket.on('user-accepted-exchange', callback);
        return true;
    }

    // Negotiation field updates (triggers notification button)
    onNegotiationFieldUpdated(callback) {
        if (!this.socket) return false;
        this.socket.on('negotiation-field-updated', callback);
        return true;
    }

    // Negotiation agreement updates
    onNegotiationAgreementUpdated(callback) {
        if (!this.socket) return false;
        this.socket.on('negotiation-agreement-updated', callback);
        return true;
    }

    // Negotiation status changes
    onNegotiationStatusChanged(callback) {
        if (!this.socket) return false;
        this.socket.on('negotiation-status-changed', callback);
        return true;
    }

    // User typing indicators
    onUserTyping(callback) {
        if (!this.socket) return false;
        this.socket.on('user-typing', callback);
        return true;
    }

    // Chat closed (exchange ended)
    onChatClosed(callback) {
        if (!this.socket) return false;
        this.socket.on('chat-closed', callback);
        return true;
    }

    // Chat error handling
    onChatError(callback) {
        if (!this.socket) return false;
        this.socket.on('chat-error', callback);
        return true;
    }

    // Enhanced chat joined event
    onChatJoined(callback) {
        if (!this.socket) return false;
        this.socket.on('chat-joined', callback);
        return true;
    }

    // Remove event listeners with null checking
    offNewExchangeMessage(callback) {
        if (!this.socket) return false;
        this.socket.off('new-exchange-message', callback);
        return true;
    }

    offMessageDelivered(callback) {
        if (!this.socket) return false;
        this.socket.off('message-delivered', callback);
        return true;
    }

    offOfferUpdated(callback) {
        if (!this.socket) return false;
        this.socket.off('offer-updated-realtime', callback);
        return true;
    }

    offStatusChanged(callback) {
        if (!this.socket) return false;
        this.socket.off('status-changed-realtime', callback);
        return true;
    }

    offUserAcceptedExchange(callback) {
        if (!this.socket) return false;
        this.socket.off('user-accepted-exchange', callback);
        return true;
    }

    offNegotiationFieldUpdated(callback) {
        if (!this.socket) return false;
        this.socket.off('negotiation-field-updated', callback);
        return true;
    }

    offNegotiationAgreementUpdated(callback) {
        if (!this.socket) return false;
        this.socket.off('negotiation-agreement-updated', callback);
        return true;
    }

    offNegotiationStatusChanged(callback) {
        if (!this.socket) return false;
        this.socket.off('negotiation-status-changed', callback);
        return true;
    }

    offUserTyping(callback) {
        if (!this.socket) return false;
        this.socket.off('user-typing', callback);
        return true;
    }

    offChatClosed(callback) {
        if (!this.socket) return false;
        this.socket.off('chat-closed', callback);
        return true;
    }

    offChatError(callback) {
        if (!this.socket) return false;
        this.socket.off('chat-error', callback);
        return true;
    }

    offChatJoined(callback) {
        if (!this.socket) return false;
        this.socket.off('chat-joined', callback);
        return true;
    }

    // Get enhanced connection status
    getStatus() {
        return {
            isConnected: this.isConnected,
            socketConnected: this.socket?.connected || false,
            currentExchangeId: this.currentExchangeId,
            userRole: this.userRole,
            currentUser: this.currentUser,
            socketId: this.socket?.id,
            connectionAttempts: this.connectionAttempts,
            maxConnectionAttempts: this.maxConnectionAttempts,
            isReady: this.isReady(),
            socketUrl: this.getSocketUrl(),
            transport: this.socket?.io?.engine?.transport?.name
        };
    }

    // Enhanced disconnect with cleanup
    disconnect() {
        if (this.socket) {
            // Leave current exchange chat before disconnect
            if (this.currentExchangeId) {
                this.leaveExchangeChat();
            }

            // Remove all listeners
            this.socket.removeAllListeners();
            
            // Disconnect socket
            this.socket.disconnect();
            this.socket = null;
            this.currentExchangeId = null;
            this.userRole = null;
            this.isConnected = false;
            this.connectionAttempts = 0;
            console.log('Exchange socket disconnected and cleaned up');
        }
    }

    // Force reconnection
    forceReconnect() {
        if (this.socket) {
            this.disconnect();
        }
        return this.connect();
    }
}

// Create singleton instance
const exchangeSocketManager = new ExchangeSocketManager();

export default exchangeSocketManager;

// Export hook for easy usage in components
export const useExchangeSocket = () => {
    return exchangeSocketManager;
};
