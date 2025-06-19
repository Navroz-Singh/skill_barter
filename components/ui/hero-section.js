'use client';

import { ArrowRight } from 'lucide-react';

const HeroSection = () => {

    return (
        <section className="relative min-h-[40vh] bg-white dark:bg-gray-900 flex items-center justify-center pt-16 pb-8">
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 opacity-5 dark:opacity-10">
                <div className="absolute top-10 right-20 w-20 h-20 bg-gray-300 dark:bg-gray-700 rounded-full blur-2xl"></div>
                <div className="absolute bottom-20 left-20 w-16 h-16 bg-gray-400 dark:bg-gray-600 rounded-full blur-xl"></div>
                <div className="absolute top-1/2 left-1/3 w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full blur-lg"></div>
            </div>

            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="space-y-2">

                    {/* Main Heading */}
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                        <span className="text-gray-900 dark:text-white">Trade skills, </span>
                        <span className="text-gray-700 dark:text-gray-300">build connections</span>
                    </h1>

                    {/* Subheading */}
                    <p className="text-lg sm:text-xl text-[var(--parrot)] max-w-2xl mx-auto">
                        Exchange your expertise with others and trade your skills for what you need
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                        <button className="group cursor-pointer bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center">
                            Start Trading Skills
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-4 justify-center pt-3">
                        <div className="text-center">
                            <div className="text-xl font-bold text-gray-700 dark:text-gray-300">2,500+</div>
                            <div className="text-sm  text-gray-700 dark:text-gray-300">Active Skills</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-bold text- gray-700 dark:text-gray-300">1,200+</div>
                            <div className="text-sm text-gray-700 dark:text-gray-300">Successful Trades</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-bold text-gray-700 dark:text-gray-300">95%</div>
                            <div className="text-sm text-gray-700 dark:text-gray-300">Satisfaction Rate</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
