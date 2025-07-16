'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Loader, User, Bot } from 'lucide-react';
import { QUICK_ACTIONS } from '@/lib/gemini';

export default function ChatModal({ isOpen, onClose }) {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    // useRef to prevent unnecessary re-renders
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const chatContainerRef = useRef(null);

    // Mount state for portal
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Load messages from localStorage on mount
    useEffect(() => {
        if (isOpen) {
            const savedMessages = localStorage.getItem('help-chat-messages');
            if (savedMessages) {
                try {
                    setMessages(JSON.parse(savedMessages));
                } catch (error) {
                    console.error('Error loading chat messages:', error);
                    setMessages([]);
                }
            }

            // Focus input when modal opens
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    // Save messages to localStorage
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('help-chat-messages', JSON.stringify(messages));
        }
    }, [messages]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (messageText, isQuickAction = false) => {
        if (!messageText.trim() || isLoading) return;

        const userMessage = {
            role: 'user',
            content: messageText.trim(),
            timestamp: new Date().toISOString(),
            isQuickAction
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/help/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: messageText.trim(),
                    conversationHistory: messages.slice(-8)
                }),
            });

            const data = await response.json();

            if (data.success) {
                const aiMessage = {
                    role: 'assistant',
                    content: data.response,
                    timestamp: data.timestamp || new Date().toISOString()
                };
                setMessages(prev => [...prev, aiMessage]);
            } else {
                throw new Error(data.error || 'Failed to get response');
            }
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage = {
                role: 'assistant',
                content: "Sorry, I'm having trouble responding right now. Please try again or check our FAQ section.",
                timestamp: new Date().toISOString(),
                isError: true
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage(inputMessage);
    };

    const handleQuickAction = (action) => {
        sendMessage(action.prompt, true);
    };

    const clearChat = () => {
        setMessages([]);
        localStorage.removeItem('help-chat-messages');
    };

    // Don't render on server
    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
            {/* Modal - Updated with larger width and height */}
            <div className="bg-white dark:bg-gray-900 w-full h-full sm:w-[50vw] sm:h-[85vh] lg:w-[60vw] xl:w-[50vw] sm:rounded-lg border border-gray-200 dark:border-gray-800 shadow-xl flex flex-col sm:max-w-4xl">
                {/* Header - Profile header pattern */}
                <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">AI Assistant</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        {messages.length > 0 && (
                            <button
                                onClick={clearChat}
                                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                Clear
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto p-2 space-y-4"
                >
                    {messages.length === 0 && (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                            <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-sm font-medium mb-1">
                                Hi! I'm here to help you with the platform.
                            </p>
                            <p className="text-xs">
                                Ask about exchanges, skills, account settings, or anything else.
                            </p>
                        </div>
                    )}

                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {message.role === 'assistant' && (
                                <div className="flex-shrink-0">
                                    <Bot className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                                </div>
                            )}

                            <div
                                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${message.role === 'user'
                                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                                    : message.isError
                                        ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                                    }`}
                            >
                                <p className="whitespace-pre-wrap">{message.content}</p>
                                {message.isQuickAction && (
                                    <span className="text-xs opacity-70 block mt-1">Quick action</span>
                                )}
                            </div>

                            {message.role === 'user' && (
                                <div className="flex-shrink-0">
                                    <User className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                                </div>
                            )}
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-3 justify-start">
                            <Bot className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
                                <Loader className="h-4 w-4 animate-spin text-gray-600 dark:text-gray-400" />
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Actions - Profile button styling */}
                {messages.length === 0 && (
                    <div className="p-3 border-t border-gray-200 dark:border-gray-800">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">Quick actions:</p>
                        <div className="flex flex-wrap gap-2">
                            {QUICK_ACTIONS.slice(0, 3).map((action) => (
                                <button
                                    key={action.id}
                                    onClick={() => handleQuickAction(action)}
                                    disabled={isLoading}
                                    className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                                >
                                    {action.text}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input - Profile input styling */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-800">
                    <form onSubmit={handleSubmit} className="flex gap-3">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder="Ask me anything..."
                            disabled={isLoading}
                            className="flex-1 px-3 py-2 outline-none border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-1 focus:border-transparent disabled:opacity-50"
                            maxLength={1000}
                        />
                        <button
                            type="submit"
                            disabled={!inputMessage.trim() || isLoading}
                            className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
}
