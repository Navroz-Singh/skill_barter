// Chat availability status constants
export const CHAT_AVAILABLE_STATUSES = ['negotiating', 'accepted', 'in_progress'];
export const CHAT_UNAVAILABLE_STATUSES = ['pending', 'completed', 'cancelled', 'expired'];

// Exchange status messages
export const EXCHANGE_STATUS_MESSAGES = {
    'pending': {
        message: 'Chat will be available once negotiation begins',
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800'
    },
    'negotiating': {
        message: 'Chat is active - negotiate your exchange details',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800'
    },
    'accepted': {
        message: 'Chat is active - coordinate your exchange',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800'
    },
    'in_progress': {
        message: 'Chat is active - track progress and communicate',
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        borderColor: 'border-purple-200 dark:border-purple-800'
    },
    'completed': {
        message: 'Exchange completed - chat is now closed',
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-50 dark:bg-gray-900/20',
        borderColor: 'border-gray-200 dark:border-gray-800'
    },
    'cancelled': {
        message: 'Exchange cancelled - chat is no longer available',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800'
    },
    'expired': {
        message: 'Exchange expired - chat is no longer available',
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-800'
    }
};

/**
 * Check if chat is available for given exchange status
 * @param {string} status - Exchange status
 * @returns {boolean} - Whether chat is available
 */
export const isChatAvailable = (status) => {
    return CHAT_AVAILABLE_STATUSES.includes(status);
};

/**
 * Get status message and styling for exchange status
 * @param {string} status - Exchange status
 * @returns {object} - Message object with styling
 */
export const getExchangeStatusInfo = (status) => {
    return EXCHANGE_STATUS_MESSAGES[status] || {
        message: 'Unknown exchange status',
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-50 dark:bg-gray-900/20',
        borderColor: 'border-gray-200 dark:border-gray-800'
    };
};

/**
 * Validate if user can access exchange chat
 * @param {object} exchange - Exchange object
 * @param {string} userSupabaseId - User's Supabase ID
 * @returns {object} - Validation result
 */
export const validateChatAccess = (exchange, userSupabaseId) => {
    if (!exchange) {
        return {
            canAccess: false,
            reason: 'Exchange not found',
            code: 'EXCHANGE_NOT_FOUND'
        };
    }

    // Check if user is a participant
    const isInitiator = exchange.initiator?.supabaseId === userSupabaseId;
    const isRecipient = exchange.recipient?.supabaseId === userSupabaseId;
    const isParticipant = isInitiator || isRecipient;

    if (!isParticipant) {
        return {
            canAccess: false,
            reason: 'You are not a participant in this exchange',
            code: 'NOT_PARTICIPANT'
        };
    }

    // Check if chat is available for current status
    const chatAvailable = isChatAvailable(exchange.status);

    if (!chatAvailable) {
        const statusInfo = getExchangeStatusInfo(exchange.status);
        return {
            canAccess: false,
            reason: statusInfo.message,
            code: 'CHAT_UNAVAILABLE',
            status: exchange.status,
            userRole: isInitiator ? 'initiator' : 'recipient'
        };
    }

    return {
        canAccess: true,
        userRole: isInitiator ? 'initiator' : 'recipient',
        otherParticipant: isInitiator ? exchange.recipient : exchange.initiator,
        status: exchange.status
    };
};

/**
 * Format chat participant display name
 * @param {object} participant - Participant object
 * @param {string} role - User role (initiator/recipient)
 * @param {boolean} isCurrentUser - Whether this is current user
 * @returns {string} - Formatted display name
 */
export const formatParticipantName = (participant, role, isCurrentUser = false) => {
    if (isCurrentUser) return 'You';

    const name = participant?.userId?.name || participant?.name || 'Unknown User';
    const roleLabel = role === 'initiator' ? 'Initiator' : 'Recipient';

    return `${name} (${roleLabel})`;
};

/**
 * Calculate exchange timeline information
 * @param {object} exchange - Exchange object
 * @returns {object} - Timeline information
 */
export const getExchangeTimeline = (exchange) => {
    const now = new Date();
    const createdAt = new Date(exchange.createdAt);
    const expiresAt = exchange.expiresAt ? new Date(exchange.expiresAt) : null;

    // Time since creation
    const daysSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

    // Time remaining
    let timeRemaining = null;
    let daysRemaining = null;
    let isExpiringSoon = false;

    if (expiresAt && expiresAt > now) {
        timeRemaining = expiresAt.getTime() - now.getTime();
        daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
        isExpiringSoon = daysRemaining <= 3; // Expiring in 3 days or less
    }

    return {
        daysSinceCreation,
        daysRemaining,
        timeRemaining,
        isExpiringSoon,
        isExpired: expiresAt && expiresAt <= now,
        createdAt,
        expiresAt
    };
};

