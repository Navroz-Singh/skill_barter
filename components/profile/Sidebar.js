// components/profile/Sidebar.js

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    LayoutDashboard,
    BookOpen,
    Repeat,
    Settings,
    HelpCircle,
    MessageSquare,
} from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: '/profile', icon: LayoutDashboard },
    { name: 'Skills', href: '/profile/skills', icon: BookOpen },
    { name: 'Exchanges', href: '/profile/exchanges', icon: Repeat },
    { name: 'Disputes', href: '/profile/disputes', icon: MessageSquare }, // NEW
    { name: 'Settings', href: '/profile/settings', icon: Settings },
    { name: 'Help', href: '/profile/help', icon: HelpCircle },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <>
            {/* Mobile sidebar backdrop */}
            <div className="lg:hidden fixed inset-0 z-40 bg-gray-600 bg-opacity-75" aria-hidden="true" />

            {/* Sidebar */}
            <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 lg:translate-x-0">
                {/* Home link */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300"
                    >
                        <Home className="h-5 w-5" />
                        Home
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="mt-5 px-3">
                    <ul className="space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href ||
                                (item.href !== '/profile' && pathname.startsWith(item.href));

                            return (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive
                                                ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                                            }`}
                                    >
                                        <item.icon className="h-5 w-5 flex-shrink-0" />
                                        {item.name}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>
        </>
    );
}
