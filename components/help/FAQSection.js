'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { helpFAQs, getFAQsByCategory } from '@/data/helpFAQs';
import FAQItem from './FAQItem';

export default function FAQSection() {
    const [expandedCategories, setExpandedCategories] = useState({
        'Exchange Process': true,
        'Skills Management': false,
        'Account Settings': false,
        'Troubleshooting': false
    });
    const [searchTerm, setSearchTerm] = useState('');

    // Filter FAQs based on search term
    const filteredFAQs = useMemo(() => {
        if (!searchTerm.trim()) {
            return getFAQsByCategory();
        }

        const filtered = helpFAQs.filter(faq =>
            faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const categorizedFiltered = {};
        filtered.forEach(faq => {
            if (!categorizedFiltered[faq.category]) {
                categorizedFiltered[faq.category] = [];
            }
            categorizedFiltered[faq.category].push(faq);
        });

        return categorizedFiltered;
    }, [searchTerm]);

    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    return (
        <div className="space-y-4">
            {/* Search Bar - Profile input styling */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search FAQs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {/* Results */}
            {Object.keys(filteredFAQs).length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                        No FAQs found matching "{searchTerm}". Try the AI assistant for personalized help.
                    </p>
                </div>
            ) : (
                Object.entries(filteredFAQs).map(([category, faqs]) => {
                    const isExpanded = searchTerm || expandedCategories[category];
                    const Icon = isExpanded ? ChevronDown : ChevronRight;

                    return (
                        <div key={category} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                            {/* Category Header */}
                            <button
                                onClick={() => toggleCategory(category)}
                                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-lg"
                                disabled={!!searchTerm}
                            >
                                <div className="flex items-center gap-3">
                                    {!searchTerm && <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />}
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {category}
                                    </h3>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        ({faqs.length} question{faqs.length !== 1 ? 's' : ''})
                                    </span>
                                </div>
                            </button>

                            {/* FAQ Items */}
                            {isExpanded && (
                                <div className="border-t border-gray-200 dark:border-gray-800">
                                    {faqs.map((faq, index) => (
                                        <FAQItem 
                                            key={faq.id} 
                                            faq={faq} 
                                            isLast={index === faqs.length - 1}
                                            searchTerm={searchTerm}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}