/**
 * Get chat room identifier for socket
 * @param {string} exchangeId - Exchange ID
 * @returns {string} - Socket room identifier
 */
export const getChatRoomId = (exchangeId) => {
    return `exchange-${exchangeId}`;
};

/**
 * Check if message is from current user
 * @param {object} message - Message object
 * @param {string} userSupabaseId - Current user's Supabase ID
 * @returns {boolean} - Whether message is from current user
 */
export const isMessageFromCurrentUser = (message, userSupabaseId) => {
    return message?.sender?.supabaseId === userSupabaseId;
};

/**
 * Get unread message count for user
 * @param {array} messages - Array of messages
 * @param {string} userSupabaseId - User's Supabase ID
 * @returns {number} - Count of unread messages
 */
export const getUnreadMessageCount = (messages, userSupabaseId) => {
    return messages.filter(message =>
        !message.readBy?.some(read => read.supabaseId === userSupabaseId)
    ).length;
};

/**
 * Format message timestamp for display
 * @param {string|Date} timestamp - Message timestamp
 * @param {boolean} showTime - Whether to show time
 * @returns {string} - Formatted timestamp
 */
export const formatMessageTimestamp = (timestamp, showTime = true) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
        return 'Just now';
    } else if (diffInHours < 24) {
        return showTime ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today';
    } else if (diffInHours < 48) {
        return showTime ? `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Yesterday';
    } else {
        return date.toLocaleDateString();
    }
};

/**
 * Validate message content before sending
 * @param {string} content - Message content
 * @returns {object} - Validation result
 */
export const validateMessageContent = (content) => {
    if (!content || !content.trim()) {
        return {
            isValid: false,
            error: 'Message cannot be empty'
        };
    }

    if (content.length > 1000) {
        return {
            isValid: false,
            error: 'Message cannot exceed 1000 characters'
        };
    }

    return {
        isValid: true,
        trimmedContent: content.trim()
    };
};

/**
 * Generate system message content based on event type
 * @param {string} eventType - Type of system event
 * @param {object} eventData - Event data
 * @returns {object} - System message content and styling
 */
export const generateSystemMessageContent = (eventType, eventData) => {
    switch (eventType) {
        case 'offer_updated':
            return {
                text: `${eventData.offerType === 'initiator' ? 'Initiator' : 'Recipient'} updated their offer`,
                icon: 'ArrowRightLeft',
                color: 'text-blue-600 dark:text-blue-400'
            };
        case 'status_changed':
            return {
                text: `Exchange status changed to "${eventData.newStatus}"`,
                icon: 'AlertCircle',
                color: 'text-green-600 dark:text-green-400'
            };
        case 'exchange_created':
            return {
                text: 'Exchange conversation started',
                icon: 'MessageCircle',
                color: 'text-gray-600 dark:text-gray-400'
            };
        case 'deadline_warning':
            return {
                text: `Exchange expires in ${eventData.daysRemaining} days`,
                icon: 'Clock',
                color: 'text-orange-600 dark:text-orange-400'
            };
        default:
            return {
                text: 'System notification',
                icon: 'Bell',
                color: 'text-gray-600 dark:text-gray-400'
            };
    }
};

// NEW Step 10: Message Synchronization & Ordering Utilities

/**
 * Sort messages by sequence number and timestamp for consistent ordering
 * @param {array} messages - Array of messages
 * @returns {array} - Sorted messages array
 */
export const sortMessagesBySequence = (messages) => {
    return [...messages].sort((a, b) => {
        // First priority: server sequence number
        if (a.sequence && b.sequence) {
            return a.sequence - b.sequence;
        }

        // Second priority: client sequence for local ordering
        if (a.clientSequence && b.clientSequence) {
            return a.clientSequence - b.clientSequence;
        }

        // Fallback: timestamp-based ordering
        const timeA = new Date(a.createdAt || a.timestamp).getTime();
        const timeB = new Date(b.createdAt || b.timestamp).getTime();
        return timeA - timeB;
    });
};

/**
 * Enhanced duplicate detection with multiple strategies
 * @param {object} newMessage - New message to check
 * @param {array} existingMessages - Array of existing messages
 * @param {Set} messageHistory - Set of known message IDs
 * @returns {boolean} - Whether message is a duplicate
 */
export const isDuplicateMessage = (newMessage, existingMessages = [], messageHistory = new Set()) => {
    // Strategy 1: Check by message ID
    if (newMessage._id && messageHistory.has(newMessage._id)) {
        return true;
    }

    // Strategy 2: Check by sequence number (server-assigned)
    if (newMessage.sequence) {
        const existingWithSameSequence = existingMessages.find(msg =>
            msg.sequence === newMessage.sequence
        );
        if (existingWithSameSequence) {
            return true;
        }
    }

    // Strategy 3: Check by content and sender within time window
    const timeWindow = 5000; // 5 seconds
    const newTime = new Date(newMessage.createdAt || newMessage.timestamp).getTime();

    return existingMessages.some(existing =>
        existing.sender?.supabaseId === newMessage.sender?.supabaseId &&
        existing.content === newMessage.content &&
        Math.abs(new Date(existing.createdAt || existing.timestamp).getTime() - newTime) < timeWindow
    );
};

/**
 * Reconcile local and server messages after reconnection
 * @param {array} localMessages - Messages from local state
 * @param {array} serverMessages - Messages from server
 * @param {Set} messageHistory - Set of known message IDs
 * @returns {object} - Reconciliation result
 */
export const reconcileMessageLists = (localMessages, serverMessages, messageHistory = new Set()) => {
    // Create maps for efficient lookup
    const serverMap = new Map(serverMessages.map(msg => [msg._id, msg]));
    const localMap = new Map(localMessages.map(msg => [msg._id, msg]));

    // Find different types of messages
    const localOnlyMessages = localMessages.filter(local =>
        local._id.startsWith('temp-') && !serverMap.has(local._id)
    );

    const serverOnlyMessages = serverMessages.filter(server =>
        !messageHistory.has(server._id) && !localMap.has(server._id)
    );

    const confirmedMessages = localMessages.filter(local =>
        !local._id.startsWith('temp-') || serverMap.has(local._id)
    );

    // Messages that failed to send (exist locally but not on server)
    const failedMessages = localOnlyMessages.filter(msg =>
        msg.status === 'failed' || msg.status === 'sending'
    );

    // Merge all confirmed and new messages
    const reconciledMessages = [
        ...confirmedMessages,
        ...serverOnlyMessages
    ];

    // Sort by sequence/timestamp
    const sortedMessages = sortMessagesBySequence(reconciledMessages);

    return {
        messages: sortedMessages,
        newMessages: serverOnlyMessages,
        failedMessages: failedMessages,
        totalCount: sortedMessages.length,
        needsRetry: failedMessages.length > 0
    };
};

/**
 * Create message queue item with priority
 * @param {string} content - Message content
 * @param {string} priority - Priority level (high, normal, low)
 * @param {object} metadata - Additional metadata
 * @returns {object} - Queue item
 */
export const createQueueItem = (content, priority = 'normal', metadata = {}) => {
    return {
        content: content.trim(),
        priority,
        timestamp: new Date().toISOString(),
        retryCount: 0,
        tempId: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...metadata
    };
};

/**
 * Sort message queue by priority and timestamp
 * @param {array} queue - Array of queue items
 * @returns {array} - Sorted queue
 */
export const sortMessageQueue = (queue) => {
    const priorityOrder = { high: 0, normal: 1, low: 2 };

    return [...queue].sort((a, b) => {
        // First by priority
        const priorityDiff = priorityOrder[a.priority || 'normal'] - priorityOrder[b.priority || 'normal'];
        if (priorityDiff !== 0) return priorityDiff;

        // Then by timestamp (older first)
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
};

/**
 * Find conflicts in message sequences
 * @param {array} messages - Array of messages
 * @returns {array} - Array of conflicts found
 */
export const findSequenceConflicts = (messages) => {
    const conflicts = [];
    const sequenceMap = new Map();

    messages.forEach(message => {
        if (message.sequence) {
            if (sequenceMap.has(message.sequence)) {
                conflicts.push({
                    sequence: message.sequence,
                    messages: [sequenceMap.get(message.sequence), message],
                    type: 'duplicate_sequence'
                });
            } else {
                sequenceMap.set(message.sequence, message);
            }
        }
    });

    return conflicts;
};

/**
 * Get the latest sequence number from messages
 * @param {array} messages - Array of messages
 * @returns {number} - Latest sequence number
 */
export const getLatestSequence = (messages) => {
    return messages.reduce((latest, message) => {
        return Math.max(latest, message.sequence || 0);
    }, 0);
};

/**
 * Check if message list needs synchronization
 * @param {array} localMessages - Local messages
 * @param {number} serverSequence - Latest server sequence
 * @returns {boolean} - Whether sync is needed
 */
export const needsMessageSync = (localMessages, serverSequence) => {
    const localLatestSequence = getLatestSequence(localMessages);
    return serverSequence > localLatestSequence;
};

/**
 * Extract failed messages that need retry
 * @param {array} messages - Array of messages
 * @returns {array} - Messages that need retry
 */
export const extractFailedMessages = (messages) => {
    return messages.filter(message =>
        message.status === 'failed' ||
        (message.status === 'sending' && message._id.startsWith('temp-'))
    ).map(message => ({
        content: message.content,
        tempId: message._id,
        priority: 'high',
        originalTimestamp: message.createdAt || message.timestamp
    }));
};
