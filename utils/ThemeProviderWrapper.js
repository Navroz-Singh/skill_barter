'use client';
import { ThemeProvider } from '@/components/Providers/ThemeProvider';

export default function ThemeProviderWrapper({ children, initialTheme }) {
    return (
        <ThemeProvider initialTheme={initialTheme}>
            {children}
        </ThemeProvider>
    );
}
