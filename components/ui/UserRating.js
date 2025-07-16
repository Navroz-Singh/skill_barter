// components/ui/UserRating.js
'use client';

import StarRating from './StarRating';

const UserRating = ({ rating, reviewCount, showCount = true }) => {
    return (
        <div className="flex items-center gap-2">
            <StarRating rating={rating} readonly size="sm" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
                {rating > 0 ? rating.toFixed(1) : 'No ratings'}
                {showCount && reviewCount > 0 && (
                    <span className="ml-1">({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span>
                )}
            </span>
        </div>
    );
};

export default UserRating;
