// app/view-profile/[userid]/not-found.js
'use client';

import Link from 'next/link';
import { UserX, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen pt-20 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="text-center">
                <UserX className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    User Not Found
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    The user profile you're looking for doesn't exist or is no longer available.
                </p>
                <Link
                    href="/browse"
                    className="inline-flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Browse
                </Link>
            </div>
        </div>
    );
}
