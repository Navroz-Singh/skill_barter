// utils/exchangeChatHelpers.js

// Chat availability status constants (UPDATED)
export const CHAT_AVAILABLE_STATUSES = ['negotiating', 'pending_acceptance', 'accepted', 'in_progress'];
export const CHAT_UNAVAILABLE_STATUSES = ['pending', 'completed', 'cancelled', 'expired'];

// Exchange status messages (UPDATED with pending_acceptance)
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
    'pending_acceptance': {
        message: 'Chat is active - waiting for final acceptance from both parties',
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-800'
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
 * NEW: Check if user can accept the exchange
 * @param {object} exchange - Exchange object
 * @param {string} userSupabaseId - User's Supabase ID
 * @returns {object} - Acceptance status and capabilities
 */
export const getUserAcceptanceStatus = (exchange, userSupabaseId) => {
    if (!exchange || !userSupabaseId) {
        return {
            canAccept: false,
            hasAccepted: false,
            reason: 'Invalid exchange or user'
        };
    }

    const isInitiator = exchange.initiator?.supabaseId === userSupabaseId;
    const isRecipient = exchange.recipient?.supabaseId === userSupabaseId;
    
    if (!isInitiator && !isRecipient) {
        return {
            canAccept: false,
            hasAccepted: false,
            reason: 'Not a participant in this exchange'
        };
    }

    // Check if status allows acceptance
    if (!['negotiating', 'pending_acceptance'].includes(exchange.status)) {
        return {
            canAccept: false,
            hasAccepted: false,
            reason: `Cannot accept in current status: ${exchange.status}`
        };
    }

    const hasUserAccepted = isInitiator 
        ? exchange.acceptance?.initiatorAccepted 
        : exchange.acceptance?.recipientAccepted;

    const otherUserAccepted = isInitiator 
        ? exchange.acceptance?.recipientAccepted 
        : exchange.acceptance?.initiatorAccepted;

    const bothAccepted = exchange.acceptance?.initiatorAccepted && exchange.acceptance?.recipientAccepted;

    return {
        canAccept: !hasUserAccepted && ['negotiating', 'pending_acceptance'].includes(exchange.status),
        hasAccepted: hasUserAccepted || false,
        otherUserAccepted: otherUserAccepted || false,
        bothAccepted: bothAccepted || false,
        userRole: isInitiator ? 'initiator' : 'recipient',
        status: exchange.status
    };
};

/**
 * NEW: Get acceptance status message for UI display
 * @param {object} exchange - Exchange object
 * @param {string} userSupabaseId - User's Supabase ID
 * @returns {object} - Message and styling for acceptance status
 */
export const getAcceptanceStatusMessage = (exchange, userSupabaseId) => {
    const acceptanceStatus = getUserAcceptanceStatus(exchange, userSupabaseId);
    
    if (!acceptanceStatus.canAccept && !acceptanceStatus.hasAccepted) {
        return {
            message: acceptanceStatus.reason,
            color: 'text-gray-600 dark:text-gray-400',
            bgColor: 'bg-gray-50 dark:bg-gray-900/20'
        };
    }

    if (acceptanceStatus.bothAccepted) {
        return {
            message: 'Both parties have accepted this exchange',
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-50 dark:bg-green-900/20'
        };
    }

    if (acceptanceStatus.hasAccepted && !acceptanceStatus.otherUserAccepted) {
        return {
            message: 'You have accepted. Waiting for other party to accept.',
            color: 'text-orange-600 dark:text-orange-400',
            bgColor: 'bg-orange-50 dark:bg-orange-900/20'
        };
    }

    if (!acceptanceStatus.hasAccepted && acceptanceStatus.otherUserAccepted) {
        return {
            message: 'Other party has accepted. Your acceptance is needed.',
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20'
        };
    }

    if (acceptanceStatus.canAccept) {
        return {
            message: 'Ready for acceptance by both parties',
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20'
        };
    }

    return {
        message: 'Acceptance status unknown',
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-50 dark:bg-gray-900/20'
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
            reason: 'Exchange not found'
        };
    }

    // Check if user is a participant
    const isInitiator = exchange.initiator?.supabaseId === userSupabaseId;
    const isRecipient = exchange.recipient?.supabaseId === userSupabaseId;
    const isParticipant = isInitiator || isRecipient;

    if (!isParticipant) {
        return {
            canAccess: false,
            reason: 'You are not a participant in this exchange'
        };
    }

    // Check if chat is available for current status
    const chatAvailable = isChatAvailable(exchange.status);

    if (!chatAvailable) {
        const statusInfo = getExchangeStatusInfo(exchange.status);
        return {
            canAccess: false,
            reason: statusInfo.message,
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
    let daysRemaining = null;
    let isExpiringSoon = false;

    if (expiresAt && expiresAt > now) {
        const timeRemaining = expiresAt.getTime() - now.getTime();
        daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
        isExpiringSoon = daysRemaining <= 3; // Expiring in 3 days or less
    }

    return {
        daysSinceCreation,
        daysRemaining,
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
 * Sort messages by timestamp (simple ordering)
 * @param {array} messages - Array of messages
 * @returns {array} - Sorted messages array
 */
export const sortMessagesByTimestamp = (messages) => {
    return [...messages].sort((a, b) => {
        const timeA = new Date(a.createdAt || a.timestamp).getTime();
        const timeB = new Date(b.createdAt || b.timestamp).getTime();
        return timeA - timeB;
    });
};

/**
 * Simple duplicate detection by message ID
 * @param {object} newMessage - New message to check
 * @param {array} existingMessages - Array of existing messages
 * @returns {boolean} - Whether message is a duplicate
 */
export const isDuplicateMessage = (newMessage, existingMessages = []) => {
    if (!newMessage._id) return false;
    
    return existingMessages.some(existing => existing._id === newMessage._id);
};

/**
 * Generate temporary message ID for optimistic updates
 * @returns {string} - Temporary message ID
 */
export const generateTempMessageId = () => {
    return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
