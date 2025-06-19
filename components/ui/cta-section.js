'use client';

import { ArrowRight, Shield } from 'lucide-react';
import { useUser } from '@/hooks/use-user';

const CTASection = () => {
    const { user } = useUser();
    return (
        <section className="relative bg-white dark:bg-gray-900 pt-8 pb-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="space-y-6">
                    
                    {/* Main CTA Content */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700">
                        
                        {/* Heading */}
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            Ready to start your skill journey?
                        </h2>
                        
                        {/* Subheading */}
                        <p className="text-lg sm:text-xl text-[var(--parrot)] mb-6 max-w-2xl mx-auto">
                            Join thousands of professionals already trading skills and growing their networks
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-5">
                            <button className="group cursor-pointer bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 px-10 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center">
                                {user ? "Start Trading Skills" : "Sign Up Free"}
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button className="cursor-pointer bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 px-10 py-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center">
                                Learn More
                            </button>
                        </div>

                        {/* Trust Message */}
                        <div className="flex items-center justify-center text-base text-gray-600 dark:text-gray-400">
                            <Shield className="w-5 h-5 mr-2" />
                            <span>No credit card required • Free to join • Start trading instantly</span>
                        </div>
                    </div>

                    {/* Additional Trust Elements */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-center">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                            <div className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                                100% Free
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                No hidden fees ever
                            </div>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                            <div className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                                Instant Access
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Start browsing immediately
                            </div>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                            <div className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                                Safe & Secure
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Verified user community
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CTASection;
