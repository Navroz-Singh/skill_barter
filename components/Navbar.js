// app/ui/navbar.jsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Bell } from 'lucide-react';
import Logo from '@/components/ui/logo';
import ThemeToggleButton from '@/components/ui/ThemeToggleButton';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navRoutes = [
    { name: 'Home', href: '/' },
    { name: 'Browse', href: '/browse' },
    { name: 'My Skills', href: '/my-skills', authRequired: true },
    { name: 'Exchanges', href: '/exchanges', authRequired: true },
    { name: 'About', href: '/about' },
];

export default function Navbar() {
    const pathname = usePathname();
    const { user, loading } = useUser();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    // Mock notification data - replace with real data from your backend
    const notifications = [
        { id: 1, message: "New skill exchange request from John D.", time: "2 min ago", unread: true },
        { id: 2, message: "Your React Development skill was viewed 5 times", time: "1 hour ago", unread: true },
        { id: 3, message: "Exchange completed with Sarah M.", time: "3 hours ago", unread: false },
    ];

    const unreadCount = notifications.filter(n => n.unread).length;

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setIsProfileMenuOpen(false);
        router.push('/');
    };

    const toggleProfileMenu = () => {
        setIsProfileMenuOpen(!isProfileMenuOpen);
    };

    const toggleNotifications = () => {
        setIsNotificationOpen(!isNotificationOpen);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <nav className="bg-white fixed top-0 left-0 right-0 z-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-2xs transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center h-14 w-full">

                    {/* Logo on the left */}
                    <div className="flex-shrink-0">
                        <Logo size="text-3xl" />
                    </div>

                    {/* Navigation routes in the center-right */}
                    <div className="hidden md:flex flex-1 justify-center pl-16 items-center space-x-6">
                        {navRoutes.map((route) => {
                            if (route.authRequired && !user) return null;

                            return (
                                <Link
                                    key={route.href}
                                    href={route.href}
                                    className={`relative px-3 py-2 text-md font-medium transition-colors duration-200 group ${pathname === route.href
                                        ? 'text-black dark:text-white'
                                        : 'text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white'
                                        }`}
                                >
                                    {route.name}

                                    <span
                                        className={`absolute bottom-[-0.5rem] left-0 h-0.5 transition-all duration-300 ease-out ${pathname === route.href
                                            ? 'w-full bg-black dark:bg-white'
                                            : 'w-0 group-hover:w-full bg-[var(--parrot)]'
                                            }`}
                                    />
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right side - Notifications, Theme toggle and user actions */}
                    <div className="flex items-center space-x-3">

                        <div className="flex-shrink-0">
                            <ThemeToggleButton />
                        </div>

                        {/* Notification Button - Only show when user is logged in */}
                        {user && (
                            <div className="relative">
                                <button
                                    onClick={toggleNotifications}
                                    className="relative p-2 cursor-pointer rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                                    aria-label="Notifications"
                                >
                                    <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {/* Notification Dropdown */}
                                {isNotificationOpen && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
                                        <div className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                                            Notifications
                                        </div>

                                        <div className="max-h-64 overflow-y-auto">
                                            {notifications.length > 0 ? (
                                                notifications.map((notification) => (
                                                    <div
                                                        key={notification.id}
                                                        className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer ${notification.unread ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                                            }`}
                                                    >
                                                        <p className="text-sm text-gray-900 dark:text-white">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            {notification.time}
                                                        </p>
                                                        {notification.unread && (
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full absolute right-2 top-1/2 transform -translate-y-1/2"></div>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                                    No notifications yet
                                                </div>
                                            )}
                                        </div>

                                        <div className="border-t border-gray-200 dark:border-gray-700">
                                            <button className="w-full px-4 py-2 text-sm text-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                                                View All Notifications
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}



                        {loading ? (
                            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                        ) : user ? (
                            // Authenticated user profile dropdown
                            <div className="relative">
                                <button
                                    onClick={toggleProfileMenu}
                                    className="flex items-center cursor-pointer space-x-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 group"
                                    aria-label="User profile menu"
                                >
                                    <div className="w-8 h-8 bg-gray-600 dark:bg-gray-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        {user.user_metadata?.avatar_url ? (
                                            <img
                                                src={user.user_metadata.avatar_url}
                                                alt="Profile"
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                        ) : (
                                            user.user_metadata?.full_name?.[0] || user.email[0].toUpperCase()
                                        )}
                                    </div>

                                    <svg
                                        className={`w-4 h-4 text-gray-700 dark:text-gray-300 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {isProfileMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
                                        <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                                            <p className="font-medium">{user.user_metadata?.full_name || 'User'}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                                        </div>

                                        <Link
                                            href="/dashboard"
                                            onClick={() => setIsProfileMenuOpen(false)}
                                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                                        >
                                            Dashboard
                                        </Link>

                                        <Link
                                            href="/profile"
                                            onClick={() => setIsProfileMenuOpen(false)}
                                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                                        >
                                            Profile Settings
                                        </Link>

                                        <button
                                            onClick={handleSignOut}
                                            className="block w-full cursor-pointer text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Single Log In button for unauthenticated users
                            <div className="hidden md:flex">
                                <Link
                                    href="/auth"
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-black dark:hover:text-white transition-colors duration-200 shadow-sm"
                                >
                                    Log In
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden ml-2">
                        <button
                            onClick={toggleMobileMenu}
                            className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                            aria-label="Open menu"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {navRoutes.map((route) => {
                                if (route.authRequired && !user) return null;

                                return (
                                    <Link
                                        key={route.href}
                                        href={route.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${pathname === route.href
                                            ? 'text-black dark:text-white bg-gray-100 dark:bg-gray-800'
                                            : 'text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        {route.name}
                                    </Link>
                                );
                            })}

                            {/* Mobile Log In button */}
                            {!loading && !user && (
                                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <Link
                                        href="/auth"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                                    >
                                        Log In
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Backdrop for dropdowns */}
            {(isProfileMenuOpen || isNotificationOpen) && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => {
                        setIsProfileMenuOpen(false);
                        setIsNotificationOpen(false);
                    }}
                />
            )}
        </nav>
    );
}
