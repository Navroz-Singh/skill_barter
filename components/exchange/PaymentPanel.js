// components/exchange/PaymentPanel.js
'use client';

import { useMemo } from 'react';
import { DollarSign, CreditCard, Shield, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const PaymentPanel = ({ exchange, userRole }) => {
    // Memoized payment data
    const paymentData = useMemo(() => {
        if (!exchange) return null;

        const userOffer = userRole === 'initiator' ? exchange.initiatorOffer : exchange.recipientOffer;
        const otherOffer = userRole === 'initiator' ? exchange.recipientOffer : exchange.initiatorOffer;

        // Determine who pays and who receives
        const userPays = userOffer?.type === 'money';
        const amount = userPays ? userOffer?.monetaryAmount : otherOffer?.monetaryAmount;
        const currency = userPays ? userOffer?.currency : otherOffer?.currency;

        return {
            amount,
            currency,
            userPays,
            paymentTimeline: userPays ? userOffer?.paymentTimeline : otherOffer?.paymentTimeline,
            escrowAmount: exchange.payment?.escrowAmount,
            escrowStatus: exchange.payment?.escrowStatus,
            transactionId: exchange.payment?.transactionId
        };
    }, [exchange, userRole]);

    // Memoized escrow status display
    const escrowStatusDisplay = useMemo(() => {
        if (!paymentData?.escrowStatus) return null;

        const statusMap = {
            'none': {
                icon: AlertCircle,
                color: 'text-gray-600 dark:text-gray-400',
                bgColor: 'bg-gray-50 dark:bg-gray-700',
                label: 'No Escrow'
            },
            'pending': {
                icon: Clock,
                color: 'text-yellow-600 dark:text-yellow-400',
                bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
                label: 'Pending Setup'
            },
            'held': {
                icon: Shield,
                color: 'text-blue-600 dark:text-blue-400',
                bgColor: 'bg-blue-50 dark:bg-blue-900/20',
                label: 'Funds Secured'
            },
            'released': {
                icon: CheckCircle,
                color: 'text-green-600 dark:text-green-400',
                bgColor: 'bg-green-50 dark:bg-green-900/20',
                label: 'Payment Released'
            },
            'refunded': {
                icon: AlertCircle,
                color: 'text-red-600 dark:text-red-400',
                bgColor: 'bg-red-50 dark:bg-red-900/20',
                label: 'Refunded'
            }
        };

        return statusMap[paymentData.escrowStatus] || statusMap.none;
    }, [paymentData?.escrowStatus]);

    if (!paymentData) return null;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Payment Details
                </h3>
            </div>

            {/* Payment Amount */}
            <div className="mb-6">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {paymentData.currency === 'USD' ? '$' : paymentData.currency}{paymentData.amount?.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {paymentData.userPays ? 'You pay' : 'You receive'}
                    </p>
                </div>
            </div>

            {/* Payment Timeline */}
            <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Payment Timeline
                </h4>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {paymentData.paymentTimeline === 'upfront' ? 'Upfront Payment' : 'Payment on Completion'}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            {paymentData.paymentTimeline === 'upfront'
                                ? 'Payment required before work begins'
                                : 'Payment due upon completion of all deliverables'
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Escrow Status */}
            {escrowStatusDisplay && (
                <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Escrow Status
                    </h4>
                    <div className={`flex items-center gap-3 p-3 rounded-lg ${escrowStatusDisplay.bgColor}`}>
                        <escrowStatusDisplay.icon className={`w-5 h-5 ${escrowStatusDisplay.color}`} />
                        <div>
                            <p className={`text-sm font-medium ${escrowStatusDisplay.color}`}>
                                {escrowStatusDisplay.label}
                            </p>
                            {paymentData.escrowAmount && (
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Escrow Amount: {paymentData.currency === 'USD' ? '$' : paymentData.currency}{paymentData.escrowAmount.toLocaleString()}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Transaction ID */}
            {paymentData.transactionId && (
                <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Transaction ID
                    </h4>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <CreditCard className="w-5 h-5 text-gray-500" />
                        <p className="text-sm font-mono text-gray-900 dark:text-white">
                            {paymentData.transactionId}
                        </p>
                    </div>
                </div>
            )}

            {/* Payment Instructions */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Payment Instructions
                        </p>
                        <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                            {paymentData.userPays
                                ? 'Please ensure payment is made according to the agreed timeline. Contact support if you need assistance.'
                                : 'You will receive payment according to the agreed timeline. Payment will be processed securely through our system.'
                            }
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPanel;
