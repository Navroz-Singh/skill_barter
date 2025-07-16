// components/profile/SkillCard.js

import Link from 'next/link';
import { Edit, Eye, Users } from 'lucide-react';

export default function SkillCard({ skill }) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 hover:shadow-md transition-shadow">
            {/* Header with title and status */}
            <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white leading-tight line-clamp-2 flex-1">
                    {skill.title}
                </h3>
                {skill.isAvailable && (
                    <span className="ml-3 flex-shrink-0 w-3 h-3 bg-gray-400 dark:bg-gray-500 rounded-full"></span>
                )}
            </div>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-4">
                {skill.description}
            </p>

            {/* Category and Level */}
            <div className="flex gap-2 mb-4">
                <span className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium">
                    {skill.category}
                </span>
                <span className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium">
                    {skill.level}
                </span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-5">
                {skill.viewCount > 0 && (
                    <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {skill.viewCount} views
                    </span>
                )}
                {skill.interestedUsers?.length > 0 && (
                    <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {skill.interestedUsers.length} interested
                    </span>
                )}
                {skill.estimatedDuration && (
                    <span className="text-gray-500 dark:text-gray-400">
                        {skill.estimatedDuration}
                    </span>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <Link
                    href={`/my-skills/edit/${skill.id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                    <Edit className="h-4 w-4" />
                    Edit
                </Link>
                <Link
                    href={`/skill/${skill.id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white dark:text-gray-900 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-colors"
                >
                    <Eye className="h-4 w-4" />
                    View
                </Link>
            </div>
        </div>
    );
}
