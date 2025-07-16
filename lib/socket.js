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
    }

    // Initialize socket connection
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

            // Connect to Socket.IO server
            this.socket = io(process.env.NODE_ENV === 'production'
                ? process.env.NEXT_PUBLIC_SITE_URL
                : 'http://localhost:3000', {
                autoConnect: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });

            // Setup event listeners
            this.setupEventListeners();

            return this.socket;

        } catch (error) {
            console.error('Socket connection failed:', error);
            throw error;
        }
    }

    // Setup socket event listeners
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

        this.socket.on('disconnect', () => {
            console.log('Exchange socket disconnected');
            this.isConnected = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            this.isConnected = false;
            this.connectionAttempts++;
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log('Socket reconnected after', attemptNumber, 'attempts');
            this.isConnected = true;
            this.connectionAttempts = 0;
        });

        // Error handling
        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        this.socket.on('chat-error', (error) => {
            console.error('Exchange chat error:', error.message || 'Unknown chat error');
        });
    }

    // Join exchange chat
    joinExchangeChat(exchangeId) {
        if (!this.socket || !this.currentUser) {
            console.error('Socket not connected or user not authenticated');
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

    // Send exchange message
    sendExchangeMessage(exchangeId, content, tempId = null) {
        if (!this.socket || !this.currentUser) {
            console.error('Cannot send message: Socket not connected');
            return false;
        }

        if (!content.trim()) {
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

    // Notify offer update for real-time updates
    notifyOfferUpdate(exchangeId, offerType, newOffer) {
        if (!this.socket || !this.currentUser) {
            console.error('Cannot notify offer update: Socket not connected');
            return false;
        }

        this.socket.emit('offer-updated', {
            exchangeId,
            offerType, // 'initiator' or 'recipient'
            newOffer,
            userSupabaseId: this.currentUser.id
        });

        return true;
    }

    // NEW: Notify negotiation field update (triggers notification button)
    notifyNegotiationFieldUpdate(exchangeId, fieldName, userRole) {
        if (!this.socket || !this.currentUser) {
            console.error('Cannot notify negotiation update: Socket not connected');
            return false;
        }

        this.socket.emit('negotiation-field-updated', {
            exchangeId,
            fieldName,
            userRole,
            userSupabaseId: this.currentUser.id,
            timestamp: new Date().toISOString()
        });

        return true;
    }

    // NEW: Notify negotiation agreement update
    notifyNegotiationAgreement(exchangeId, agreed, userRole) {
        if (!this.socket || !this.currentUser) {
            console.error('Cannot notify agreement update: Socket not connected');
            return false;
        }

        this.socket.emit('negotiation-agreement-updated', {
            exchangeId,
            agreed,
            userRole,
            userSupabaseId: this.currentUser.id,
            timestamp: new Date().toISOString()
        });

        return true;
    }

    // NEW: Notify negotiation status change
    notifyNegotiationStatusChange(exchangeId, newStatus, previousStatus) {
        if (!this.socket || !this.currentUser) {
            console.error('Cannot notify status change: Socket not connected');
            return false;
        }

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
        if (!this.socket || !this.currentUser) {
            console.error('Cannot notify status change: Socket not connected');
            return false;
        }

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
        if (!this.socket || !this.currentUser) {
            console.error('Cannot notify user acceptance: Socket not connected');
            return false;
        }

        this.socket.emit('user-accepted', {
            exchangeId,
            userSupabaseId: this.currentUser.id,
            newStatus,
            acceptanceData,
            message
        });

        return true;
    }

    // Typing indicators
    startTyping() {
        if (!this.socket || !this.currentExchangeId) return false;
        this.socket.emit('typing-start');
        return true;
    }

    stopTyping() {
        if (!this.socket || !this.currentExchangeId) return false;
        this.socket.emit('typing-stop');
        return true;
    }

    // Check if connected and ready
    isReady() {
        return this.isConnected && this.socket && this.currentUser;
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

    // Event listeners for components

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

    // NEW: Negotiation field updates (triggers notification button)
    onNegotiationFieldUpdated(callback) {
        if (!this.socket) return false;
        this.socket.on('negotiation-field-updated', callback);
        return true;
    }

    // NEW: Negotiation agreement updates
    onNegotiationAgreementUpdated(callback) {
        if (!this.socket) return false;
        this.socket.on('negotiation-agreement-updated', callback);
        return true;
    }

    // NEW: Negotiation status changes
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

    // Remove event listeners
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

    // Remove user acceptance event listeners
    offUserAcceptedExchange(callback) {
        if (!this.socket) return false;
        this.socket.off('user-accepted-exchange', callback);
        return true;
    }

    // NEW: Remove negotiation event listeners
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

    // Get connection status
    getStatus() {
        return {
            isConnected: this.isConnected,
            currentExchangeId: this.currentExchangeId,
            userRole: this.userRole,
            currentUser: this.currentUser,
            socketId: this.socket?.id,
            connectionAttempts: this.connectionAttempts,
            isReady: this.isReady()
        };
    }

    // Disconnect socket
    disconnect() {
        if (this.socket) {
            // Leave current exchange chat before disconnect
            if (this.currentExchangeId) {
                this.leaveExchangeChat();
            }

            this.socket.disconnect();
            this.socket = null;
            this.currentExchangeId = null;
            this.userRole = null;
            this.isConnected = false;
            this.connectionAttempts = 0;
            console.log('Exchange socket disconnected manually');
        }
    }
}

// Create singleton instance
const exchangeSocketManager = new ExchangeSocketManager();

export default exchangeSocketManager;

// Export hook for easy usage in components
export const useExchangeSocket = () => {
    return exchangeSocketManager;
};
