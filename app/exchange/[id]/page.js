//app/exchange/[id]/page.js
'use client';

import { ArrowLeft } from 'lucide-react';
import React from 'react';
import ExchangeWithChat from '@/components/exchange/ExchangeWithChat';

export default function ExchangeDetailPage({ params }) {
    const { id } =  React.use(params);
    
    return (
        <div className="min-h-screen pt-16 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <button
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-6"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-medium">Back to Exchanges</span>
                </button>

                {/* Page Title */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Exchange Details
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        View exchange details and communicate with the other party
                    </p>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Exchange Details (Left Column) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Exchange info components would go here */}
                        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                Exchange Information
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Exchange details will be displayed here...
                            </p>
                        </div>
                    </div>

                    {/* Chat Interface (Right Column) */}
                    <div className="lg:col-span-1">
                        <ExchangeWithChat exchangeId={id} />
                    </div>
                </div>
            </div>
        </div>
    );
}
