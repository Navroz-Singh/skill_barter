// app/admin/disputes/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Users,
  Calendar,
  Eye
} from 'lucide-react';

export default function AdminDisputesPage() {
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    status: 'all',
    page: 1,
    limit: 10
  });
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchExchangesWithDisputes();
  }, [filters]);

  const fetchExchangesWithDisputes = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        status: filters.status
      });

      const response = await fetch(`/api/admin/disputes/exchanges?${queryParams}`);
      const data = await response.json();
      
      if (response.ok) {
        setExchanges(data.exchanges);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching exchanges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleExchangeClick = (exchangeId) => {
    router.push(`/admin/disputes/exchange/${exchangeId}`);
  };

  const getStatusColor = (openCount, resolvedCount) => {
    if (openCount > 0) return 'text-red-600 bg-red-50 border-red-200';
    if (resolvedCount > 0) return 'text-green-600 bg-green-50 border-green-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const filteredExchanges = exchanges.filter(exchange => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      exchange.initiatorOffer?.skillTitle?.toLowerCase().includes(searchLower) ||
      exchange.recipientOffer?.skillTitle?.toLowerCase().includes(searchLower) ||
      exchange.initiator?.userId?.name?.toLowerCase().includes(searchLower) ||
      exchange.recipient?.userId?.name?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading disputes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dispute Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage and resolve skill exchange disputes
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {pagination.total} total exchanges
          </span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search exchanges, skills, or users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange({ status: e.target.value })}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="open">Open Disputes</option>
              <option value="resolved">Resolved Only</option>
            </select>
          </div>

          {/* Items per page */}
          <select
            value={filters.limit}
            onChange={(e) => handleFilterChange({ limit: parseInt(e.target.value) })}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>

      {/* Exchanges List */}
      <div className="space-y-4">
        {filteredExchanges.map((exchange) => (
          <div
            key={exchange._id}
            onClick={() => handleExchangeClick(exchange._id)}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {exchange.initiatorOffer?.skillTitle || 'Unknown Skill'} ↔ {exchange.recipientOffer?.skillTitle || 'Unknown Skill'}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>
                      {exchange.initiator?.userId?.name || 'Unknown'} & {exchange.recipient?.userId?.name || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(exchange.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Dispute Status */}
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(exchange.openDisputeCount, exchange.resolvedDisputeCount)}`}>
                  {exchange.openDisputeCount > 0 
                    ? `${exchange.openDisputeCount} Open`
                    : exchange.resolvedDisputeCount > 0 
                      ? `${exchange.resolvedDisputeCount} Resolved`
                      : 'No Disputes'
                  }
                </div>

                {/* View Button */}
                <button className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors">
                  <Eye className="w-4 h-4" />
                  View
                </button>
              </div>
            </div>

            {/* Dispute Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>{exchange.disputeCount}</strong> total disputes
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>{exchange.openDisputeCount}</strong> need resolution
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>{exchange.resolvedDisputeCount}</strong> resolved
                </span>
              </div>
            </div>

            {/* Recent Dispute */}
            {exchange.recentDispute && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Latest dispute:</strong> Raised by {exchange.recentDispute.raisedByName} on {new Date(exchange.recentDispute.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                  {exchange.recentDispute.description}
                </p>
              </div>
            )}
          </div>
        ))}

        {filteredExchanges.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'No exchanges found matching your search.' : 'No exchanges with disputes found.'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
          </p>
          
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
  );
}
