'use client';

import Navbar from '@/components/Navbar';
import { usePathname } from 'next/navigation';

export default function NavbarWrapper({ children }) {
    const pathname = usePathname();
    if(pathname === '/auth' || pathname.startsWith('/profile') || pathname.startsWith('/admin')) return children;
    if(pathname.includes('/negotiate')) return children;
    return (
        <>
            <Navbar />
            {children}
        </>
    );
}
