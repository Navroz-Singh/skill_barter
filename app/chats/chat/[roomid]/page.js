// app/chat/[roomId]/page.js
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/lib/socket';
import ChatWindow from '@/components/chat/ChatWindow';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

const ChatPage = () => {
    const { roomid } = useParams();
    const router = useRouter();
    const socket = useSocket();
    const roomDataRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRoomData = async () => {
            try {
                const response = await fetch(`/api/chat/${roomid}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch room data');
                }

                const data = await response.json();
                roomDataRef.current = data.room;
                setLoading(false);
            } catch (err) {
                console.error('Error fetching room data:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        if (roomid) {
            fetchRoomData();
        }
    }, [roomid]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-8 h-8 text-[var(--parrot)] animate-spin mx-auto" />
                    <p className="text-base text-gray-600 dark:text-gray-400">Loading chat...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center space-y-4 max-w-md mx-auto px-4">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Unable to load chat
                    </h2>
                    <p className="text-base text-gray-600 dark:text-gray-400">{error}</p>
                    <button
                        onClick={() => router.back()}
                        className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 rounded-lg font-semibold transition-all duration-300"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 pt-10">

            {/* Chat Window */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ChatWindow roomData={roomDataRef.current} />
            </div>
        </div>
    );
};

export default ChatPage;
