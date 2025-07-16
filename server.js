// server.js

import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';
import connectDB from './lib/mongodb.js';
import Message from './models/Message.js';
import Exchange from './models/Exchange.js';
import User from './models/User.js';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

// Prepare the Next.js app
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
    // Create HTTP server
    const httpServer = createServer(handler);

    // Create Socket.IO server
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.NODE_ENV === 'production'
                ? process.env.NEXT_PUBLIC_SITE_URL
                : "http://localhost:3000",
            methods: ["GET", "POST"]
        }
    });

    // Socket.IO connection handling
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Join exchange room (single room for chat + negotiation)
        socket.on('join-exchange-chat', async (data) => {
            const { exchangeId, userSupabaseId } = data;

            try {
                await connectDB();

                // Find exchange and validate participant
                const exchange = await Exchange.findById(exchangeId);
                if (!exchange) {
                    socket.emit('chat-error', { message: 'Exchange not found' });
                    return;
                }

                const isParticipant =
                    exchange.initiator.supabaseId === userSupabaseId ||
                    exchange.recipient.supabaseId === userSupabaseId;

                if (!isParticipant) {
                    socket.emit('chat-error', { message: 'Not authorized for this exchange' });
                    return;
                }

                // UPDATED: Check if chat is available for current status (includes pending_acceptance)
                const chatAvailableStatuses = ['negotiating', 'pending_acceptance', 'accepted', 'in_progress'];
                if (!chatAvailableStatuses.includes(exchange.status)) {
                    socket.emit('chat-error', {
                        message: `Chat not available. Exchange status: ${exchange.status}`
                    });
                    return;
                }

                // Leave any previous rooms
                socket.rooms.forEach(room => {
                    if (room !== socket.id) {
                        socket.leave(room);
                    }
                });

                // Join single room for both chat and negotiation
                const roomName = `exchange-${exchangeId}`;
                socket.join(roomName);

                // Store user data on socket
                socket.userSupabaseId = userSupabaseId;
                socket.currentExchangeId = exchangeId;
                socket.currentRoom = roomName;
                socket.userRole = exchange.initiator.supabaseId === userSupabaseId ? 'initiator' : 'recipient';

                console.log(`User ${userSupabaseId} (${socket.userRole}) joined exchange ${exchangeId}`);

            } catch (error) {
                console.error('Error joining exchange chat:', error);
                socket.emit('chat-error', { message: 'Failed to join exchange chat' });
            }
        });

        // Send chat message (simple timestamp-based ordering)
        socket.on('send-exchange-message', async (messageData) => {
            const { exchangeId, content, messageId } = messageData;

            if (!exchangeId || !content || !socket.userSupabaseId) {
                socket.emit('chat-error', { message: 'Invalid message data' });
                return;
            }

            try {
                await connectDB();

                // UPDATED: Verify exchange is still available for chat (includes pending_acceptance)
                const exchange = await Exchange.findById(exchangeId);
                if (!exchange || !['negotiating', 'pending_acceptance', 'accepted', 'in_progress'].includes(exchange.status)) {
                    socket.emit('chat-error', { message: 'Chat no longer available for this exchange' });
                    return;
                }

                // Find user
                const user = await User.findOne({ supabaseId: socket.userSupabaseId }).select('_id');
                if (!user) {
                    socket.emit('chat-error', { message: 'User not found' });
                    return;
                }

                // Create and save message (no sequence - just timestamp ordering)
                const newMessage = new Message({
                    exchangeId,
                    content: content.trim(),
                    sender: {
                        userId: user._id,
                        supabaseId: socket.userSupabaseId,
                        role: socket.userRole
                    },
                    type: 'user'
                });

                const savedMessage = await newMessage.save();

                // Broadcast message to all users in room
                const messagePayload = {
                    _id: savedMessage._id,
                    messageId: savedMessage._id,
                    content: savedMessage.content,
                    sender: savedMessage.sender,
                    timestamp: savedMessage.createdAt,
                    createdAt: savedMessage.createdAt,
                    type: savedMessage.type,
                    readBy: savedMessage.readBy || []
                };

                io.to(socket.currentRoom).emit('new-exchange-message', messagePayload);

                // Send delivery confirmation to sender
                if (messageId) {
                    socket.emit('message-delivered', {
                        messageId: savedMessage._id,
                        tempId: messageId,
                        timestamp: savedMessage.createdAt
                    });
                }

                console.log(`Message sent in exchange ${exchangeId}`);

            } catch (error) {
                console.error('Error sending exchange message:', error);
                socket.emit('chat-error', { message: 'Failed to send message' });
            }
        });

        // Handle real-time offer updates
        socket.on('offer-updated', (data) => {
            const { exchangeId, offerType, newOffer } = data;

            if (socket.currentRoom) {
                // Broadcast offer update to negotiation playground
                socket.to(socket.currentRoom).emit('offer-updated-realtime', {
                    exchangeId,
                    offerType,
                    newOffer,
                    userSupabaseId: socket.userSupabaseId,
                    timestamp: new Date().toISOString()
                });

                console.log(`Offer updated in exchange ${exchangeId} by ${socket.userSupabaseId}`);
            }
        });

        // NEW: Handle user acceptance events
        socket.on('user-accepted', (data) => {
            const { exchangeId, userSupabaseId, newStatus, acceptanceData, message } = data;

            if (socket.currentRoom) {
                // Broadcast acceptance to other participants
                socket.to(socket.currentRoom).emit('user-accepted-exchange', {
                    exchangeId,
                    userSupabaseId,
                    newStatus,
                    acceptanceData,
                    message,
                    timestamp: new Date().toISOString()
                });

                console.log(`User ${userSupabaseId} accepted exchange ${exchangeId}. New status: ${newStatus}`);
            }
        });

        // UPDATED: Handle exchange status changes (includes acceptance data)
        socket.on('status-changed', (data) => {
            const { exchangeId, newStatus, previousStatus, acceptanceData } = data;

            if (socket.currentRoom) {
                // Broadcast status change with acceptance data
                socket.to(socket.currentRoom).emit('status-changed-realtime', {
                    exchangeId,
                    newStatus,
                    previousStatus,
                    acceptanceData, // NEW: Include acceptance data
                    timestamp: new Date().toISOString()
                });

                // Close chat if exchange reaches terminal status
                const chatUnavailableStatuses = ['completed', 'cancelled', 'expired'];
                if (chatUnavailableStatuses.includes(newStatus)) {
                    io.to(socket.currentRoom).emit('chat-closed', {
                        reason: `Exchange ${newStatus}`,
                        timestamp: new Date().toISOString()
                    });
                }

                console.log(`Exchange ${exchangeId} status changed from ${previousStatus} to ${newStatus}`);
            }
        });

        // Handle typing indicators
        socket.on('typing-start', () => {
            if (socket.currentRoom) {
                socket.to(socket.currentRoom).emit('user-typing', {
                    userSupabaseId: socket.userSupabaseId,
                    userRole: socket.userRole,
                    isTyping: true
                });
            }
        });

        socket.on('typing-stop', () => {
            if (socket.currentRoom) {
                socket.to(socket.currentRoom).emit('user-typing', {
                    userSupabaseId: socket.userSupabaseId,
                    userRole: socket.userRole,
                    isTyping: false
                });
            }
        });

        // Leave exchange room
        socket.on('leave-exchange-chat', () => {
            if (socket.currentRoom && socket.userSupabaseId) {
                console.log(`User ${socket.userSupabaseId} leaving exchange ${socket.currentExchangeId}`);
                socket.leave(socket.currentRoom);
            }
        });

        // Handle disconnection
        socket.on('disconnect', (reason) => {
            console.log('User disconnected:', socket.id, 'Reason:', reason);
        });

        // Basic error handling
        socket.on('error', (error) => {
            console.error('Socket error for user:', socket.userSupabaseId, error);
            socket.emit('chat-error', { message: 'Connection error occurred' });
        });
    });

    // Start the server
    httpServer.listen(port, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://${hostname}:${port}`);
        console.log('> Socket.IO server running with simplified exchange chat and two-step acceptance');
    });
});
