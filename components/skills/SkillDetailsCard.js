// components/skills/SkillDetailsCard.js
'use client';

import { Star, Eye, RotateCcw, Timer, Building, Monitor, Globe, MapPin, Calendar, CheckCircle, Clock, ArrowRightLeft, DollarSign } from 'lucide-react';
import ImageCarousel from '@/components/skills/ImageCarousel';

export default function SkillDetailsCard({ skillData }) {
    // Helper functions
    const getDeliveryIcon = (method) => {
        switch (method) {
            case 'In-person':
                return <Building className="w-5 h-5" />
            case 'Online':
                return <Monitor className="w-5 h-5" />
            case 'Both':
                return <Globe className="w-5 h-5" />
            default:
                return <Globe className="w-5 h-5" />
        }
    }

    const getLevelColor = (level) => {
        switch (level) {
            case 'Beginner': return 'text-emerald-700 bg-emerald-100 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300'
            case 'Intermediate': return 'text-amber-700 bg-amber-100 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300'
            case 'Advanced': return 'text-orange-700 bg-orange-100 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300'
            case 'Expert': return 'text-red-700 bg-red-100 border-red-300 dark:bg-red-900/30 dark:text-red-300'
            default: return 'text-gray-700 bg-gray-100 border-gray-300 dark:bg-gray-800 dark:text-gray-300'
        }
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    return (
        <div className="lg:col-span-2 space-y-6">
            {/* SKILL HEADER */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                            {skillData.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-3">
                            <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-full border border-gray-200 dark:border-gray-700">
                                {skillData.category}
                            </span>

                            <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full border ${getLevelColor(skillData.level)}`}>
                                <Star className="w-4 h-4" />
                                {skillData.level}
                            </span>

                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-semibold rounded-full ${skillData.isAvailable
                                ? 'bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/30 dark:text-red-300'
                                }`}>
                                {skillData.isAvailable ? (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        Available
                                    </>
                                ) : (
                                    <>
                                        <Clock className="w-4 h-4" />
                                        Busy
                                    </>
                                )}
                            </span>
                        </div>
                    </div>
                </div>

                {/* SKILL STATS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                            <Eye className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{skillData.viewCount || 0}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Views</div>
                    </div>

                    <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                            <RotateCcw className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{skillData.exchangeCount || 0}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Exchanges</div>
                    </div>

                    <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                            {getDeliveryIcon(skillData.deliveryMethod)}
                        </div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{skillData.deliveryMethod || 'Both'}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Delivery</div>
                    </div>

                    <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                            <Timer className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{skillData.estimatedDuration || 'Flexible'}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Duration</div>
                    </div>
                </div>
            </div>

            {/* SKILL IMAGES CAROUSEL */}
            {skillData.images && skillData.images.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Skill Gallery</h2>
                    <ImageCarousel 
                        images={skillData.images} 
                        title={skillData.title}
                    />
                </div>
            )}

            {/* SKILL DESCRIPTION */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">About This Skill</h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                    {skillData.description}
                </p>
            </div>

            {/* EXCHANGE PREFERENCES */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Exchange Preferences</h2>
                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wide">
                            💼 What I'm looking for in exchange:
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            <div className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <ArrowRightLeft className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-green-700 dark:text-green-300">Skills Exchange</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <DollarSign className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Payment</span>
                            </div>
                        </div>
                    </div>

                    {skillData.location && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <MapPin className="w-5 h-5" />
                            <span className="font-medium">{skillData.location}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="w-5 h-5" />
                        <span className="font-medium">Posted on {formatDate(skillData.createdAt)}</span>
                    </div>
                </div>
            </div>

            {/* TAGS */}
            {skillData.tags && skillData.tags.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Tags</h2>
                    <div className="flex flex-wrap gap-2">
                        {skillData.tags.map((tag, index) => (
                            <span
                                key={index}
                                className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-lg border border-blue-200 dark:border-blue-800"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
