// app/admin/disputes/exchange/[exchangeId]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Users,
    Calendar,
    MessageSquare,
    CheckCircle,
    Clock,
    AlertTriangle,
    User,
    Shield,
    ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function ExchangeDisputesDetailPage() {
    const { exchangeId } = useParams();
    const router = useRouter();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [resolvingDispute, setResolvingDispute] = useState(null);

    useEffect(() => {
        fetchExchangeDisputes();
    }, [exchangeId]);

    const fetchExchangeDisputes = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/disputes/exchange/${exchangeId}`, {
                cache: 'no-store'
            });
            const result = await response.json();

            if (response.ok) {
                setData(result);
            } else {
                setError(result.error || 'Failed to fetch exchange disputes');
            }
        } catch (error) {
            console.error('Error fetching exchange disputes:', error);
            setError('Failed to load exchange disputes');
        } finally {
            setLoading(false);
        }
    };

    const handleResolveDispute = async (disputeId, decision, reasoning) => {
        try {
            setResolvingDispute(disputeId);

            const response = await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ decision, reasoning }),
                cache: 'no-store'
            });

            const result = await response.json();

            if (response.ok) {
                // Refresh the data to show updated dispute status
                await fetchExchangeDisputes();

                // Show success message
                alert('Dispute resolved successfully!');
            } else {
                alert(result.error || 'Failed to resolve dispute');
            }
        } catch (error) {
            console.error('Error resolving dispute:', error);
            alert('Failed to resolve dispute');
        } finally {
            setResolvingDispute(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Loading exchange disputes...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <Link
                    href="/admin/disputes"
                    className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Disputes
                </Link>

                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
            </div>
        );
    }

    const { exchange, disputes, stats } = data;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">

                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Exchange Disputes
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Resolve disputes for this skill exchange
                        </p>
                    </div>
                </div>

                <Link
                    href={`/exchange/${exchange._id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    <ExternalLink className="w-4 h-4" />
                    View Exchange
                </Link>
            </div>

            {/* Exchange Overview */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Exchange Overview
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Initiator */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900 dark:text-white">
                                    {exchange.initiator.userId.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Initiator</p>
                            </div>
                        </div>
                        <div className="ml-13">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Offering: {exchange.initiatorOffer.skillTitle}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {exchange.initiatorOffer.description}
                            </p>
                        </div>
                    </div>

                    {/* Recipient */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900 dark:text-white">
                                    {exchange.recipient.userId.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Recipient</p>
                            </div>
                        </div>
                        <div className="ml-13">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Offering: {exchange.recipientOffer.skillTitle}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {exchange.recipientOffer.description}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Exchange Stats */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Created: {new Date(exchange.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Status: {exchange.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {stats.total} total disputes
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {stats.open} need resolution
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Disputes List */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Disputes ({disputes.length})
                </h2>

                {disputes.length === 0 ? (
                    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No disputes found for this exchange</p>
                    </div>
                ) : (
                    disputes.map((dispute) => (
                        <DisputeCard
                            key={dispute._id}
                            dispute={dispute}
                            onResolve={handleResolveDispute}
                            isResolving={resolvingDispute === dispute._id}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

// Dispute Card Component
function DisputeCard({ dispute, onResolve, isResolving }) {
    const [showResolutionForm, setShowResolutionForm] = useState(false);
    const [decision, setDecision] = useState('');
    const [reasoning, setReasoning] = useState('');

    const handleSubmitResolution = (e) => {
        e.preventDefault();
        if (!decision.trim() || !reasoning.trim()) {
            alert('Please provide both decision and reasoning');
            return;
        }
        onResolve(dispute._id, decision, reasoning);
        setShowResolutionForm(false);
        setDecision('');
        setReasoning('');
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header Section */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        {/* Enhanced Avatar */}
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center overflow-hidden ring-2 ring-gray-200 dark:ring-gray-600">
                                {dispute.raisedBy?.avatar ? (
                                    <img
                                        src={dispute.raisedBy.avatar}
                                        alt={dispute.raisedBy.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                                )}
                            </div>
                        </div>

                        {/* User Info */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {dispute.raisedBy?.name || 'Unknown User'}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <span>
                                    {new Date(dispute.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </span>
                                <span>•</span>
                                <span>
                                    {new Date(dispute.createdAt).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Status Badge */}
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${dispute.status === 'open'
                            ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700'
                            : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700'
                        }`}>
                        <div className={`w-2 h-2 rounded-full mr-2 ${dispute.status === 'open' ? 'bg-red-500' : 'bg-green-500'
                            }`} />
                        {dispute.status === 'open' ? 'Open' : 'Resolved'}
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-6 space-y-6">
                {/* Description */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">
                        Description
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {dispute.description}
                        </p>
                    </div>
                </div>

                {/* Evidence */}
                {dispute.evidence && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">
                            Evidence
                        </h4>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                            <p className="text-blue-800 dark:text-blue-200 leading-relaxed whitespace-pre-wrap">
                                {dispute.evidence}
                            </p>
                        </div>
                    </div>
                )}

                {/* Resolution Display */}
                {dispute.status === 'resolved' && dispute.resolution && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                                <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h4 className="text-lg font-semibold text-green-900 dark:text-green-100">
                                    Admin Resolution
                                </h4>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    Resolved by {dispute.resolvedBy?.name || 'Admin'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <span className="text-sm font-medium text-green-800 dark:text-green-200">Decision:</span>
                                <p className="text-green-700 dark:text-green-300 mt-1">
                                    {dispute.resolution.decision}
                                </p>
                            </div>

                            <div>
                                <span className="text-sm font-medium text-green-800 dark:text-green-200">Reasoning:</span>
                                <p className="text-green-700 dark:text-green-300 mt-1">
                                    {dispute.resolution.reasoning}
                                </p>
                            </div>

                            <div className="text-xs text-green-600 dark:text-green-400 pt-2 border-t border-green-200 dark:border-green-700">
                                Resolved on {new Date(dispute.resolution.resolvedAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Section */}
            {dispute.status === 'open' && (
                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 border-t border-gray-200 dark:border-gray-700">
                    {!showResolutionForm ? (
                        <button
                            onClick={() => setShowResolutionForm(true)}
                            disabled={isResolving}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                        >
                            {isResolving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Resolving...
                                </>
                            ) : (
                                <>
                                    <Shield className="w-4 h-4" />
                                    Resolve Dispute
                                </>
                            )}
                        </button>
                    ) : (
                        <form onSubmit={handleSubmitResolution} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                {/* Decision Input */}
                                <div>
                                    <label
                                        htmlFor={`decision-${dispute._id}`}
                                        className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                                    >
                                        Decision
                                    </label>
                                    <input
                                        id={`decision-${dispute._id}`}
                                        type="text"
                                        value={decision}
                                        onChange={(e) => setDecision(e.target.value)}
                                        placeholder="e.g., 'Favor initiator', 'Extend timeline', 'Partial resolution'"
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        required
                                    />
                                </div>

                                {/* Reasoning Textarea */}
                                <div>
                                    <label
                                        htmlFor={`reasoning-${dispute._id}`}
                                        className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                                    >
                                        Reasoning
                                    </label>
                                    <textarea
                                        id={`reasoning-${dispute._id}`}
                                        value={reasoning}
                                        onChange={(e) => setReasoning(e.target.value)}
                                        placeholder="Provide detailed reasoning for your decision and any actions that should be taken..."
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={isResolving}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                                >
                                    {isResolving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Submit Resolution
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowResolutionForm(false);
                                        setDecision('');
                                        setReasoning('');
                                    }}
                                    className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}

