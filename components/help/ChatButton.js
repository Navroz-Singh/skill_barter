'use client';

import { MessageCircle } from 'lucide-react';

export default function ChatButton({ onClick, hasNewMessages = false }) {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            aria-label="Open AI Help Chat"
        >
            <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
            {hasNewMessages && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            )}
        </button>
    );
}
