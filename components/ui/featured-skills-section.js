'use client';

import { ArrowRight, Star, Clock, User, Code, Palette, Briefcase, Globe, Camera, Music, Wrench, BookOpen } from 'lucide-react';

const FeaturedSkillsSection = () => {
    const categories = [
        { name: "Technology", icon: Code, count: "450+" },
        { name: "Design", icon: Palette, count: "320+" },
        { name: "Business", icon: Briefcase, count: "280+" },
        { name: "Language", icon: Globe, count: "190+" },
        { name: "Photography", icon: Camera, count: "150+" },
        { name: "Music", icon: Music, count: "120+" },
        { name: "Handcraft", icon: Wrench, count: "95+" },
        { name: "Education", icon: BookOpen, count: "85+" }
    ];

    const popularSkills = [
        {
            id: 1,
            title: "React Development",
            category: "Technology",
            rating: 4.8,
            reviews: 24,
            available: true,
            provider: "Sarah M."
        },
        {
            id: 2,
            title: "Logo Design",
            category: "Design",
            rating: 4.9,
            reviews: 18,
            available: true,
            provider: "Mike R."
        },
        {
            id: 3,
            title: "Content Writing",
            category: "Business",
            rating: 4.7,
            reviews: 31,
            available: false,
            provider: "Emma K."
        },
        {
            id: 4,
            title: "Spanish Translation",
            category: "Language",
            rating: 5.0,
            reviews: 12,
            available: true,
            provider: "Carlos V."
        },
        {
            id: 5,
            title: "Social Media Strategy",
            category: "Business",
            rating: 4.6,
            reviews: 22,
            available: true,
            provider: "Alex T."
        },
        {
            id: 6,
            title: "UI/UX Design",
            category: "Design",
            rating: 4.8,
            reviews: 16,
            available: false,
            provider: "Lisa P."
        },
        {
            id: 7,
            title: "Python Programming",
            category: "Technology",
            rating: 4.9,
            reviews: 28,
            available: true,
            provider: "David L."
        },
        {
            id: 8,
            title: "Portrait Photography",
            category: "Photography",
            rating: 4.7,
            reviews: 14,
            available: true,
            provider: "Nina S."
        }
    ];

    return (
        <section className="relative bg-white dark:bg-gray-900 pt-8 pb-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="space-y-6">

                    {/* Section Header */}
                    <div className="text-center">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
                            Featured Skills
                        </h2>
                        <p className="text-lg sm:text-xl text-[var(--parrot)] mt-2">
                            Discover popular skills and categories
                        </p>
                    </div>

                    {/* Categories Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                        {categories.map((category) => (
                            <div
                                key={category.name}
                                className="bg-white dark:bg-gray-900 rounded-lg p-4 text-center border hover:border-[var(--parrot)] border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 cursor-pointer hover:scale-105"
                            >
                                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <category.icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                                </div>
                                <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                                    {category.name}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {category.count}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Popular Skills */}
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            Popular Skills
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {popularSkills.map((skill) => (
                                <div
                                    key={skill.id}
                                    className="bg-white dark:bg-gray-900 rounded-lg p-4 border hover:border-[var(--parrot)] border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 cursor-pointer"
                                >
                                    {/* Skill Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h4 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-1">
                                                {skill.title}
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {skill.category}
                                            </p>
                                        </div>

                                        {/* Availability Status */}
                                        <div className={`flex items-center text-xs px-2 py-1 rounded-full ${skill.available
                                                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                                : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                                            }`}>
                                            <Clock className="w-3 h-3 mr-1" />
                                            {skill.available ? 'Available' : 'Busy'}
                                        </div>
                                    </div>

                                    {/* Rating and Provider */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                            <span className="text-sm text-gray-700 dark:text-gray-300 ml-1">
                                                {skill.rating} ({skill.reviews})
                                            </span>
                                        </div>

                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                            <User className="w-3 h-3 mr-1" />
                                            {skill.provider}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Browse All CTA */}
                    <div className="text-center pt-4">
                        <button className="cursor-pointer bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center mx-auto">
                            Browse All Skills
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FeaturedSkillsSection;
