'use client';

import { useState, lazy, Suspense } from 'react';
import { Bot, MessageCircle, Book, Search } from 'lucide-react';
import FAQSection from '@/components/help/FAQSection';
import ChatButton from '@/components/help/ChatButton';

// Lazy load the chat modal for better performance
const ChatModal = lazy(() => import('@/components/help/ChatModal'));

export default function HelpPage() {
    const [isChatOpen, setIsChatOpen] = useState(false);

    const openChat = () => setIsChatOpen(true);
    const closeChat = () => setIsChatOpen(false);

    return (
        <div className="space-y-6">
            {/* Header Section - Following profile page pattern */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Help Center</h1>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                        Get help with exchanges, skills management, and account settings
                    </p>
                </div>
                <button
                    onClick={openChat}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white dark:text-gray-900 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-colors"
                >
                    <Bot className="h-4 w-4" />
                    AI Assistant
                </button>
            </div>

            {/* FAQ Section */}
            <div>
                <div className="flex items-center gap-2 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Frequently Asked Questions
                    </h2>
                </div>
                <FAQSection />
            </div>

            {/* Floating Chat Button */}
            <ChatButton onClick={openChat} />

            {/* Lazy Loaded Chat Modal */}
            {isChatOpen && (
                <Suspense fallback={null}>
                    <ChatModal isOpen={isChatOpen} onClose={closeChat} />
                </Suspense>
            )}
        </div>
    );
}
