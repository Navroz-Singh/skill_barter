// components/profile/ExchangeCard.js

import Link from 'next/link';
import { Eye, MessageCircle, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

// Status configurations
const statusConfig = {
    pending: {
        label: 'Pending',
        icon: Clock,
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        textColor: 'text-gray-700 dark:text-gray-300'
    },
    negotiating: {
        label: 'Negotiating',
        icon: MessageCircle,
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        textColor: 'text-gray-700 dark:text-gray-300'
    },
    pending_acceptance: {
        label: 'Pending Acceptance',
        icon: AlertCircle,
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        textColor: 'text-gray-700 dark:text-gray-300'
    },
    accepted: {
        label: 'Accepted',
        icon: CheckCircle,
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        textColor: 'text-gray-700 dark:text-gray-300'
    },
    in_progress: {
        label: 'In Progress',
        icon: Clock,
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        textColor: 'text-gray-700 dark:text-gray-300'
    },
    completed: {
        label: 'Completed',
        icon: CheckCircle,
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        textColor: 'text-gray-700 dark:text-gray-300'
    },
    cancelled: {
        label: 'Cancelled',
        icon: XCircle,
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        textColor: 'text-gray-700 dark:text-gray-300'
    },
    expired: {
        label: 'Expired',
        icon: XCircle,
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        textColor: 'text-gray-700 dark:text-gray-300'
    }
};

export default function ExchangeCard({ exchange }) {
    const status = statusConfig[exchange.status] || statusConfig.pending;
    const StatusIcon = status.icon;

    // Format date
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Get other participant name
    const getOtherParticipant = () => {
        // This would need to be populated by your API with participant details
        // For now, showing a placeholder
        return 'Exchange Partner';
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 hover:shadow-md transition-shadow">
            {/* Header with status */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white leading-tight mb-1">
                        {exchange.exchangeType === 'skill_for_skill' ? 'Skill Exchange' : 'Skill for Payment'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        with {getOtherParticipant()}
                    </p>
                </div>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${status.bgColor}`}>
                    <StatusIcon className={`h-3 w-3 ${status.textColor}`} />
                    <span className={`text-xs font-medium ${status.textColor}`}>
                        {status.label}
                    </span>
                </div>
            </div>

            {/* Exchange Details */}
            <div className="space-y-3 mb-4">
                {/* Your Offer */}
                <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Your Offer</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                        {exchange.initiatorOffer?.type === 'skill'
                            ? exchange.initiatorOffer.skillTitle || 'Skill Exchange'
                            : `$${exchange.initiatorOffer?.monetaryAmount || 0}`
                        }
                    </p>
                </div>

                {/* Their Offer */}
                {exchange.recipientOffer && (
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Their Offer</p>
                        <p className="text-sm text-gray-900 dark:text-white">
                            {exchange.recipientOffer?.type === 'skill'
                                ? exchange.recipientOffer.skillTitle || 'Skill Exchange'
                                : `$${exchange.recipientOffer?.monetaryAmount || 0}`
                            }
                        </p>
                    </div>
                )}
            </div>

            {/* Exchange Info */}
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-5">
                <span>ID: {exchange.exchangeId}</span>
                <span>•</span>
                <span>{formatDate(exchange.createdAt)}</span>
                {exchange.chatMetadata?.messageCount > 0 && (
                    <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {exchange.chatMetadata.messageCount} messages
                        </span>
                    </>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <Link
                    href={`/exchange/${exchange._id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                    <Eye className="h-4 w-4" />
                    View Details
                </Link>

                {(exchange.status === 'negotiating' || exchange.status === 'pending_acceptance') && (
                    <Link
                        href={`/exchange/${exchange._id}/negotiate`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white dark:text-gray-900 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <MessageCircle className="h-4 w-4" />
                        {exchange.status === 'pending_acceptance' ? 'Respond' : 'Negotiate'}
                    </Link>
                )}
            </div>
        </div>
    );
}
