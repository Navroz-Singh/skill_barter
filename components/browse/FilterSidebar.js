'use client'

import { useRef, useState } from 'react'
import {
    ChevronDown,
    ArrowUpDown,
    Folder,
    BarChart3,
    Rocket,
    Clock,
    MapPin,
    Tag,
    RefreshCw,
    Eye,
    Calendar,
    Timer,
    Trash2,
    Lightbulb,
    User
} from 'lucide-react'

// SIMPLE DISCLOSURE COMPONENT
function Disclosure({ title, icon: Icon, children, defaultOpen = false }) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <div className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {title}
                    </h3>
                </div>
                <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>
            {isOpen && (
                <div className="pb-2 px-2">
                    {children}
                </div>
            )}
        </div>
    )
}

export default function FilterSidebar({ onFilterChange }) {
    // REFS for all filters (NO STATE = NO RE-RENDERS)
    const filtersRef = useRef({
        category: '',
        level: '',
        deliveryMethod: '',
        isAvailable: '',
        sortBy: 'newest',
        exchangeCountMin: '',
        exchangeCountMax: '',
        viewCountMin: '',
        viewCountMax: '',
        location: '',
        tags: '',
        ownerName: '',
        dateRange: '',
        estimatedDuration: ''
    })

    // REF to track current selections for controlled components
    const currentSelectionsRef = useRef({
        category: '',
        level: '',
        deliveryMethod: '',
        isAvailable: '',
        dateRange: '',
        estimatedDuration: ''
    })

    // STABLE HANDLER - reads all current filter values
    const handleFilterChange = () => {
        const currentFilters = {
            category: currentSelectionsRef.current.category,
            level: currentSelectionsRef.current.level,
            deliveryMethod: currentSelectionsRef.current.deliveryMethod,
            isAvailable: currentSelectionsRef.current.isAvailable,
            sortBy: document.querySelector('select[name="sortBy"]')?.value || 'newest',
            exchangeCountMin: document.querySelector('input[name="exchangeCountMin"]')?.value || '',
            exchangeCountMax: document.querySelector('input[name="exchangeCountMax"]')?.value || '',
            viewCountMin: document.querySelector('input[name="viewCountMin"]')?.value || '',
            viewCountMax: document.querySelector('input[name="viewCountMax"]')?.value || '',
            location: document.querySelector('input[name="location"]')?.value || '',
            tags: document.querySelector('input[name="tags"]')?.value || '',
            ownerName: document.querySelector('input[name="ownerName"]')?.value || '',
            dateRange: currentSelectionsRef.current.dateRange,
            estimatedDuration: currentSelectionsRef.current.estimatedDuration
        }

        filtersRef.current = currentFilters
        onFilterChange(currentFilters)
    }

    // TOGGLE HANDLER for radio buttons (allows deselection)
    const handleRadioToggle = (value, filterName) => {
        const currentValue = currentSelectionsRef.current[filterName]

        // If same option clicked again, deselect it
        if (value === currentValue) {
            currentSelectionsRef.current[filterName] = ''
        } else {
            // New option selected, update selection
            currentSelectionsRef.current[filterName] = value
        }

        // Trigger filter change
        handleFilterChange()
    }

    // TEXT INPUT DEBOUNCE for location, tags, and owner name
    let textInputTimeout
    const handleTextInputChange = () => {
        clearTimeout(textInputTimeout)
        textInputTimeout = setTimeout(() => {
            handleFilterChange()
        }, 500)
    }

    // CLEAR ALL FILTERS
    const clearAllFilters = () => {
        document.querySelectorAll('input[type="radio"], input[type="text"], input[type="number"]').forEach(input => {
            if (input.type === 'radio') {
                input.checked = false
            } else {
                input.value = ''
            }
        })
        const sortSelect = document.querySelector('select[name="sortBy"]')
        if (sortSelect) sortSelect.value = 'newest'

        // Clear current selections tracking
        currentSelectionsRef.current = {
            category: '',
            level: '',
            deliveryMethod: '',
            isAvailable: '',
            dateRange: '',
            estimatedDuration: ''
        }

        filtersRef.current = {
            category: '',
            level: '',
            deliveryMethod: '',
            isAvailable: '',
            sortBy: 'newest',
            exchangeCountMin: '',
            exchangeCountMax: '',
            viewCountMin: '',
            viewCountMax: '',
            location: '',
            tags: '',
            ownerName: '',
            dateRange: '',
            estimatedDuration: ''
        }

        onFilterChange(filtersRef.current)
    }

    return (
        <div className="lg:w-80 flex-shrink-0">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 space-y-1 sticky top-4 max-h-[85vh] overflow-y-auto">

                {/* SORT BY - Always visible */}
                <div className="mb-3 p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <ArrowUpDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Sort By</h3>
                    </div>
                    <select
                        name="sortBy"
                        onChange={handleFilterChange}
                        defaultValue="newest"
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:border-blue-500 focus:outline-none focus:ring-0"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="mostViewed">Most Viewed</option>
                        <option value="mostExchanged">Most Exchanged</option>
                        <option value="alphabetical">A to Z</option>
                        <option value="alphabeticalDesc">Z to A</option>
                        <option value="mostPopular">Most Popular</option>
                    </select>
                </div>

                {/* CATEGORY */}
                <Disclosure title="Category" icon={Folder} defaultOpen={true}>
                    <div className="space-y-0.5 max-h-48 overflow-y-auto">
                        {['Technology', 'Design', 'Business', 'Language', 'Photography', 'Music', 'Handcraft', 'Education', 'Other'].map(category => (
                            <label key={category} className="flex items-center cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-700 py-1 px-1 rounded">
                                <input
                                    type="radio"
                                    name="category"
                                    value={category}
                                    checked={currentSelectionsRef.current.category === category}
                                    onChange={() => handleRadioToggle(category, 'category')}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-0 focus:outline-none dark:bg-gray-700 dark:border-gray-600"
                                />
                                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                    {category}
                                </span>
                            </label>
                        ))}
                    </div>
                </Disclosure>

                {/* SKILL LEVEL */}
                <Disclosure title="Skill Level" icon={BarChart3}>
                    <div className="space-y-0.5">
                        {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map(level => (
                            <label key={level} className="flex items-center cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-700 py-1 px-1 rounded">
                                <input
                                    type="radio"
                                    name="level"
                                    value={level}
                                    checked={currentSelectionsRef.current.level === level}
                                    onChange={() => handleRadioToggle(level, 'level')}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-0 focus:outline-none dark:bg-gray-700 dark:border-gray-600"
                                />
                                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                    {level}
                                </span>
                            </label>
                        ))}
                    </div>
                </Disclosure>

                {/* DELIVERY METHOD */}
                <Disclosure title="Delivery Method" icon={Rocket}>
                    <div className="space-y-0.5">
                        {['In-person', 'Online', 'Both'].map(method => (
                            <label key={method} className="flex items-center cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-700 py-1 px-1 rounded">
                                <input
                                    type="radio"
                                    name="deliveryMethod"
                                    value={method}
                                    checked={currentSelectionsRef.current.deliveryMethod === method}
                                    onChange={() => handleRadioToggle(method, 'deliveryMethod')}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-0 focus:outline-none dark:bg-gray-700 dark:border-gray-600"
                                />
                                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                    {method}
                                </span>
                            </label>
                        ))}
                    </div>
                </Disclosure>

                {/* AVAILABILITY */}
                <Disclosure title="Availability" icon={Clock}>
                    <div className="space-y-0.5">
                        <label className="flex items-center cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-700 py-1 px-1 rounded">
                            <input
                                type="radio"
                                name="isAvailable"
                                value="true"
                                checked={currentSelectionsRef.current.isAvailable === 'true'}
                                onChange={() => handleRadioToggle('true', 'isAvailable')}
                                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-0 focus:outline-none dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className="ml-2 text-sm text-green-700 dark:text-green-300">
                                Available Now
                            </span>
                        </label>
                        <label className="flex items-center cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-700 py-1 px-1 rounded">
                            <input
                                type="radio"
                                name="isAvailable"
                                value="false"
                                checked={currentSelectionsRef.current.isAvailable === 'false'}
                                onChange={() => handleRadioToggle('false', 'isAvailable')}
                                className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 focus:ring-0 focus:outline-none dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className="ml-2 text-sm text-red-700 dark:text-red-300">
                                Currently Busy
                            </span>
                        </label>
                    </div>
                </Disclosure>

                {/* LOCATION */}
                <Disclosure title="Location" icon={MapPin}>
                    <div className="space-y-2">
                        <input
                            type="text"
                            name="location"
                            placeholder="Enter city, state, or country..."
                            onInput={handleTextInputChange}
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-0"
                        />
                        <div className="flex items-center gap-1">
                            <Lightbulb className="w-3 h-3 text-gray-400" />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Search by location for in-person skills
                            </p>
                        </div>
                    </div>
                </Disclosure>

                {/* SKILL PROVIDER/OWNER NAME */}
                <Disclosure title="Skill Provider" icon={User}>
                    <div className="space-y-2">
                        <input
                            type="text"
                            name="ownerName"
                            placeholder="Search by provider name..."
                            onInput={handleTextInputChange}
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-0"
                        />
                        <div className="flex items-center gap-1">
                            <Lightbulb className="w-3 h-3 text-gray-400" />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Find skills by the provider's name
                            </p>
                        </div>
                    </div>
                </Disclosure>

                {/* TAGS */}
                <Disclosure title="Tags" icon={Tag}>
                    <div className="space-y-2">
                        <input
                            type="text"
                            name="tags"
                            placeholder="e.g., react, photoshop, cooking..."
                            onInput={handleTextInputChange}
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-0"
                        />
                        <div className="flex items-center gap-1">
                            <Lightbulb className="w-3 h-3 text-gray-400" />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Separate multiple tags with commas
                            </p>
                        </div>
                    </div>
                </Disclosure>

                {/* EXCHANGE COUNT */}
                <Disclosure title="Exchange Experience" icon={RefreshCw}>
                    <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="number"
                                name="exchangeCountMin"
                                placeholder="Min"
                                min="0"
                                onChange={handleFilterChange}
                                className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:border-blue-500 focus:outline-none focus:ring-0"
                            />
                            <input
                                type="number"
                                name="exchangeCountMax"
                                placeholder="Max"
                                min="0"
                                onChange={handleFilterChange}
                                className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:border-blue-500 focus:outline-none focus:ring-0"
                            />
                        </div>
                    </div>
                </Disclosure>

                {/* VIEW COUNT */}
                <Disclosure title="Popularity" icon={Eye}>
                    <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="number"
                                name="viewCountMin"
                                placeholder="Min views"
                                min="0"
                                onChange={handleFilterChange}
                                className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:border-blue-500 focus:outline-none focus:ring-0"
                            />
                            <input
                                type="number"
                                name="viewCountMax"
                                placeholder="Max views"
                                min="0"
                                onChange={handleFilterChange}
                                className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:border-blue-500 focus:outline-none focus:ring-0"
                            />
                        </div>
                    </div>
                </Disclosure>

                {/* DATE RANGE */}
                <Disclosure title="Recently Added" icon={Calendar}>
                    <div className="space-y-0.5">
                        {[
                            { value: 'today', label: 'Today' },
                            { value: 'week', label: 'This Week' },
                            { value: 'month', label: 'This Month' },
                            { value: '3months', label: 'Last 3 Months' }
                        ].map(({ value, label }) => (
                            <label key={value} className="flex items-center cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-700 py-1 px-1 rounded">
                                <input
                                    type="radio"
                                    name="dateRange"
                                    value={value}
                                    checked={currentSelectionsRef.current.dateRange === value}
                                    onChange={() => handleRadioToggle(value, 'dateRange')}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-0 focus:outline-none dark:bg-gray-700 dark:border-gray-600"
                                />
                                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                    {label}
                                </span>
                            </label>
                        ))}
                    </div>
                </Disclosure>

                {/* ESTIMATED DURATION */}
                <Disclosure title="Time Commitment" icon={Timer}>
                    <div className="space-y-0.5">
                        {[
                            { value: 'quick', label: 'Quick (< 1 hour)' },
                            { value: 'short', label: 'Short (1-5 hours)' },
                            { value: 'medium', label: 'Medium (5-20 hours)' },
                            { value: 'long', label: 'Long (20+ hours)' }
                        ].map(({ value, label }) => (
                            <label key={value} className="flex items-center cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-700 py-1 px-1 rounded">
                                <input
                                    type="radio"
                                    name="estimatedDuration"
                                    value={value}
                                    checked={currentSelectionsRef.current.estimatedDuration === value}
                                    onChange={() => handleRadioToggle(value, 'estimatedDuration')}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-0 focus:outline-none dark:bg-gray-700 dark:border-gray-600"
                                />
                                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                    {label}
                                </span>
                            </label>
                        ))}
                    </div>
                </Disclosure>

                {/* CLEAR ALL FILTERS */}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={clearAllFilters}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-600 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Clear All Filters
                    </button>
                </div>

                {/* FILTER TIPS */}
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" />
                        <p><strong>Pro Tips:</strong></p>
                    </div>
                    <div className="space-y-0.5 ml-4">
                        <p>• Click section headers to expand/collapse</p>
                        <p>• <strong>Click same option again to deselect it</strong></p>
                        <p>• Use multiple filters for precise results</p>
                        <p>• Location search works for in-person skills</p>
                        <p>• Tags help find specific technologies</p>
                        <p>• <strong>Search by provider name to find specific people</strong></p>
                    </div>
                </div>
            </div>
        </div>
    )
}
