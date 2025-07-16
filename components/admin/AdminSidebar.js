// components/admin/AdminSidebar.js
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    LayoutDashboard,
    MessageSquare,
    Users,
    Shield
} from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Disputes', href: '/admin/disputes', icon: MessageSquare },
    { name: 'Users', href: '/admin/users', icon: Users },
];

export default function AdminSidebar() {
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

                {/* Admin Badge */}
                <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                        <Shield className="h-4 w-4" />
                        Admin Panel
                    </div>
                </div>

                {/* Navigation */}
                <nav className="mt-5 px-3">
                    <ul className="space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href ||
                                (item.href !== '/admin' && pathname.startsWith(item.href));

                            return (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive
                                                ? 'bg-blue-600 text-white'
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
