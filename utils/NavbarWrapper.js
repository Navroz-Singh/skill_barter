'use client';

import Navbar from '@/components/Navbar';
import { usePathname } from 'next/navigation';

export default function NavbarWrapper({ children }) {
    const pathname = usePathname();
    if(pathname === '/auth') return children;
    return (
        <>
            <Navbar />
            {children}
        </>
    );
}
