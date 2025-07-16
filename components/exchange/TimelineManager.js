// components/exchange/TimelineManager.js
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

const TimelineManager = ({ exchangeId }) => {
    const [timelineData, setTimelineData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch timeline data
    useEffect(() => {
        async function fetchTimeline() {
            if (!exchangeId) return;
            
            try {
                const response = await fetch(`/api/exchanges/${exchangeId}/timeline`, {
                    cache: 'no-store'
                });
                const data = await response.json();
                
                if (data.success && data.timeline?.deadline) {
                    setTimelineData(data.timeline);
                }
            } catch (error) {
                console.error('Error fetching timeline:', error);
            } finally {
                setLoading(false);
            }
        }
        
        fetchTimeline();
    }, [exchangeId]);

    // Calculate remaining days
    const remainingDays = useMemo(() => {
        if (!timelineData?.deadline) return null;
        
        const now = new Date();
        const deadline = new Date(timelineData.deadline);
        const diffTime = deadline - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    }, [timelineData]);

    // Don't render if no timeline data or still loading
    if (loading || remainingDays === null) return null;

    // Determine status styling
    const isOverdue = remainingDays < 0;
    const isUrgent = remainingDays <= 2 && remainingDays >= 0;

    const statusConfig = {
        bgColor: isOverdue 
            ? 'bg-red-50 dark:bg-red-900/20' 
            : isUrgent 
            ? 'bg-yellow-50 dark:bg-yellow-900/20' 
            : 'bg-blue-50 dark:bg-blue-900/20',
        textColor: isOverdue 
            ? 'text-red-700 dark:text-red-300' 
            : isUrgent 
            ? 'text-yellow-700 dark:text-yellow-300' 
            : 'text-blue-700 dark:text-blue-300',
        icon: isOverdue ? AlertTriangle : Clock
    };

    return (
        <div className={`mt-3 mb-4 p-3 rounded-lg ${statusConfig.bgColor}`}>
            <div className="flex items-center gap-2">
                <statusConfig.icon className={`w-4 h-4 ${statusConfig.textColor}`} />
                <span className={`text-sm font-medium ${statusConfig.textColor}`}>
                    {isOverdue 
                        ? `${Math.abs(remainingDays)} day${Math.abs(remainingDays) !== 1 ? 's' : ''} overdue`
                        : `${remainingDays} day${remainingDays !== 1 ? 's' : ''} remaining`
                    }
                </span>
            </div>
        </div>
    );
};

export default TimelineManager;
