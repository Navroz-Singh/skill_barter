// components/exchange/ProgressOverview.js
'use client';

import { useMemo } from 'react';
import { TrendingUp, Calendar, Users, Target, Clock } from 'lucide-react';

const ProgressOverview = ({ progressReport, exchange }) => {
    // Memoized progress stats (using the progressReport from your API)
    const progressStats = useMemo(() => {
        if (!progressReport) return null;
        return progressReport; // Your API already provides the perfect structure
    }, [progressReport]);

    if (!progressStats) return null;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Progress Overview
                </h3>
            </div>

            {/* Deliverables Progress */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Deliverables Progress
                    </span>
                </div>

                {/* Overall Progress */}
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                            Overall
                        </span>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                            {progressStats.overall.percentage}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressStats.overall.percentage}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {progressStats.overall.completed} of {progressStats.overall.total} completed
                    </p>
                </div>

                {/* Individual Progress */}
                <div className="grid grid-cols-1 gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                Initiator
                            </span>
                            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                {progressStats.initiator.percentage}%
                            </span>
                        </div>
                        <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-1.5">
                            <div
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${progressStats.initiator.percentage}%` }}
                            />
                        </div>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            {progressStats.initiator.completed} of {progressStats.initiator.total} completed
                        </p>
                    </div>

                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-green-900 dark:text-green-100">
                                Recipient
                            </span>
                            <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                {progressStats.recipient.percentage}%
                            </span>
                        </div>
                        <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-1.5">
                            <div
                                className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${progressStats.recipient.percentage}%` }}
                            />
                        </div>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                            {progressStats.recipient.completed} of {progressStats.recipient.total} completed
                        </p>
                    </div>
                </div>
            </div>

            {/* Exchange Status */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Clock className="w-5 h-5 text-gray-500" />
                <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Exchange Status
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        {exchange.status === 'accepted' && 'Exchange accepted - work in progress'}
                        {exchange.status === 'in_progress' && 'Exchange is actively in progress'}
                        {exchange.status === 'completed' && 'Exchange completed successfully'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ProgressOverview;
