'use client'

import { useState, useRef, useEffect } from 'react'
import FilterSidebar from '@/components/browse/FilterSidebar'
import { Eye, CheckCircle, Clock, User, MapPin, Calendar, Building, Monitor, Globe, Star, Timer, RotateCcw, ArrowRightLeft, DollarSign, MessageCircle, Handshake } from 'lucide-react'

export default function BrowsePage() {
    // SINGLE STATE - only for API data
    const [skillsData, setSkillsData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [isClient, setIsClient] = useState(false)

    // REF for search input
    const searchRef = useRef(null)
    const currentFiltersRef = useRef({})

    // SIMPLE DEBOUNCE
    let searchTimeout
    const debounceSearch = () => {
        clearTimeout(searchTimeout)
        searchTimeout = setTimeout(() => {
            fetchSkills(1)
        }, 300)
    }

    // STABLE FILTER HANDLER (NO RE-RENDERS)
    const handleFilterChange = (filters) => {
        currentFiltersRef.current = filters
        fetchSkills(1) // Reset to page 1 on filter change
    }

    // API FUNCTION with enhanced filtering and sorting
    const fetchSkills = async (page = 1) => {
        setLoading(true)

        try {
            const search = searchRef.current?.value || ''
            const filters = currentFiltersRef.current || {}

            const params = new URLSearchParams()
            if (search) params.append('search', search)
            if (filters.category) params.append('category', filters.category)
            if (filters.level) params.append('level', filters.level)
            if (filters.deliveryMethod) params.append('deliveryMethod', filters.deliveryMethod)
            if (filters.isAvailable) params.append('isAvailable', filters.isAvailable)
            if (filters.location) params.append('location', filters.location)
            if (filters.tags) params.append('tags', filters.tags)
            if (filters.exchangeCountMin) params.append('exchangeCountMin', filters.exchangeCountMin)
            if (filters.exchangeCountMax) params.append('exchangeCountMax', filters.exchangeCountMax)
            if (filters.viewCountMin) params.append('viewCountMin', filters.viewCountMin)
            if (filters.viewCountMax) params.append('viewCountMax', filters.viewCountMax)
            if (filters.dateRange) params.append('dateRange', filters.dateRange)
            if (filters.ownerName) params.append('ownerName', filters.ownerName)
            if (filters.estimatedDuration) params.append('estimatedDuration', filters.estimatedDuration)
            if (filters.sortBy) params.append('sortBy', filters.sortBy)
            params.append('page', page.toString())
            params.append('limit', '12')

            const response = await fetch(`/api/skills?${params}`)
            const data = await response.json()
            console.log(data)
            if (data.success) {
                setSkillsData(data.data)
            }
        } catch (error) {
            console.error('Error fetching skills:', error)
        } finally {
            setLoading(false)
        }
    }

    const handlePageChange = (page) => {
        fetchSkills(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // INITIAL LOAD
    useEffect(() => {
        setIsClient(true)
        fetchSkills()
    }, [])

    if (!isClient) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-8">
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            Browse Skills for Exchange
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Find the skills you need and propose an exchange - offer your skills or payment in return
                        </p>
                    </div>
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300"></div>
                    </div>
                </div>
            </div>
        )
    }

    // EXCHANGE-FOCUSED SKILL CARD WITH CLEAN HOVER
    const SkillCard = ({ skill }) => {
        const getDeliveryIcon = (method) => {
            switch (method) {
                case 'In-person':
                    return <Building className="w-4 h-4" />
                case 'Online':
                    return <Monitor className="w-4 h-4" />
                case 'Both':
                    return <Globe className="w-4 h-4" />
                default:
                    return <Globe className="w-4 h-4" />
            }
        }

        const formatDate = (dateString) => {
            const date = new Date(dateString)
            const now = new Date()
            const diffTime = Math.abs(now - date)
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            if (diffDays === 1) return 'Yesterday'
            if (diffDays < 7) return `${diffDays}d ago`
            if (diffDays < 30) return `${Math.ceil(diffDays / 7)}w ago`
            return `${Math.ceil(diffDays / 30)}mo ago`
        }

        const getLevelColor = (level) => {
            switch (level) {
                case 'Beginner': return 'text-emerald-700 bg-emerald-100 border-emerald-300'
                case 'Intermediate': return 'text-amber-700 bg-amber-100 border-amber-300'
                case 'Advanced': return 'text-orange-700 bg-orange-100 border-orange-300'
                case 'Expert': return 'text-red-700 bg-red-100 border-red-300'
                default: return 'text-gray-700 bg-gray-100 border-gray-300'
            }
        }

        return (
            <div className="group relative bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer border-2 border-gray-200 dark:border-gray-700 hover:border-[var(--parrot)]">

                {/* IMAGE SECTION */}
                <div className="relative h-32 bg-gradient-to-br from-slate-100 via-gray-100 to-stone-100 dark:from-gray-800 dark:via-gray-750 dark:to-gray-700 overflow-hidden">
                    {skill.images?.[0] ? (
                        <img
                            src={skill.images[0].url}
                            alt={skill.images[0].alt || skill.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <User className="w-8 h-8 text-white" />
                            </div>
                        </div>
                    )}

                    {/* Availability Status - Top Right */}
                    <div className="absolute top-3 right-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full backdrop-blur-sm shadow-md ${skill.isAvailable
                            ? 'bg-green-100/95 text-green-800 border border-green-300'
                            : 'bg-red-100/95 text-red-800 border border-red-300'
                            }`}>
                            {skill.isAvailable ? (
                                <>
                                    <CheckCircle className="w-3 h-3" />
                                    Available
                                </>
                            ) : (
                                <>
                                    <Clock className="w-3 h-3" />
                                    Busy
                                </>
                            )}
                        </span>
                    </div>

                    {/* Exchange Success Rate - Bottom Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent h-12 flex items-end p-3">
                        <div className="flex items-center gap-3 text-white text-xs">
                            <div className="flex items-center gap-1">
                                <Handshake className="w-3 h-3" />
                                <span className="font-medium">{skill.exchangeCount || 0} exchanges</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">4.8</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CONTENT SECTION */}
                {/* CONTENT SECTION */}
                <div className="p-5">

                    {/* TITLE */}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight mb-2 line-clamp-2 transition-colors">
                        {skill.title}
                    </h3>

                    {/* Provider Info */}
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-white">
                                {skill.owner?.name?.[0] || skill.owner?.firstName?.[0] || 'U'}
                            </span>
                        </div>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {skill.owner?.name || skill.owner?.firstName || 'Anonymous'}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-md border ${getLevelColor(skill.level)}`}>
                            {skill.level}
                        </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed mb-3">
                        {skill.description}
                    </p>

                    {/* Exchange Details */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
                        <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wide">
                            💼 What I'm looking for in exchange:
                        </h4>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-md">
                                <ArrowRightLeft className="w-3 h-3 text-green-600" />
                                <span className="text-xs font-medium text-green-700 dark:text-green-300">Skills</span>
                            </div>
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                                <DollarSign className="w-3 h-3 text-blue-600" />
                                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Payment</span>
                            </div>
                        </div>
                    </div>

                    {/* CLEAN STATS WITHOUT BOXES */}
                    <div className="mb-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                {getDeliveryIcon(skill.deliveryMethod)}
                                <span className="font-medium">
                                    {skill.deliveryMethod || 'Both'}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <Timer className="w-4 h-4" />
                                <span className="font-medium">
                                    {skill.estimatedDuration || 'Flexible'}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <Eye className="w-4 h-4" />
                                <span className="font-medium">
                                    {skill.viewCount || 0} views
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <Calendar className="w-4 h-4" />
                                <span className="font-medium">
                                    {formatDate(skill.createdAt)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    {skill.location && (
                        <div className="flex items-center gap-2 mb-3 text-sm text-gray-600 dark:text-gray-400">
                            <MapPin className="w-4 h-4" />
                            <span className="font-medium">{skill.location}</span>
                        </div>
                    )}

                    {/* View Details Button */}
                    <div className="flex">
                        <button
                            onClick={() => window.location.href = `/skill/${skill._id}`}
                            className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg cursor-pointer"
                        >
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen pt-8 bg-white dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                <div className="mb-4">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        Browse Skills for Exchange
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Find the skills you need and propose an exchange - offer your skills or payment in return
                    </p>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <input
                            ref={searchRef}
                            type="text"
                            placeholder="Search for skills you need (e.g., web development, graphic design, tutoring)..."
                            onInput={debounceSearch}
                            className="w-full px-4 py-3 pl-12 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                        />
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Filter Sidebar */}
                    <FilterSidebar onFilterChange={handleFilterChange} />

                    {/* Main Content */}
                    <div className="flex-1">

                        {skillsData && (
                            <div className="mb-6 flex items-center justify-between">
                                <p className="text-gray-600 dark:text-gray-400">
                                    Found <span className="font-semibold text-gray-900 dark:text-white">{skillsData.total}</span> skills available for exchange •
                                    Page <span className="font-semibold text-gray-900 dark:text-white">{skillsData.currentPage}</span> of <span className="font-semibold text-gray-900 dark:text-white">{skillsData.totalPages}</span>
                                </p>
                            </div>
                        )}

                        {loading && (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <p className="mt-2 text-gray-600 dark:text-gray-400">Finding skills for exchange...</p>
                            </div>
                        )}

                        {!loading && skillsData?.skills && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-8">
                                {skillsData.skills.map(skill => (
                                    <SkillCard key={skill._id} skill={skill} />
                                ))}
                            </div>
                        )}

                        {!loading && skillsData?.skills?.length === 0 && (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ArrowRightLeft className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No skills available for exchange</h3>
                                <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filters to find the skills you need</p>
                            </div>
                        )}

                        {!loading && skillsData && skillsData.totalPages > 1 && (
                            <div className="flex items-center justify-center space-x-2">

                                <button
                                    onClick={() => handlePageChange(skillsData.currentPage - 1)}
                                    disabled={skillsData.currentPage === 1}
                                    className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Previous
                                </button>

                                {Array.from({ length: skillsData.totalPages }, (_, i) => i + 1).map(pageNum => (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`px-4 py-2 text-sm rounded-xl transition-colors ${pageNum === skillsData.currentPage
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                ))}

                                <button
                                    onClick={() => handlePageChange(skillsData.currentPage + 1)}
                                    disabled={skillsData.currentPage === skillsData.totalPages}
                                    className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
