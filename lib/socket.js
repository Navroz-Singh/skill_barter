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

        this.socket.on('reconnect_error', (error) => {
            console.error('Socket reconnection failed:', error);
            this.connectionAttempts++;
        });

        // Error handling
        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        // Exchange-specific error handling
        this.socket.on('chat-error', (error) => {
            console.error('Exchange chat error:', error);
        });
    }

    // Join exchange chat
    joinExchangeChat(exchangeId) {
        if (!this.socket || !this.currentUser) {
            console.error('Socket not connected or user not authenticated');
            return false;
        }

        // Leave current exchange chat if exists
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
    sendExchangeMessage(exchangeId, content) {
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
            content: content.trim()
        });

        return true;
    }

    // Notify offer update (creates system message)
    notifyOfferUpdate(exchangeId, offerType, newOffer) {
        if (!this.socket || !this.currentUser) {
            console.error('Cannot notify offer update: Socket not connected');
            return false;
        }

        this.socket.emit('offer-updated', {
            exchangeId,
            offerType, // 'initiator' or 'recipient'
            newOffer
        });

        return true;
    }

    // Notify status change (creates system message)
    notifyStatusChange(exchangeId, newStatus, previousStatus) {
        if (!this.socket || !this.currentUser) {
            console.error('Cannot notify status change: Socket not connected');
            return false;
        }

        this.socket.emit('status-changed', {
            exchangeId,
            newStatus,
            previousStatus
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

    // Event listeners for components to use

    // New exchange message received
    onNewExchangeMessage(callback) {
        if (!this.socket) return false;
        this.socket.on('new-exchange-message', callback);
        return true;
    }

    // Offer system message (offer updates)
    onOfferSystemMessage(callback) {
        if (!this.socket) return false;
        this.socket.on('offer-system-message', callback);
        return true;
    }

    // Status system message (status changes)
    onStatusSystemMessage(callback) {
        if (!this.socket) return false;
        this.socket.on('status-system-message', callback);
        return true;
    }

    // User typing indicators
    onUserTyping(callback) {
        if (!this.socket) return false;
        this.socket.on('user-typing', callback);
        return true;
    }

    // User joined exchange chat
    onUserJoinedExchange(callback) {
        if (!this.socket) return false;
        this.socket.on('user-joined-exchange', callback);
        return true;
    }

    // User left exchange chat
    onUserLeftExchange(callback) {
        if (!this.socket) return false;
        this.socket.on('user-left-exchange', callback);
        return true;
    }

    // Chat closed (exchange ended)
    onChatClosed(callback) {
        if (!this.socket) return false;
        this.socket.on('chat-closed', callback);
        return true;
    }

    // User disconnected
    onUserDisconnected(callback) {
        if (!this.socket) return false;
        this.socket.on('user-disconnected', callback);
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

    offOfferSystemMessage(callback) {
        if (!this.socket) return false;
        this.socket.off('offer-system-message', callback);
        return true;
    }

    offStatusSystemMessage(callback) {
        if (!this.socket) return false;
        this.socket.off('status-system-message', callback);
        return true;
    }

    offUserTyping(callback) {
        if (!this.socket) return false;
        this.socket.off('user-typing', callback);
        return true;
    }

    offUserJoinedExchange(callback) {
        if (!this.socket) return false;
        this.socket.off('user-joined-exchange', callback);
        return true;
    }

    offUserLeftExchange(callback) {
        if (!this.socket) return false;
        this.socket.off('user-left-exchange', callback);
        return true;
    }

    offChatClosed(callback) {
        if (!this.socket) return false;
        this.socket.off('chat-closed', callback);
        return true;
    }

    offUserDisconnected(callback) {
        if (!this.socket) return false;
        this.socket.off('user-disconnected', callback);
        return true;
    }

    offChatError(callback) {
        if (!this.socket) return false;
        this.socket.off('chat-error', callback);
        return true;
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
}

// Create singleton instance
const exchangeSocketManager = new ExchangeSocketManager();

export default exchangeSocketManager;

// Export hook for easy usage in components
export const useExchangeSocket = () => {
    return exchangeSocketManager;
};
