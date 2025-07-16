'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function FAQItem({ faq, isLast, searchTerm = '' }) {
    const [isExpanded, setIsExpanded] = useState(!!searchTerm);

    const toggleExpanded = () => {
        setIsExpanded(prev => !prev);
    };

    // Highlight search terms
    const highlightText = (text, term) => {
        if (!term.trim()) return text;
        
        const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        
        return parts.map((part, index) => 
            regex.test(part) ? (
                <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 rounded px-1">
                    {part}
                </mark>
            ) : part
        );
    };

    const Icon = isExpanded ? ChevronDown : ChevronRight;

    return (
        <div className={`${!isLast ? 'border-b border-gray-200 dark:border-gray-800' : ''}`}>
            {/* Question */}
            <button
                onClick={toggleExpanded}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
                <div className="flex items-start gap-3 flex-1">
                    <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                    <h4 className="font-medium text-gray-900 dark:text-white leading-tight">
                        {highlightText(faq.question, searchTerm)}
                    </h4>
                </div>
            </button>

            {/* Answer */}
            {isExpanded && (
                <div className="px-6 pb-6">
                    <div className="ml-7 text-gray-600 dark:text-gray-400 leading-relaxed">
                        {highlightText(faq.answer, searchTerm)}
                    </div>
                </div>
            )}
        </div>
    );
}
