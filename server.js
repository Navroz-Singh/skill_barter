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

// NEW Step 10: Message sequence tracking per exchange
const exchangeSequences = new Map(); // exchangeId -> current sequence number

// NEW Step 10: Get next sequence number for exchange
const getNextSequence = (exchangeId) => {
    const current = exchangeSequences.get(exchangeId) || 0;
    const next = current + 1;
    exchangeSequences.set(exchangeId, next);
    return next;
};

// NEW Step 10: Initialize sequence for exchange
const initializeSequence = async (exchangeId) => {
    if (!exchangeSequences.has(exchangeId)) {
        try {
            // Get the highest sequence number from existing messages
            const lastMessage = await Message.findOne({ exchangeId })
                .sort({ sequence: -1 })
                .select('sequence');

            const lastSequence = lastMessage?.sequence || 0;
            exchangeSequences.set(exchangeId, lastSequence);
        } catch (error) {
            console.error('Error initializing sequence:', error);
            exchangeSequences.set(exchangeId, 0);
        }
    }
};

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

        // Join exchange chat room
        socket.on('join-exchange-chat', async (data) => {
            const { exchangeId, userSupabaseId } = data;

            try {
                await connectDB();

                // Verify exchange exists and user is participant
                const exchange = await Exchange.findById(exchangeId);
                if (!exchange) {
                    socket.emit('chat-error', { message: 'Exchange not found' });
                    return;
                }

                // Check if user is participant
                const isParticipant =
                    exchange.initiator.supabaseId === userSupabaseId ||
                    exchange.recipient.supabaseId === userSupabaseId;

                if (!isParticipant) {
                    socket.emit('chat-error', { message: 'Not authorized for this exchange' });
                    return;
                }

                // Check if chat is available for current exchange status
                const chatAvailableStatuses = ['negotiating', 'accepted', 'in_progress'];
                if (!chatAvailableStatuses.includes(exchange.status)) {
                    socket.emit('chat-error', {
                        message: `Chat not available. Exchange status: ${exchange.status}`
                    });
                    return;
                }

                // NEW Step 10: Initialize sequence tracking for this exchange
                await initializeSequence(exchangeId);

                // Leave any previous rooms
                socket.rooms.forEach(room => {
                    if (room !== socket.id) {
                        socket.leave(room);
                    }
                });

                // Join exchange chat room
                const roomName = `exchange-${exchangeId}`;
                socket.join(roomName);

                // Store user context
                socket.userSupabaseId = userSupabaseId;
                socket.currentExchangeId = exchangeId;
                socket.currentRoom = roomName;
                socket.userRole = exchange.initiator.supabaseId === userSupabaseId ? 'initiator' : 'recipient';

                // Notify other participant
                socket.to(roomName).emit('user-joined-exchange', {
                    userSupabaseId,
                    userRole: socket.userRole,
                    timestamp: new Date().toISOString()
                });

                console.log(`User ${userSupabaseId} (${socket.userRole}) joined exchange ${exchangeId}`);

            } catch (error) {
                console.error('Error joining exchange chat:', error);
                socket.emit('chat-error', { message: 'Failed to join exchange chat' });
            }
        });

        // ENHANCED Step 10: Handle exchange messages with sequence numbering
        socket.on('send-exchange-message', async (messageData) => {
            const { exchangeId, content, messageId, clientSequence } = messageData;

            // Validation
            if (!exchangeId || !content || !socket.userSupabaseId) {
                socket.emit('chat-error', { message: 'Invalid message data' });
                return;
            }

            try {
                await connectDB();

                // Verify exchange status still allows chat
                const exchange = await Exchange.findById(exchangeId);
                if (!exchange || !['negotiating', 'accepted', 'in_progress'].includes(exchange.status)) {
                    socket.emit('chat-error', { message: 'Chat no longer available for this exchange' });
                    return;
                }

                // Get user info
                const user = await User.findOne({ supabaseId: socket.userSupabaseId }).select('_id');
                if (!user) {
                    socket.emit('chat-error', { message: 'User not found' });
                    return;
                }

                // NEW Step 10: Get server sequence number for message ordering
                const serverSequence = getNextSequence(exchangeId);

                // Create message with sequence numbers
                const newMessage = new Message({
                    exchangeId,
                    content: content.trim(),
                    sender: {
                        userId: user._id,
                        supabaseId: socket.userSupabaseId,
                        role: socket.userRole
                    },
                    type: 'user',
                    sequence: serverSequence, // NEW: Server-side sequence for ordering
                    clientSequence: clientSequence || null // NEW: Client-side sequence for tracking
                });

                const savedMessage = await newMessage.save();

                // ENHANCED Step 10: Broadcast with sequence information
                const roomName = `exchange-${exchangeId}`;
                const messagePayload = {
                    _id: savedMessage._id,
                    messageId: savedMessage._id,
                    content: savedMessage.content,
                    sender: savedMessage.sender,
                    timestamp: savedMessage.createdAt,
                    createdAt: savedMessage.createdAt,
                    type: savedMessage.type,
                    sequence: savedMessage.sequence, // NEW: Include sequence for ordering
                    clientSequence: savedMessage.clientSequence,
                    readBy: savedMessage.readBy || []
                };

                io.to(roomName).emit('new-exchange-message', messagePayload);

                // ENHANCED: Send delivery confirmation with sequence info
                if (messageId) {
                    socket.emit('message-delivered', {
                        messageId: savedMessage._id,
                        tempId: messageId,
                        sequence: savedMessage.sequence, // NEW: Include sequence
                        timestamp: savedMessage.createdAt
                    });
                }

                console.log(`Message sent in exchange ${exchangeId} with sequence ${serverSequence}`);

            } catch (error) {
                console.error('Error sending exchange message:', error);
                socket.emit('message-error', {
                    error: 'Failed to send message',
                    messageId: messageData.messageId,
                    clientSequence: messageData.clientSequence // NEW: Include for error tracking
                });
            }
        });

        // ENHANCED Step 10: Handle offer updates with sequence tracking
        socket.on('offer-updated', async (data) => {
            const { exchangeId, offerType, newOffer } = data;

            try {
                await connectDB();

                // NEW Step 10: Get sequence for system message
                const serverSequence = getNextSequence(exchangeId);

                // Create system message for offer update with sequence
                const systemMessage = await Message.create({
                    exchangeId,
                    type: 'offer_update',
                    sequence: serverSequence, // NEW: Sequence for system messages too
                    systemData: {
                        event: 'offer_updated',
                        details: {
                            offerType,
                            newOffer,
                            triggeredBy: socket.userSupabaseId
                        }
                    }
                });

                // Broadcast offer update with sequence
                const roomName = `exchange-${exchangeId}`;
                io.to(roomName).emit('offer-system-message', {
                    _id: systemMessage._id,
                    messageId: systemMessage._id,
                    systemData: systemMessage.systemData,
                    timestamp: systemMessage.createdAt,
                    createdAt: systemMessage.createdAt,
                    type: 'offer_update',
                    sequence: systemMessage.sequence // NEW: Include sequence
                });

            } catch (error) {
                console.error('Error creating offer update message:', error);
            }
        });

        // ENHANCED: Heartbeat handling with connection quality
        socket.on('heartbeat', () => {
            const responseTime = Date.now();
            socket.emit('heartbeat-response', {
                timestamp: responseTime,
                status: 'connected'
            });
        });

        // ENHANCED Step 10: Handle exchange status changes with sequence
        socket.on('status-changed', async (data) => {
            const { exchangeId, newStatus, previousStatus } = data;

            try {
                await connectDB();

                // NEW Step 10: Get sequence for system message
                const serverSequence = getNextSequence(exchangeId);

                // Create system message for status change with sequence
                const systemMessage = await Message.create({
                    exchangeId,
                    type: 'status_change',
                    sequence: serverSequence, // NEW: Sequence for system messages
                    systemData: {
                        event: 'status_changed',
                        details: {
                            previousStatus,
                            newStatus,
                            triggeredBy: socket.userSupabaseId
                        }
                    }
                });

                // Broadcast status change with sequence
                const roomName = `exchange-${exchangeId}`;
                io.to(roomName).emit('status-system-message', {
                    _id: systemMessage._id,
                    messageId: systemMessage._id,
                    systemData: systemMessage.systemData,
                    timestamp: systemMessage.createdAt,
                    createdAt: systemMessage.createdAt,
                    type: 'status_change',
                    sequence: systemMessage.sequence // NEW: Include sequence
                });

                // If status change makes chat unavailable, notify users
                const chatUnavailableStatuses = ['completed', 'cancelled', 'expired'];
                if (chatUnavailableStatuses.includes(newStatus)) {
                    io.to(roomName).emit('chat-closed', {
                        reason: `Exchange ${newStatus}`,
                        timestamp: new Date().toISOString()
                    });
                }

            } catch (error) {
                console.error('Error creating status change message:', error);
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

        // Handle leaving exchange chat
        socket.on('leave-exchange-chat', () => {
            if (socket.currentRoom && socket.userSupabaseId) {
                console.log(`User ${socket.userSupabaseId} leaving ${socket.currentExchangeId}`);

                socket.to(socket.currentRoom).emit('user-left-exchange', {
                    userSupabaseId: socket.userSupabaseId,
                    userRole: socket.userRole,
                    timestamp: new Date().toISOString()
                });

                socket.leave(socket.currentRoom);
            }
        });

        // ENHANCED: Connection monitoring and error handling
        socket.on('disconnect', (reason) => {
            console.log('User disconnected:', socket.id, 'Reason:', reason);

            if (socket.currentRoom && socket.userSupabaseId) {
                socket.to(socket.currentRoom).emit('user-disconnected', {
                    userSupabaseId: socket.userSupabaseId,
                    userRole: socket.userRole,
                    timestamp: new Date().toISOString(),
                    reason: reason
                });
            }
        });

        // ENHANCED: Handle connection errors
        socket.on('error', (error) => {
            console.error('Socket error for user:', socket.userSupabaseId, error);
            socket.emit('connection-error', {
                message: 'Connection error occurred',
                timestamp: new Date().toISOString()
            });
        });

        // ENHANCED: Connection quality monitoring
        socket.on('connection-check', () => {
            socket.emit('connection-status', {
                status: 'connected',
                latency: Date.now(),
                timestamp: new Date().toISOString()
            });
        });

        // NEW Step 10: Message sync support for conflict resolution
        socket.on('request-message-sync', async (data) => {
            const { exchangeId, lastSequence } = data;

            try {
                await connectDB();

                // Get messages after the last known sequence
                const newMessages = await Message.find({
                    exchangeId,
                    sequence: { $gt: lastSequence || 0 }
                })
                    .sort({ sequence: 1 })
                    .populate('sender.userId', 'name email')
                    .limit(50); // Limit to prevent overwhelming

                socket.emit('message-sync-response', {
                    exchangeId,
                    messages: newMessages,
                    latestSequence: exchangeSequences.get(exchangeId) || 0
                });

            } catch (error) {
                console.error('Error syncing messages:', error);
                socket.emit('message-sync-error', {
                    error: 'Failed to sync messages'
                });
            }
        });
    });

    // Start the server
    httpServer.listen(port, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://${hostname}:${port}`);
        console.log('> Socket.IO server running with exchange chat support');
    });
});
