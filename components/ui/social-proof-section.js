'use client';

import { Quote, Star, TrendingUp, Users, CheckCircle } from 'lucide-react';

const SocialProofSection = () => {
    const testimonials = [
        {
            id: 1,
            name: "Alex Chen",
            skill: "Web Developer",
            quote: "Traded my coding skills for professional photography. Got amazing headshots without spending a penny!",
            rating: 5
        },
        {
            id: 2,
            name: "Maria Rodriguez",
            skill: "Graphic Designer",
            quote: "Found a marketing expert who helped grow my freelance business in exchange for logo design. Perfect trade!",
            rating: 5
        },
        {
            id: 3,
            name: "James Wilson",
            skill: "Content Writer",
            quote: "Exchanged copywriting for Spanish lessons. Learning a new language while helping others - brilliant concept!",
            rating: 5
        }
    ];

    const trustMetrics = [
        {
            icon: CheckCircle,
            number: "5,200+",
            label: "Successful Exchanges"
        },
        {
            icon: Star,
            number: "4.9/5",
            label: "User Satisfaction"
        },
        {
            icon: TrendingUp,
            number: "95%",
            label: "Completion Rate"
        }
    ];

    return (
        <section className="relative bg-white dark:bg-gray-900 pt-8 pb-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="space-y-6">

                    {/* Section Header */}
                    <div className="text-center">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
                            Trusted by Thousands
                        </h2>
                        <p className="text-lg sm:text-xl text-[var(--parrot)] mt-2">
                            Real stories from our skill trading community
                        </p>
                    </div>

                    {/* Community Highlight Banner */}
                    <div className="bg-gray-900 dark:bg-white rounded-lg p-5 text-center">
                        <div className="flex items-center justify-center mb-2">
                            <Users className="w-6 h-6 text-white dark:text-gray-900 mr-3" />
                            <span className="text-xl font-bold text-white dark:text-gray-900">
                                Join 10,000+ Skill Traders
                            </span>
                        </div>
                        <p className="text-base text-gray-300 dark:text-gray-600">
                            Growing community of professionals exchanging skills daily
                        </p>
                    </div>

                    {/* Testimonials Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        {testimonials.map((testimonial) => (
                            <div
                                key={testimonial.id}
                                className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300"
                            >
                                {/* Quote Icon */}
                                <div className="flex items-start mb-4">
                                    <Quote className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3 mt-1 flex-shrink-0" />
                                    <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                                        "{testimonial.quote}"
                                    </p>
                                </div>

                                {/* User Info and Rating */}
                                <div className="flex items-center justify-between mt-4">
                                    <div>
                                        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                                            {testimonial.name}
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {testimonial.skill}
                                        </p>
                                    </div>

                                    {/* Star Rating */}
                                    <div className="flex items-center">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Trust Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        {trustMetrics.map((metric, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-gray-900 rounded-lg p-5 text-center border border-gray-200 dark:border-gray-700"
                            >
                                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <metric.icon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                                </div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {metric.number}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {metric.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SocialProofSection;
