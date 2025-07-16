// utils/roleBasedPermissions.js

// UPDATED: Simplified role mapping for new 2-type system
const EXCHANGE_ROLE_MAPPING = {
    'skill_for_skill': {
        initiator: 'skill_provider',
        recipient: 'skill_provider'
    },
    'skill_for_money': {
        // For skill_for_money, roles are determined by actual offer types
        // This will be handled dynamically in getUserRoleInExchange
        initiator: 'dynamic',
        recipient: 'dynamic'
    }
};

// What each role can edit (unchanged)
const ROLE_PERMISSIONS = {
    skill_provider: {
        canEdit: ['description', 'deliverables', 'hours', 'deadline', 'method', 'skill_id']
    },
    money_provider: {
        canEdit: ['description', 'amount', 'currency', 'payment_timeline', 'deliverables']
    }
};

// UPDATED: Enhanced function to handle dynamic role determination
export function getUserRoleInExchange(exchange, userSupabaseId) {
    const isInitiator = exchange.initiator.supabaseId === userSupabaseId;
    const exchangeRole = isInitiator ? 'initiator' : 'recipient';
    
    let businessRole;
    
    if (exchange.exchangeType === 'skill_for_skill') {
        // Both provide skills
        businessRole = 'skill_provider';
    } else if (exchange.exchangeType === 'skill_for_money') {
        // UPDATED: Determine role by looking at actual offer types
        if (isInitiator) {
            // Check what the initiator is offering
            businessRole = exchange.initiatorOffer?.type === 'money' ? 'money_provider' : 'skill_provider';
        } else {
            // Check what the recipient is offering
            businessRole = exchange.recipientOffer?.type === 'money' ? 'money_provider' : 'skill_provider';
        }
    } else {
        // Fallback for any other exchange type
        businessRole = 'skill_provider';
    }

    return {
        exchangeRole,      // 'initiator' or 'recipient'
        businessRole,      // 'skill_provider' or 'money_provider'  
        isInitiator
    };
}

// Check if user can edit specific field (unchanged)
export function canEditField(businessRole, fieldName) {
    return ROLE_PERMISSIONS[businessRole]?.canEdit.includes(fieldName) || false;
}

// Export constants for use in other components
export { ROLE_PERMISSIONS, EXCHANGE_ROLE_MAPPING };
