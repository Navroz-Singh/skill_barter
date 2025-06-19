'use client';

import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram, ArrowRight } from 'lucide-react';

const Footer = () => {
    const quickLinks = [
        { name: "About", href: "/about" },
        { name: "How it Works", href: "/how-it-works" },
        { name: "Terms", href: "/terms" },
        { name: "Privacy", href: "/privacy" }
    ];

    const socialLinks = [
        { name: "Facebook", icon: Facebook, href: "#" },
        { name: "Twitter", icon: Twitter, href: "#" },
        { name: "LinkedIn", icon: Linkedin, href: "#" },
        { name: "Instagram", icon: Instagram, href: "#" }
    ];

    return (
        <footer className="relative bg-gray-800 pt-8 pb-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="space-y-6">

                    {/* Main Footer Content */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                        {/* Brand Section */}
                        <div className="space-y-3">
                            <h3 className="text-xl font-bold text-white">
                                <span className="text-white">SB</span>
                                <span className="text-gray-300">art</span>
                            </h3>
                            <p className="text-md text-gray-400 leading-relaxed">
                                Trade skills, build connections, and grow your network without spending money.
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div className="space-y-3">
                            <h4 className="text-base font-semibold text-white">Quick Links</h4>
                            <ul className="space-y-2">
                                {quickLinks.map((link) => (
                                    <li key={link.name}>
                                        <a
                                            href={link.href}
                                            className="text-sm text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer"
                                        >
                                            {link.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-3">
                            <h4 className="text-base font-semibold text-white">Contact</h4>
                            <div className="space-y-2">
                                <div className="flex items-center text-sm text-gray-400">
                                    <Mail className="w-4 h-4 mr-3" />
                                    <span>hello@sbart.com</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-400">
                                    <Phone className="w-4 h-4 mr-3" />
                                    <span>+1 (555) 123-4567</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-400">
                                    <MapPin className="w-4 h-4 mr-3" />
                                    <span>San Francisco, CA</span>
                                </div>
                            </div>
                        </div>

                        {/* Newsletter Signup */}
                        <div className="space-y-3">
                            <h4 className="text-base font-semibold text-white">Stay Updated</h4>
                            <p className="text-sm text-gray-400">
                                Get the latest skill trading tips and updates
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="Your email"
                                    className="flex-1 px-4 py-3 text-sm bg-gray-800 dark:bg-gray-900 text-white border border-gray-700 dark:border-gray-600 rounded-lg focus:outline-none focus:border-gray-500"
                                />
                                <button className="bg-white cursor-pointer hover:bg-gray-100 text-gray-900 px-4 py-3 rounded-lg transition-colors duration-300 flex items-center justify-center">
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Social Media & Copyright */}
                    <div className="border-t border-gray-800 dark:border-gray-700 pt-5">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

                            {/* Social Links */}
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-400">Follow us:</span>
                                <div className="flex gap-3">
                                    {socialLinks.map((social) => (
                                        <a
                                            key={social.name}
                                            href={social.href}
                                            className="w-10 h-10 bg-gray-800 dark:bg-gray-900 hover:bg-gray-700 dark:hover:bg-gray-800 rounded-full flex items-center justify-center transition-colors duration-300 cursor-pointer"
                                            aria-label={social.name}
                                        >
                                            <social.icon className="w-5 h-5 text-gray-400 hover:text-white" />
                                        </a>
                                    ))}
                                </div>
                            </div>

                            {/* Copyright */}
                            <div className="text-sm text-gray-400">
                                © 2025 SBart. All rights reserved.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
