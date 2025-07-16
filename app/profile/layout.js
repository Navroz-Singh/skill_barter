// app/profile/layout.js
import Sidebar from '@/components/profile/Sidebar';

export default function ProfileLayout({ children }) {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            <div className="flex">
                {/* Sidebar */}
                <Sidebar />

                {/* Main Content */}
                <main className="flex-1 lg:pl-64">
                    <div className="px-4 py-6 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-7xl">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
