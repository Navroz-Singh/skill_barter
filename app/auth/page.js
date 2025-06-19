'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Logo from '@/components/ui/logo';

export default function AuthPage() {
    // State management
    const [activeTab, setActiveTab] = useState('signin');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const router = useRouter();
    const supabase = createClient();

    // Sync user to MongoDB after successful authentication
    const syncUserToMongoDB = async () => {
        try {
            const response = await fetch('/api/user/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                console.warn('MongoDB sync failed:', await response.text());
                // Don't block user flow if sync fails
            }
        } catch (error) {
            console.warn('MongoDB sync error:', error);
            // Don't block user flow if sync fails
        }
    };

    // Handle form submission for both signin and signup
    const handleAuth = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        clearMessages();

        try {
            if (activeTab === 'signup') {
                // Create new user account
                const { data, error } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: { full_name: formData.name }
                    }
                });

                if (error) throw error;

                if (data.user) {
                    // Check if email confirmation is required
                    if (!data.session) {
                        setSuccessMessage('Please check your email to confirm your account before signing in.');
                        return;
                    }

                    // Sync to MongoDB and redirect
                    await syncUserToMongoDB();
                    router.push('/dashboard');
                }
            } else {
                // Sign in existing user
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password
                });

                if (error) throw error;

                if (data.user) {
                    // Sync to MongoDB and redirect
                    await syncUserToMongoDB();
                    router.push('/dashboard');
                }
            }
        } catch (error) {
            setError(getErrorMessage(error.message));
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Google OAuth authentication
    const handleGoogleAuth = async () => {
        clearMessages();
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`
                }
            });

            if (error) throw error;
        } catch (error) {
            setError('Failed to sign in with Google. Please try again.');
            setIsLoading(false);
        }
    };

    // Helper functions
    const clearMessages = () => {
        setError('');
        setSuccessMessage('');
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        clearMessages();
    };

    const handleInputChange = (field) => (e) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
        clearMessages();
    };

    const getErrorMessage = (errorMessage) => {
        if (errorMessage.includes('Invalid login credentials')) {
            return 'Invalid email or password. Please try again.';
        }
        if (errorMessage.includes('Email not confirmed')) {
            return 'Please check your email and confirm your account before signing in.';
        }
        if (errorMessage.includes('Password should be at least')) {
            return 'Password must be at least 6 characters long.';
        }
        if (errorMessage.includes('Unable to validate email address')) {
            return 'Please enter a valid email address.';
        }
        if (errorMessage.includes('User already registered')) {
            return 'An account with this email already exists. Please sign in instead.';
        }
        return errorMessage || 'An error occurred. Please try again.';
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-4">
                {/* Header */}
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Welcome to <Logo size="text-3xl" />
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Your skill bartering platform
                    </p>
                </div>

                {/* Main Auth Form */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
                    {/* Tab Navigation */}
                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-6">
                        {['signin', 'signup'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleTabChange(tab)}
                                className={`flex-1 py-2 px-4 text-sm font-medium text-center rounded-md transition-all duration-200 ${activeTab === tab
                                        ? 'bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                {tab === 'signin' ? 'Sign In' : 'Sign Up'}
                            </button>
                        ))}
                    </div>

                    {/* Auth Form */}
                    <form onSubmit={handleAuth} className="space-y-4">
                        {/* Name field for signup only */}
                        {activeTab === 'signup' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={handleInputChange('name')}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--parrot)] focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                                    placeholder="Enter your full name"
                                    maxLength={60}
                                />
                            </div>
                        )}

                        {/* Email field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email Address *
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleInputChange('email')}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--parrot)] focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                                placeholder="Enter your email"
                            />
                        </div>

                        {/* Password field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Password *
                            </label>
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={handleInputChange('password')}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--parrot)] focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                                placeholder={activeTab === 'signup' ? 'Create a password (min 6 characters)' : 'Enter your password'}
                                minLength={6}
                            />
                            {activeTab === 'signup' && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Password must be at least 6 characters long
                                </p>
                            )}
                        </div>

                        {/* Success message */}
                        {successMessage && (
                            <div className="text-green-600 dark:text-green-400 text-sm text-center bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                                {successMessage}
                            </div>
                        )}

                        {/* Error message */}
                        {error && (
                            <div className="text-red-600 dark:text-red-400 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                                {error}
                            </div>
                        )}

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black dark:from-white dark:to-gray-200 dark:text-black dark:hover:from-gray-200 dark:hover:to-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--parrot)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100"
                        >
                            {isLoading ? (
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white dark:text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {activeTab === 'signup' ? 'Creating Account...' : 'Signing In...'}
                                </div>
                            ) : (
                                activeTab === 'signup' ? 'Create Account' : 'Sign In'
                            )}
                        </button>

                        {/* OAuth Section */}
                        <div className="mt-4">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-3 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                        Or continue with
                                    </span>
                                </div>
                            </div>

                            {/* Google Auth Button */}
                            <button
                                type="button"
                                onClick={handleGoogleAuth}
                                disabled={isLoading}
                                className="mt-4 w-full flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--parrot)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 group"
                            >
                                {/* Google Logo */}
                                <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </button>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                            By continuing, you agree to our{' '}
                            <a href="#" className="text-[var(--parrot)] hover:underline font-medium">
                                Terms of Service
                            </a>{' '}
                            and{' '}
                            <a href="#" className="text-[var(--parrot)] hover:underline font-medium">
                                Privacy Policy
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
