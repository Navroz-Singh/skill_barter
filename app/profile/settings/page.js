// app/profile/settings/page.js

'use client';

import { useState, useEffect } from 'react';
import { Loader, Save, Eye, EyeOff, Trash2, Key, PauseCircle, PlayCircle } from 'lucide-react';

export default function SettingsPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deactivating, setDeactivating] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        avatar: '',
        bio: '',
        location: '',
        preferences: {
            privacy: {
                showEmail: false,
                showLocation: true,
            }
        }
    });

    // Fetch user data
    const fetchUserData = async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await fetch('/api/user/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!res.ok) throw new Error('Failed to fetch user data');

            const { user } = await res.json();
            setUser(user);

            // Populate form with user data
            setFormData({
                name: user.name || '',
                avatar: user.avatar || '',
                bio: user.bio || '',
                location: user.location || '',
                preferences: {
                    privacy: {
                        showEmail: user.preferences?.privacy?.showEmail || false,
                        showLocation: user.preferences?.privacy?.showLocation || true,
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching user data:', error);
            setError('Failed to load user data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Load data on mount
    useEffect(() => {
        fetchUserData();
    }, []);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle privacy toggle changes
    const handlePrivacyToggle = (setting) => {
        setFormData(prev => ({
            ...prev,
            preferences: {
                ...prev.preferences,
                privacy: {
                    ...prev.preferences.privacy,
                    [setting]: !prev.preferences.privacy[setting]
                }
            }
        }));
    };

    // Save profile changes
    const handleSaveProfile = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError(null);
            setSuccess(false);

            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error('Failed to update profile');

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error('Error updating profile:', error);
            setError('Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Handle account deactivation
    const handleDeactivateAccount = async () => {
        if (deactivating) return;
        setDeactivating(true);
        try {
            const res = await fetch('/api/user/deactivate', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isActive: false }),
            });

            if (!res.ok) throw new Error('Failed to deactivate account');

            // Update user state to reflect deactivation
            setUser(prev => ({ ...prev, isActive: false }));
            setSuccess('Account deactivated successfully. You can reactivate it anytime.');
            setTimeout(() => setSuccess(false), 5000);
        } catch (error) {
            console.error('Error deactivating account:', error);
            setError('Failed to deactivate account. Please try again.');
        } finally {
            setDeactivating(false);
            setShowDeactivateConfirm(false);
        }
    };

    // Handle account reactivation
    const handleReactivateAccount = async () => {
        try {
            setDeactivating(true);
            const res = await fetch('/api/user/deactivate', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isActive: true }),
            });

            if (!res.ok) throw new Error('Failed to reactivate account');

            // Update user state to reflect reactivation
            setUser(prev => ({ ...prev, isActive: true }));
            setSuccess('Account reactivated successfully. Welcome back!');
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error('Error reactivating account:', error);
            setError('Failed to reactivate account. Please try again.');
        } finally {
            setDeactivating(false);
        }
    };

    // Handle account deletion
    const handleDeleteAccount = async () => {
        if (deleting) return;
        setDeleting(true);
        try {
            const res = await fetch('/api/user/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!res.ok) throw new Error('Failed to delete account');

            // Redirect to home page
            setTimeout(() => {
                window.location.href = '/';
            }, 500);
        } catch (error) {
            console.error('Error deleting account:', error);
            setError('Failed to delete account. Please try again.');
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <Loader className="h-8 w-8 animate-spin text-gray-600 dark:text-gray-400 mx-auto" />
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Settings
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Manage your profile information, privacy settings, and account preferences
                </p>
            </div>

            {/* Account Status Alert */}
            {user && !user.isActive && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <PauseCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        <div>
                            <p className="text-amber-800 dark:text-amber-300 font-medium">Account Deactivated</p>
                            <p className="text-amber-700 dark:text-amber-400 text-sm">
                                Your account is currently deactivated. Your profile is hidden and exchanges are paused.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Success/Error Messages */}
            {success && (
                <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <p className="text-gray-900 dark:text-white font-medium">{typeof success === 'string' ? success : 'Settings saved successfully!'}</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-8">
                {/* Profile Information Section */}
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                        Profile Information
                    </h2>

                    <div className="space-y-6">
                        {/* Current Avatar Display */}
                        <div className="flex items-center gap-4">
                            <img
                                src={formData.avatar || '/default-avatar.png'}
                                alt="Profile avatar"
                                className="h-16 w-16 rounded-full border-2 border-gray-200 dark:border-gray-700"
                            />
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Profile Photo</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Update your avatar URL below</p>
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    maxLength={60}
                                    required
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Avatar URL
                                </label>
                                <input
                                    type="url"
                                    id="avatar"
                                    name="avatar"
                                    value={formData.avatar}
                                    onChange={handleInputChange}
                                    placeholder="https://example.com/avatar.jpg"
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Bio
                            </label>
                            <textarea
                                id="bio"
                                name="bio"
                                value={formData.bio}
                                onChange={handleInputChange}
                                maxLength={500}
                                rows={3}
                                placeholder="Tell others about yourself..."
                                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {formData.bio.length}/500 characters
                            </p>
                        </div>

                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Location
                            </label>
                            <input
                                type="text"
                                id="location"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                maxLength={100}
                                placeholder="City, Country"
                                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                            />
                        </div>

                        {/* Read-only fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Email cannot be changed here. Manage through account settings.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Member Since
                                </label>
                                <input
                                    type="text"
                                    value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Privacy Settings Section */}
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                        Privacy Settings
                    </h2>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Show Email Address</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Display your email address on your public profile</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handlePrivacyToggle('showEmail')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.preferences.privacy.showEmail
                                    ? 'bg-gray-900 dark:bg-gray-100'
                                    : 'bg-gray-200 dark:bg-gray-700'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.preferences.privacy.showEmail ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Show Location</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Display your location on your public profile</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handlePrivacyToggle('showLocation')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.preferences.privacy.showLocation
                                    ? 'bg-gray-900 dark:bg-gray-100'
                                    : 'bg-gray-200 dark:bg-gray-700'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.preferences.privacy.showLocation ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {saving ? (
                            <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>

            {/* Account Management Section */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Account Management
                </h2>

                <div className="space-y-4">
                    {/* Change Password */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Change Password</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Update your account password</p>
                        </div>
                        <a
                            href="/auth/reset-password"
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            <Key className="h-4 w-4" />
                            Change Password
                        </a>
                    </div>

                    {/* Deactivate/Reactivate Account */}
                    <div className={`flex items-center justify-between p-4 border rounded-lg ${user?.isActive
                        ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'
                        : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                        }`}>
                        <div>
                            <h3 className={`text-sm font-medium ${user?.isActive
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-green-600 dark:text-green-400'
                                }`}>
                                {user?.isActive ? 'Deactivate Account' : 'Reactivate Account'}
                            </h3>
                            <p className={`text-sm ${user?.isActive
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-green-600 dark:text-green-400'
                                }`}>
                                {user?.isActive
                                    ? 'Temporarily hide your profile and pause exchanges'
                                    : 'Restore your profile visibility and resume exchanges'
                                }
                            </p>
                        </div>
                        {user?.isActive ? (
                            <button
                                type="button"
                                onClick={() => setShowDeactivateConfirm(true)}
                                disabled={deactivating}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
                            >
                                <PauseCircle className="h-4 w-4" />
                                {deactivating ? 'Deactivating...' : 'Deactivate'}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleReactivateAccount}
                                disabled={deactivating}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                                <PlayCircle className="h-4 w-4" />
                                {deactivating ? 'Reactivating...' : 'Reactivate'}
                            </button>
                        )}
                    </div>

                    {/* Delete Account */}
                    <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
                        <div>
                            <h3 className="text-sm font-medium text-red-600 dark:text-red-400">Delete Account</h3>
                            <p className="text-sm text-red-500 dark:text-red-400">Permanently delete your account and all data</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>

            {/* Deactivate Confirmation Modal */}
            {showDeactivateConfirm && (
                <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Deactivate Account
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Are you sure you want to deactivate your account? This will:
                        </p>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 mb-6 space-y-1 list-disc list-inside">
                            <li>Hide your profile from public view</li>
                            <li>Pause all ongoing exchanges</li>
                            <li>Remove your skills from search results</li>
                            <li>Allow you to reactivate anytime</li>
                        </ul>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeactivateConfirm(false)}
                                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeactivateAccount}
                                disabled={deactivating}
                                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
                            >
                                {deactivating ? 'Deactivating...' : 'Deactivate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Delete Account
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Are you sure you want to delete your account? This action cannot be undone. All your skills, exchanges, and data will be permanently deleted.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleting}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                {deleting ? 'Deleting...' : 'Delete Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
