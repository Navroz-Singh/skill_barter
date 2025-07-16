// app/admin/users/page.js
'use client';

import { useState, useEffect } from 'react';
import {
    Users,
    Shield,
    Mail,
    Star,
    Check,
    X,
    Search,
    Filter,
    Calendar,
    Activity,
    Eye,
    TrendingUp,
    UserCheck,
    UserX
} from 'lucide-react';

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        search: ''
    });
    const [pagination, setPagination] = useState({});
    const [updatingUser, setUpdatingUser] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, [filters.page, filters.limit]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);

            const queryParams = new URLSearchParams({
                page: filters.page.toString(),
                limit: filters.limit.toString(),
                search: filters.search
            });

            const response = await fetch(`/api/admin/users?${queryParams}`);
            const data = await response.json();
            if (response.ok) {
                setUsers(data.users);
                console.log(data.users);
                setPagination(data.pagination);
            } else {
                setError(data.error || 'Failed to fetch users');
            }
        } catch (err) {
            setError('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
        fetchUsers();
    };

    const handlePageChange = (page) => {
        setFilters(prev => ({ ...prev, page }));
    };

    const toggleAdmin = async (userId, isCurrentlyAdmin) => {
        try {
            setUpdatingUser(userId);

            const response = await fetch(`/api/admin/users/${userId}/toggle-admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isAdmin: !isCurrentlyAdmin })
            });

            const data = await response.json();

            if (response.ok) {
                await fetchUsers();
                alert(data.message);
            } else {
                alert(data.error || 'Failed to update admin status');
            }
        } catch (err) {
            alert('Failed to update admin status');
        } finally {
            setUpdatingUser(null);
        }
    };

    const toggleActive = async (userId, isCurrentlyActive) => {
        try {
            setUpdatingUser(userId);

            const response = await fetch(`/api/admin/users/${userId}/toggle-active`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !isCurrentlyActive })
            });

            const data = await response.json();

            if (response.ok) {
                await fetchUsers();
                alert(data.message);
            } else {
                alert(data.error || 'Failed to update active status');
            }
        } catch (err) {
            alert('Failed to update active status');
        } finally {
            setUpdatingUser(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Loading users...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    User Management
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Manage users, admin permissions, and account status
                </p>
            </div>

            {/* Search and Controls */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <form onSubmit={handleSearchSubmit} className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </form>

                    {/* Items per page */}
                    <select
                        value={filters.limit}
                        onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
                        className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value={10}>10 per page</option>
                        <option value={20}>20 per page</option>
                        <option value={50}>50 per page</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Role & Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Activity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Rating
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Joined
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {users.map((user) => (
                                <UserRow
                                    key={user._id}
                                    user={user}
                                    onToggleAdmin={toggleAdmin}
                                    onToggleActive={toggleActive}
                                    isUpdating={updatingUser === user._id}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Page {pagination.page} of {pagination.pages}
                            </span>
                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page === pagination.pages}
                                className="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {users.length === 0 && (
                <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                        {filters.search ? 'No users found matching your search.' : 'No users found.'}
                    </p>
                </div>
            )}
        </div>
    );
}

// User Row Component
function UserRow({ user, onToggleAdmin, onToggleActive, isUpdating }) {
    const isAdmin = user.adminMetadata?.isAdmin || false;

    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
            {/* User Info */}
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                        </div>
                    </div>
                </div>
            </td>

            {/* Role & Status */}
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900 dark:text-white">
                            {user.role}
                        </span>
                        {isAdmin && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                                <Shield className="w-3 h-3" />
                                Admin
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {user.isActive ? (
                            <>
                                <UserCheck className="w-3 h-3 text-green-500" />
                                <span className="text-xs text-green-600 dark:text-green-400">Active</span>
                            </>
                        ) : (
                            <>
                                <UserX className="w-3 h-3 text-red-500" />
                                <span className="text-xs text-red-600 dark:text-red-400">Inactive</span>
                            </>
                        )}
                    </div>
                </div>
            </td>

            {/* Activity */}
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="space-y-1">
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            <span>{user.skillsCount} skills</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>{user.exchangesCount} exchanges</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Eye className="w-3 h-3" />
                        <span>{user.totalViews || 0} views</span>
                    </div>
                </div>
            </td>

            {/* Rating */}
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-gray-900 dark:text-white">
                        {user.rating ? user.rating.toFixed(1) : '0.0'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({user.reviewCount || 0})
                    </span>
                </div>
            </td>

            {/* Joined */}
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
            </td>

            {/* Actions */}
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onToggleAdmin(user._id, isAdmin)}
                        disabled={isUpdating}
                        className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${isAdmin
                                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={isAdmin ? 'Remove Admin' : 'Make Admin'}
                    >
                        {isUpdating ? '...' : (isAdmin ? 'Remove Admin' : 'Make Admin')}
                    </button>

                    <button
                        onClick={() => onToggleActive(user._id, user.isActive)}
                        disabled={isUpdating}
                        className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${user.isActive
                                ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                                : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={user.isActive ? 'Deactivate User' : 'Activate User'}
                    >
                        {isUpdating ? '...' : (user.isActive ? 'Deactivate' : 'Activate')}
                    </button>
                </div>
            </td>
        </tr>
    );
}
