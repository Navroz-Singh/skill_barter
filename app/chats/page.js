// app/chats/page.js (UPDATED)
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MessageCircle, User, Loader2, MessageSquare, Clock, MoreVertical, Trash2, X } from 'lucide-react';

const ChatsPage = () => {
    const [chatRooms, setChatRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [chatToDelete, setChatToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const router = useRouter();
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if click is inside any dropdown
            const isInsideDropdown = event.target.closest('[data-dropdown]');
            if (!isInsideDropdown && activeDropdown) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeDropdown]);

    // Fetch user's chat rooms
    useEffect(() => {
        const fetchChatRooms = async () => {
            try {
                const response = await fetch('/api/chats', {
                    cache: 'no-store'
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch chat rooms');
                }

                const data = await response.json();
                setChatRooms(data.chatRooms || []);
            } catch (err) {
                console.error('Error fetching chat rooms:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchChatRooms();
    }, []);

    // Filter chats based on search query
    const filteredChats = chatRooms.filter(chat =>
        chat.otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Format relative time
    const formatTime = (dateString) => {
        if (!dateString) return '';

        const now = new Date();
        const messageTime = new Date(dateString);
        const diffInHours = Math.floor((now - messageTime) / (1000 * 60 * 60));

        if (diffInHours < 1) {
            const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));
            return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
        } else if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
        }
    };

    // Navigate to specific chat
    const openChat = (chatRoomId) => {
        // If a dropdown or modal is open, do not navigate
        if (activeDropdown || showDeleteModal) return;
        router.push(`/chats/chat/${chatRoomId}`);
    };

    // Handle dropdown toggle
    const toggleDropdown = (e, chatRoomId) => {
        e.stopPropagation(); // Prevent opening chat
        setActiveDropdown(activeDropdown === chatRoomId ? null : chatRoomId);
    };

    // Handle delete click
    const handleDeleteClick = (e, chat) => {
        e.preventDefault();
        e.stopPropagation();

        // Small delay to ensure click outside doesn't interfere
        setTimeout(() => {
            setChatToDelete(chat);
            setShowDeleteModal(true);
            setActiveDropdown(null);
        }, 10);
    };

    // Confirm delete
    const confirmDelete = async () => {
        if (!chatToDelete) return;

        setDeleting(true);
        const chatRoomId = chatToDelete.chatRoomId;

        try {
            // Optimistic update - remove from UI immediately
            setChatRooms(prev => prev.filter(chat => chat.chatRoomId !== chatRoomId));

            const response = await fetch(`/api/chats/${chatRoomId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete chat');
            }

            // Success - chat already removed from UI
            console.log('Chat deleted successfully');

        } catch (error) {
            console.error('Error deleting chat:', error);

            // Restore chat to UI on error
            setChatRooms(prev => [...prev, chatToDelete]);

            // Show error message
            alert('Failed to delete chat. Please try again.');
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
            setChatToDelete(null);
        }
    };

    // Cancel delete
    const cancelDelete = () => {
        setShowDeleteModal(false);
        setChatToDelete(null);
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 pt-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
                        My Conversations
                    </h1>
                    <p className="text-lg sm:text-xl text-[var(--parrot)] mt-2">
                        {chatRooms.length > 0 ? `${chatRooms.length} active conversations` : 'Start connecting with skill traders'}
                    </p>
                </div>

                {/* Search Bar */}
                <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-[var(--parrot)] transition-colors duration-300"
                    />
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center space-y-4">
                            <Loader2 className="w-8 h-8 text-[var(--parrot)] animate-spin mx-auto" />
                            <p className="text-base text-gray-600 dark:text-gray-400">Loading conversations...</p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
                        <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                            Failed to load conversations
                        </h3>
                        <p className="text-red-700 dark:text-red-300">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && filteredChats.length === 0 && (
                    <div className="text-center py-12">
                        <MessageSquare className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            {searchQuery ? 'No conversations found' : 'No conversations yet'}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                            {searchQuery
                                ? `No conversations match "${searchQuery}". Try a different search term.`
                                : 'Start browsing skills and send messages to begin trading your expertise!'
                            }
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => router.push('/browse')}
                                className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                                Browse Skills
                            </button>
                        )}
                    </div>
                )}

                {/* Chat List */}
                {!loading && !error && filteredChats.length > 0 && (
                    <div className="space-y-4">
                        {filteredChats.map((chat) => (
                            <div
                                key={chat.chatRoomId}
                                onClick={() => openChat(chat.chatRoomId)}
                                className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-[var(--parrot)] hover:shadow-md transition-all duration-300 cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        {chat.otherUser?.profileImage ? (
                                            <img
                                                src={chat.otherUser.profileImage}
                                                alt={chat.otherUser.name}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                                <User className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                            </div>
                                        )}

                                        {/* Online Status */}
                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 ${chat.otherUser?.isOnline ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-600'
                                            }`} />

                                        {/* Unread Badge */}
                                        {chat.unreadCount > 0 && (
                                            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                                                {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                                            </div>
                                        )}
                                    </div>

                                    {/* Chat Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                                                {chat.otherUser?.name || 'Unknown User'}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{formatTime(chat.lastMessage?.createdAt)}</span>
                                                </div>

                                                {/* 3-dots Menu */}
                                                <div className="relative" data-dropdown>
                                                    <button
                                                        onClick={(e) => toggleDropdown(e, chat.chatRoomId)}
                                                        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                    >
                                                        <MoreVertical className="w-4 h-4 cursor-pointer text-gray-500 dark:text-gray-400" />
                                                    </button>

                                                    {/* Dropdown Menu */}
                                                    {activeDropdown === chat.chatRoomId && (
                                                        <div
                                                            className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-10"
                                                            data-dropdown // ✅ Add this attribute
                                                        >
                                                            <button
                                                                onClick={(e) => handleDeleteClick(e, chat)}
                                                                className="w-33 px-4 py-2 text-left cursor-pointer text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Delete Chat
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Last Message Preview */}
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1 mr-4">
                                                {chat.lastMessage ? (
                                                    <>
                                                        <span className={chat.lastMessage.senderId === chat.otherUser?.id ? 'font-normal' : 'font-medium'}>
                                                            {chat.lastMessage.senderId === chat.otherUser?.id ? '' : 'You: '}
                                                        </span>
                                                        {chat.lastMessage.content}
                                                    </>
                                                ) : (
                                                    <span className="italic">No messages yet</span>
                                                )}
                                            </p>

                                            {/* Message Count */}
                                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                <MessageCircle className="w-3 h-3" />
                                                <span>{chat.messageCount}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                                    <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Delete Chat
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        This action cannot be undone
                                    </p>
                                </div>
                            </div>

                            <p className="text-gray-700 dark:text-gray-300 mb-6">
                                Are you sure you want to delete your chat with <strong>{chatToDelete?.otherUser?.name}</strong>?
                                This will only remove the chat from your side.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={cancelDelete}
                                    disabled={deleting}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={deleting}
                                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {deleting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatsPage;
