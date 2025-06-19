'use client';

import { DollarSign, Users, Network, Clock } from 'lucide-react';

const ValuePropositionsSection = () => {
    const benefits = [
        {
            id: 1,
            icon: DollarSign,
            title: "No Money Required",
            description: "Pure skill exchange - trade your expertise without spending cash"
        },
        {
            id: 2,
            icon: Users,
            title: "Learn While Teaching",
            description: "Mutual growth - expand your skills while sharing what you know"
        },
        {
            id: 3,
            icon: Network,
            title: "Build Your Network",
            description: "Connect with like-minded people and grow your professional circle"
        },
        {
            id: 4,
            icon: Clock,
            title: "Flexible Scheduling",
            description: "Trade on your terms - work when it suits your schedule"
        }
    ];

    return (
        <section className="relative bg-white dark:bg-gray-900 pt-8 pb-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="space-y-6">

                    {/* Section Header */}
                    <div className="text-center">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
                            Why Choose SBart
                        </h2>
                        <p className="text-lg sm:text-xl text-[var(--parrot)] mt-2">
                            The smart way to exchange skills and services
                        </p>
                    </div>

                    {/* Benefits Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-4">
                        {benefits.map((benefit) => (
                            <div
                                key={benefit.id}
                                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 cursor-pointer hover:scale-105"
                            >
                                {/* Icon */}
                                <div className="w-16 h-16 bg-gray-900 dark:bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                                    <benefit.icon className="w-8 h-8 text-white dark:text-gray-900" />
                                </div>

                                {/* Title */}
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                                    {benefit.title}
                                </h3>

                                {/* Description */}
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {benefit.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ValuePropositionsSection;
