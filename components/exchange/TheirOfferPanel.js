// components/exchange/TheirOfferPanel.js
'use client';

import { useState, useEffect } from 'react';
import { Eye, TrendingUp, DollarSign, Clock, Calendar, RefreshCw, Bell, MapPin, CreditCard } from 'lucide-react';

export default function TheirOfferPanel({
    exchangeId,
    currentUser,
    hasUpdates = false, // From parent - when other user updated
    onUpdatesViewed // Callback when user views updates
}) {
    // Core state
    const [offerData, setOfferData] = useState(null);
    const [exchangeData, setExchangeData] = useState(null);
    const [myRoleInfo, setMyRoleInfo] = useState(null);
    const [otherUserRole, setOtherUserRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    // Fetch other user's offer data
    const fetchOfferData = async (showRefreshing = false) => {
        try {
            if (showRefreshing) setRefreshing(true);
            else setLoading(true);

            const response = await fetch(`/api/exchanges/${exchangeId}/negotiation/offer`, {cache: 'no-store'});
            const data = await response.json();

            if (data.success) {
                setOfferData(data.negotiation);
                setMyRoleInfo(data.roleInfo);

                // FIXED: Get exchange data properly
                let exchange = null;
                if (data.negotiation.exchangeId && typeof data.negotiation.exchangeId === 'object') {
                    // Already populated
                    exchange = data.negotiation.exchangeId;
                } else {
                    // Fetch exchange data separately
                    exchange = await getExchangeData(exchangeId);
                }

                if (exchange) {
                    setExchangeData(exchange);

                    // UPDATED: Enhanced role determination for simplified exchange types
                    const myRole = data.roleInfo.exchangeRole; // 'initiator' or 'recipient'
                    const otherRole = myRole === 'initiator' ? 'recipient' : 'initiator';
                    
                    // UPDATED: Determine other user's business role based on actual offer types
                    let otherBusinessRole;
                    if (exchange.exchangeType === 'skill_for_skill') {
                        otherBusinessRole = 'skill_provider'; // Both are skill providers
                    } else if (exchange.exchangeType === 'skill_for_money') {
                        // UPDATED: Check actual offer types to determine roles
                        if (otherRole === 'initiator') {
                            // Other user is initiator - check their offer type
                            otherBusinessRole = exchange.initiatorOffer?.type === 'money' ? 'money_provider' : 'skill_provider';
                        } else {
                            // Other user is recipient - check their offer type
                            otherBusinessRole = exchange.recipientOffer?.type === 'money' ? 'money_provider' : 'skill_provider';
                        }
                    } else {
                        // Default fallback
                        otherBusinessRole = 'skill_provider';
                    }

                    setOtherUserRole({
                        exchangeRole: otherRole,
                        businessRole: otherBusinessRole
                    });

                }

                // Mark updates as viewed
                if (hasUpdates) {
                    onUpdatesViewed?.();
                }
            } else {
                setError(data.error);
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Failed to fetch offer data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Helper to get exchange data if needed
    const getExchangeData = async (exchangeId) => {
        try {
            const response = await fetch(`/api/exchanges/${exchangeId}`);
            const data = await response.json();
            return data.success ? data.exchange : null;
        } catch (err) {
            console.error('Error fetching exchange:', err);
            return null;
        }
    };

    // Load data on mount
    useEffect(() => {
        if (exchangeId && currentUser) {
            fetchOfferData();
        }
    }, [exchangeId, currentUser]);

    // Handle refresh button click
    const handleRefresh = () => {
        fetchOfferData(true);
    };

    // Render other user's offer based on their role
    const renderOfferContent = () => {
        if (!offerData || !otherUserRole || !exchangeData) {
            return (
                <div className="text-center py-4">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Loading offer details...
                    </p>
                </div>
            );
        }
    
        const { businessRole, exchangeRole } = otherUserRole;
        const terms = offerData.terms;
    
        return (
            <div className="space-y-4">
                {/* Description - ALWAYS SHOW */}
                <div>
                    <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {businessRole === 'money_provider' ? 'What they need' : 'Skill they\'ll provide'}
                    </h4>
                    <p className="text-gray-900 dark:text-white leading-relaxed text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded">
                        {terms.descriptions[exchangeRole] || 'No description provided yet.'}
                    </p>
                </div>
    
                {/* FIXED: Deliverables - ALWAYS SHOW for both roles */}
                <div>
                    <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {businessRole === 'money_provider' ? 'Requirements/Expectations' : 'Deliverables'}
                    </h4>
                    {terms.deliverables[exchangeRole]?.length > 0 ? (
                        <div className="space-y-2">
                            {terms.deliverables[exchangeRole].map((deliverable, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-700">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                    <span className="text-purple-700 dark:text-purple-300 text-sm">
                                        {typeof deliverable === 'string' ? deliverable : deliverable.title}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                            <span className="text-gray-500 dark:text-gray-400 text-sm">
                                {businessRole === 'money_provider' ? 'No requirements specified yet' : 'No deliverables specified yet'}
                            </span>
                        </div>
                    )}
                </div>
    
                {/* Money Provider Specific Fields */}
                {businessRole === 'money_provider' && (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Payment Amount
                                </h4>
                                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-700">
                                    <DollarSign className="w-4 h-4 text-green-600" />
                                    <span className="text-green-700 dark:text-green-300 font-semibold">
                                        {terms.currency || 'USD'} {terms.amount || 0}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Currency
                                </h4>
                                <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                                    <span className="text-gray-700 dark:text-gray-300 text-sm">
                                        {terms.currency || 'USD'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Payment Timeline */}
                        <div>
                            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Payment Timeline
                            </h4>
                            <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
                                <CreditCard className="w-4 h-4 text-blue-600" />
                                <span className="text-blue-700 dark:text-blue-300 text-sm capitalize">
                                    {terms.paymentTimeline === 'upfront' ? 'Pay upfront' :
                                     terms.paymentTimeline === 'completion' ? 'Pay on completion' :
                                     terms.paymentTimeline === 'split' ? 'Split payment' :
                                     'Pay on completion'}
                                </span>
                            </div>
                        </div>
                    </>
                )}
    
                {/* Skill Provider Specific Fields */}
                {businessRole === 'skill_provider' && (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Time Commitment
                                </h4>
                                <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-700">
                                    <Clock className="w-4 h-4 text-orange-600" />
                                    <span className="text-orange-700 dark:text-orange-300 text-sm">
                                        {terms.hours[exchangeRole] || 0} hours
                                    </span>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Deadline
                                </h4>
                                <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-700">
                                    <Calendar className="w-4 h-4 text-red-600" />
                                    <span className="text-red-700 dark:text-red-300 text-sm">
                                        {terms.deadline ? new Date(terms.deadline).toLocaleDateString() : 'Not set'}
                                    </span>
                                </div>
                            </div>
                        </div>
    
                        {/* Delivery Method */}
                        <div>
                            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Delivery Method
                            </h4>
                            <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                                <MapPin className="w-4 h-4 text-gray-600" />
                                <span className="text-gray-700 dark:text-gray-300 text-sm capitalize">
                                    {terms.method === 'in-person' ? 'In-person' :
                                     terms.method === 'online' ? 'Online' :
                                     terms.method === 'flexible' ? 'Flexible' :
                                     'Flexible'}
                                </span>
                            </div>
                        </div>
                    </>
                )}
    
                {/* UPDATED: Debug Info */}
                <div className="mt-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs">
                    <strong>Debug:</strong> Other user is {businessRole} ({exchangeRole}) in {exchangeData.exchangeType}
                    <br />
                    <strong>Offers:</strong> Initiator: {exchangeData.initiatorOffer?.type}, Recipient: {exchangeData.recipientOffer?.type}
                </div>
            </div>
        );
    };
    

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Their Offer ({otherUserRole?.businessRole === 'money_provider' ? 'Payment' : 'Service'})
                        </h3>
                    </div>

                    {/* Update Notification Button */}
                    {hasUpdates && (
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-md text-xs font-medium border border-blue-300 dark:border-blue-600 transition-colors"
                        >
                            <Bell className="w-3 h-3" />
                            {refreshing ? 'Updating...' : 'View Updates'}
                            {refreshing && <RefreshCw className="w-3 h-3 animate-spin" />}
                        </button>
                    )}

                    {/* Regular Refresh Button */}
                    {!hasUpdates && (
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="flex items-center gap-1 px-2 py-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded text-xs font-medium"
                        >
                            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {error && (
                    <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded text-sm">
                        {error}
                    </div>
                )}

                {renderOfferContent()}
            </div>
        </div>
    );
}
