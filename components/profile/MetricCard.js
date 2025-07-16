// components/profile/MetricCard.js

export default function MetricCard({ title, value, icon }) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-3">
                <div className="flex-shrink-0 text-gray-600 dark:text-gray-400">
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {value}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {title}
                    </div>
                </div>
            </div>
        </div>
    );
}
