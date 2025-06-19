'use client';

import { Upload, Search, Handshake, ArrowRight } from 'lucide-react';

const HowItWorksSection = () => {
    const steps = [
        {
            id: 1,
            icon: Upload,
            title: "List Your Skills",
            description: "Share what services you can offer and what you need help with"
        },
        {
            id: 2,
            icon: Search,
            title: "Find Skills You Need",
            description: "Browse available services and find someone to get your work done"
        },
        {
            id: 3,
            icon: Handshake,
            title: "Make the Exchange",
            description: "Trade your expertise for theirs - no money involved, just skill swapping"
        }
    ];

    return (
        <section className="relative min-h-[40vh] bg-white dark:bg-gray-900 flex items-center justify-center pt-4 pb-4">
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 opacity-5 dark:opacity-10">
                <div className="absolute top-10 left-20 w-20 h-20 bg-gray-400 dark:bg-gray-600 rounded-full blur-2xl"></div>
                <div className="absolute bottom-20 right-20 w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-full blur-xl"></div>
                <div className="absolute top-1/2 right-1/3 w-12 h-12 bg-gray-200 dark:bg-gray-900 rounded-full blur-lg"></div>
            </div>

            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="space-y-2">

                    {/* Section Heading */}
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                        <span className="text-gray-900 dark:text-white">How It </span>
                        <span className="text-gray-700 dark:text-gray-300">Works</span>
                    </h2>

                    {/* Steps Container */}
                    <div className="pt-4">
                        <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-8">
                            {steps.map((step, index) => (
                                <div key={step.id} className="flex flex-col lg:flex-row items-center">
                                    {/* Step Card */}
                                    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 max-w-xs w-full text-center transition-all duration-300 hover:shadow-xl hover:scale-105">
                                        {/* Step Number */}
                                        <div className="w-12 h-12 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3">
                                            {step.id}
                                        </div>

                                        {/* Icon */}
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <step.icon className="w-8 h-8 text-gray-700 dark:text-gray-300" />
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                            {step.title}
                                        </h3>

                                        {/* Description */}
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            {step.description}
                                        </p>
                                    </div>

                                    {/* Flow Arrow - Only show between steps, not after last step */}
                                    {index < steps.length - 1 && (
                                        <div className="flex items-center justify-center lg:mx-4 my-4 lg:my-0">
                                            <ArrowRight className="w-6 h-6 text-gray-400 dark:text-gray-500 transform lg:rotate-0 rotate-90" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorksSection;
