'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
    BookOpen,
    Users,
    MessageSquare,
    Shield,
    ArrowRight,
    Mail,
    Github,
    MessageCircle,
    Settings,
    Code,
    Database,
    ChevronRight,
    ExternalLink
} from 'lucide-react';

export default function AboutPage() {
    const [activeSection, setActiveSection] = useState('overview');

    // Educational sections focused on explanation
    const sections = [
        { id: 'overview', label: 'Platform Overview', icon: BookOpen },
        { id: 'user-system', label: 'User System', icon: Users },
        { id: 'exchange-process', label: 'Exchange Process', icon: MessageSquare },
        { id: 'technical-details', label: 'Technical Architecture', icon: Code },
        { id: 'safety-measures', label: 'Safety Measures', icon: Shield },
        { id: 'support', label: 'Support System', icon: Settings }
    ];

    // Create refs for each section
    const refs = sections.reduce((acc, section) => {
        acc[section.id] = useRef(null);
        return acc;
    }, {});

    // Smooth scroll handler
    const handleScroll = (id) => {
        refs[id].current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
        setActiveSection(id);
    };

    // Intersection Observer for active section tracking
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            { threshold: 0.3 }
        );

        sections.forEach(({ id }) => {
            if (refs[id].current) {
                observer.observe(refs[id].current);
            }
        });

        return () => observer.disconnect();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 pt-12">

            {/* Main Content Layout */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex gap-8">

                    {/* Sidebar Navigation */}
                    <aside className="w-80 sticky top-8 h-fit">
                        <nav className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold mb-6 text-gray-900">
                                Contents
                            </h2>
                            <ul className="space-y-2">
                                {sections.map(({ id, label, icon: Icon }) => (
                                    <li key={id}>
                                        <button
                                            onClick={() => handleScroll(id)}
                                            className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-all duration-200 ${activeSection === id
                                                    ? 'bg-gray-900 text-white'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span className="font-medium">{label}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>

                            {/* Quick Stats */}
                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4">Platform Stats</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Active Users</span>
                                        <span className="text-sm font-medium">10,000+</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Skills Available</span>
                                        <span className="text-sm font-medium">50,000+</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Success Rate</span>
                                        <span className="text-sm font-medium">95%</span>
                                    </div>
                                </div>
                            </div>
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200">

                        {/* Platform Overview */}
                        <section ref={refs.overview} id="overview" className="p-8 border-b border-gray-200">
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">Platform Overview</h2>

                            <div className="prose prose-lg max-w-none">
                                <p className="text-gray-700 leading-relaxed mb-6">
                                    SkillBarter is a peer-to-peer platform designed to facilitate skill exchanges between individuals.
                                    The core concept is simple: users can trade their expertise in one area for learning opportunities
                                    in another. This creates a community-driven learning environment where knowledge is the primary currency.
                                </p>

                                <h3 className="text-xl font-semibold text-gray-900 mb-4">How the Platform Functions</h3>
                                <p className="text-gray-700 leading-relaxed mb-6">
                                    The platform operates on a structured exchange system. Users create profiles listing their skills
                                    and learning interests. When someone wants to learn a skill you offer, they can propose an exchange
                                    where they teach you something in return. This bilateral approach ensures mutual benefit and engagement.
                                </p>

                                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                                    <h4 className="font-semibold text-gray-900 mb-3">Core Principles</h4>
                                    <div className="space-y-3 text-gray-700">
                                        <p><strong>Mutual Exchange:</strong> Every interaction involves both parties teaching and learning</p>
                                        <p><strong>Community Driven:</strong> Users set their own terms, schedules, and teaching methods</p>
                                        <p><strong>Skill Diversity:</strong> From technical skills to creative arts, all knowledge areas are welcome</p>
                                        <p><strong>Flexible Format:</strong> Exchanges can be one-time sessions or ongoing mentorship</p>
                                    </div>
                                </div>

                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Platform Structure</h3>
                                <p className="text-gray-700 leading-relaxed">
                                    The platform is built around user profiles, skill listings, and exchange management. Each user
                                    maintains a profile showcasing their expertise and learning goals. The system matches compatible
                                    users and provides tools for negotiation, communication, and progress tracking throughout the exchange process.
                                </p>
                            </div>
                        </section>

                        {/* User System */}
                        <section ref={refs['user-system']} id="user-system" className="p-8 border-b border-gray-200">
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">User System</h2>

                            <div className="prose prose-lg max-w-none">
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Profile Creation and Management</h3>
                                <p className="text-gray-700 leading-relaxed mb-6">
                                    Users begin by creating comprehensive profiles that serve as their identity on the platform.
                                    These profiles include personal information, skill inventories, learning interests, and availability.
                                    The profile system is designed to help users present their expertise clearly while making it easy
                                    for others to understand what they can offer and what they're seeking to learn.
                                </p>

                                <div className="bg-blue-50 p-6 rounded-lg mb-6">
                                    <h4 className="font-semibold text-gray-900 mb-3">Profile Components</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                                        <div>
                                            <p className="font-medium mb-2">Skills You Can Teach</p>
                                            <p className="text-sm">List your expertise with proficiency levels and teaching experience</p>
                                        </div>
                                        <div>
                                            <p className="font-medium mb-2">Skills You Want to Learn</p>
                                            <p className="text-sm">Specify your learning goals and current knowledge level</p>
                                        </div>
                                        <div>
                                            <p className="font-medium mb-2">Availability & Preferences</p>
                                            <p className="text-sm">Set your schedule and preferred communication methods</p>
                                        </div>
                                        <div>
                                            <p className="font-medium mb-2">Portfolio & Credentials</p>
                                            <p className="text-sm">Showcase your work and verify your expertise</p>
                                        </div>
                                    </div>
                                </div>

                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Authentication and Security</h3>
                                <p className="text-gray-700 leading-relaxed mb-6">
                                    User authentication is handled through Supabase, providing secure login with multiple options
                                    including email/password and social authentication. The system maintains user sessions across
                                    devices and provides secure access to all platform features. User data is protected with
                                    encryption and follows privacy best practices.
                                </p>

                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Reputation and Trust System</h3>
                                <p className="text-gray-700 leading-relaxed">
                                    Users build reputation through successful exchanges and peer feedback. The system tracks
                                    completion rates, user ratings, and detailed reviews from exchange partners. This creates
                                    a trust network where users can make informed decisions about potential exchange partners
                                    based on their history and community standing.
                                </p>
                            </div>
                        </section>

                        {/* Exchange Process */}
                        <section ref={refs['exchange-process']} id="exchange-process" className="p-8 border-b border-gray-200">
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">Exchange Process</h2>

                            <div className="prose prose-lg max-w-none">
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Discovery and Initial Contact</h3>
                                <p className="text-gray-700 leading-relaxed mb-6">
                                    Users discover potential exchange partners through the platform's search and filtering system.
                                    They can browse skills by category, search for specific expertise, or use the recommendation
                                    engine to find compatible matches. When interested in an exchange, users send structured
                                    requests that outline what they want to learn and what they can offer in return.
                                </p>

                                <div className="bg-green-50 p-6 rounded-lg mb-6">
                                    <h4 className="font-semibold text-gray-900 mb-3">The Negotiation Process</h4>
                                    <p className="text-gray-700 mb-4">
                                        Once initial contact is made, users enter a negotiation phase where they discuss and agree
                                        on exchange terms. This happens in our dedicated negotiation environment.
                                    </p>
                                    <div className="space-y-3 text-gray-700">
                                        <p><strong>Deliverables Definition:</strong> Both parties specify exactly what they will teach and learn</p>
                                        <p><strong>Timeline Planning:</strong> Setting realistic schedules and milestones for the exchange</p>
                                        <p><strong>Communication Methods:</strong> Agreeing on how they'll interact (video calls, messages, etc.)</p>
                                        <p><strong>Success Criteria:</strong> Defining what constitutes a successful exchange for both parties</p>
                                    </div>
                                </div>

                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Bilateral Acceptance System</h3>
                                <p className="text-gray-700 leading-relaxed mb-6">
                                    Before any exchange begins, both parties must explicitly accept the negotiated terms. This
                                    two-step acceptance process ensures that everyone is committed and has clear expectations.
                                    The system won't proceed to the active exchange phase until both users have confirmed their agreement.
                                </p>

                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Active Exchange Management</h3>
                                <p className="text-gray-700 leading-relaxed mb-6">
                                    During the active exchange phase, users have access to communication tools, progress tracking,
                                    and resource sharing capabilities. The platform provides a structured environment where both
                                    parties can monitor their progress, share materials, and communicate effectively throughout
                                    the learning process.
                                </p>

                                <div className="bg-yellow-50 p-6 rounded-lg mb-6">
                                    <h4 className="font-semibold text-gray-900 mb-3">Progress Tracking System</h4>
                                    <p className="text-gray-700 mb-3">
                                        The platform includes a comprehensive progress tracking system that helps users stay
                                        organized and motivated throughout their exchange.
                                    </p>
                                    <div className="space-y-2 text-gray-700">
                                        <p>Users can mark deliverables as complete and request peer confirmation</p>
                                        <p>The system tracks time spent and milestones achieved</p>
                                        <p>Both parties can provide ongoing feedback and adjust their approach</p>
                                        <p>Completion status is updated in real-time for both users</p>
                                    </div>
                                </div>

                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Completion and Review</h3>
                                <p className="text-gray-700 leading-relaxed">
                                    When an exchange is complete, both users confirm the fulfillment of deliverables and provide
                                    feedback about their experience. This includes rating their partner's teaching ability,
                                    communication skills, and overall professionalism. These reviews become part of each user's
                                    reputation profile and help future exchange partners make informed decisions.
                                </p>
                            </div>
                        </section>

                        {/* Technical Details */}
                        <section ref={refs['technical-details']} id="technical-details" className="p-8 border-b border-gray-200">
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">Technical Architecture</h2>

                            <div className="prose prose-lg max-w-none">
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Frontend Architecture</h3>
                                <p className="text-gray-700 leading-relaxed mb-6">
                                    The platform is built using Next.js 15 with the App Router, providing server-side rendering
                                    and optimal performance. The frontend uses React components with a clean separation between
                                    server and client components. Tailwind CSS handles styling with a mobile-first responsive design
                                    approach that works seamlessly across all devices.
                                </p>

                                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                                    <h4 className="font-semibold text-gray-900 mb-3">Key Technologies</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                                        <div>
                                            <p className="font-medium mb-1">Next.js 15+ with App Router</p>
                                            <p className="text-sm">Server-side rendering, streaming, and optimized performance</p>
                                        </div>
                                        <div>
                                            <p className="font-medium mb-1">React 18</p>
                                            <p className="text-sm">Modern component architecture with hooks and context</p>
                                        </div>
                                        <div>
                                            <p className="font-medium mb-1">Tailwind CSS</p>
                                            <p className="text-sm">Utility-first styling with responsive design</p>
                                        </div>
                                        <div>
                                            <p className="font-medium mb-1">JavaScript (ES6+)</p>
                                            <p className="text-sm">Modern JavaScript features and clean syntax</p>
                                        </div>
                                    </div>
                                </div>

                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Backend Infrastructure</h3>
                                <p className="text-gray-700 leading-relaxed mb-6">
                                    The backend utilizes Next.js API routes for server-side logic and database operations.
                                    MongoDB serves as the primary database with Mongoose for object modeling and validation.
                                    The architecture follows RESTful principles with proper error handling and validation
                                    throughout the API layer.
                                </p>

                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Real-time Communication</h3>
                                <p className="text-gray-700 leading-relaxed mb-6">
                                    Real-time features are powered by Socket.io, enabling instant messaging, live notifications,
                                    and collaborative features. The system maintains persistent connections for active users
                                    and provides fallback mechanisms for offline scenarios. This ensures smooth communication
                                    during negotiations and active exchanges.
                                </p>

                                <div className="bg-blue-50 p-6 rounded-lg mb-6">
                                    <h4 className="font-semibold text-gray-900 mb-3">Database Design</h4>
                                    <p className="text-gray-700 mb-3">
                                        The MongoDB database is structured around several key collections that work together
                                        to manage the platform's core functionality.
                                    </p>
                                    <div className="space-y-2 text-gray-700">
                                        <p><strong>Users:</strong> Profile information, skills, preferences, and authentication data</p>
                                        <p><strong>Exchanges:</strong> Exchange records with status tracking and participant information</p>
                                        <p><strong>Negotiations:</strong> Terms, deliverables, and agreement tracking</p>
                                        <p><strong>Messages:</strong> Real-time communication history and metadata</p>
                                        <p><strong>Skills:</strong> Skill definitions, categories, and usage statistics</p>
                                    </div>
                                </div>

                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Performance Optimization</h3>
                                <p className="text-gray-700 leading-relaxed">
                                    The platform implements various performance optimizations including server-side rendering,
                                    image optimization, code splitting, and efficient caching strategies. Database queries are
                                    optimized with proper indexing and aggregation pipelines for complex operations. The frontend
                                    uses React's built-in optimization features like useMemo and useCallback for optimal rendering performance.
                                </p>
                            </div>
                        </section>

                        {/* Safety Measures */}
                        <section ref={refs['safety-measures']} id="safety-measures" className="p-8 border-b border-gray-200">
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">Safety Measures</h2>

                            <div className="prose prose-lg max-w-none">
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">User Authentication and Privacy</h3>
                                <p className="text-gray-700 leading-relaxed mb-6">
                                    The platform implements robust authentication through Supabase, providing secure user
                                    registration and login processes. User data is encrypted and stored securely, with
                                    granular privacy controls allowing users to control what information is visible to others.
                                    Multi-factor authentication is available for additional security.
                                </p>

                                <div className="bg-red-50 p-6 rounded-lg mb-6">
                                    <h4 className="font-semibold text-gray-900 mb-3">Dispute Resolution System</h4>
                                    <p className="text-gray-700 mb-3">
                                        When conflicts arise between users, the platform provides a structured dispute resolution process.
                                    </p>
                                    <div className="space-y-2 text-gray-700">
                                        <p>Users can report issues and submit evidence through the platform</p>
                                        <p>Admin mediators review disputes and communicate with both parties</p>
                                        <p>The system maintains detailed records of all dispute proceedings</p>
                                        <p>Resolution decisions are implemented and communicated to all parties</p>
                                        <p>Appeals process is available for disputed decisions</p>
                                    </div>
                                </div>

                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Content Moderation</h3>
                                <p className="text-gray-700 leading-relaxed mb-6">
                                    The platform maintains community standards through a combination of automated systems
                                    and human moderation. User-generated content is monitored for inappropriate material,
                                    and users can report violations. The moderation team reviews reports and takes appropriate
                                    action based on community guidelines.
                                </p>

                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Protection</h3>
                                <p className="text-gray-700 leading-relaxed mb-6">
                                    User data is protected through encryption, secure storage practices, and regular security
                                    audits. The platform follows GDPR compliance standards and provides users with control
                                    over their data, including the ability to export or delete their information. Regular
                                    backups ensure data integrity and availability.
                                </p>

                                <div className="bg-green-50 p-6 rounded-lg">
                                    <h4 className="font-semibold text-gray-900 mb-3">Community Guidelines</h4>
                                    <p className="text-gray-700 mb-3">
                                        The platform maintains a positive learning environment through clear community guidelines
                                        and enforcement mechanisms.
                                    </p>
                                    <div className="space-y-2 text-gray-700">
                                        <p>Respectful communication is required in all interactions</p>
                                        <p>Users must fulfill their commitments in skill exchanges</p>
                                        <p>Discrimination and harassment are strictly prohibited</p>
                                        <p>Spam and irrelevant content are not allowed</p>
                                        <p>Commercial activities outside the platform are discouraged</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Support System */}
                        <section ref={refs.support} id="support" className="p-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">Support System</h2>

                            <div className="prose prose-lg max-w-none">
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">User Support Channels</h3>
                                <p className="text-gray-700 leading-relaxed mb-6">
                                    The platform provides multiple support channels to help users with questions, technical
                                    issues, and guidance. Support is available through email, live chat, and community forums.
                                    The support team is trained to handle various scenarios from basic platform navigation
                                    to complex dispute resolution.
                                </p>

                                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                                    <h4 className="font-semibold text-gray-900 mb-3">Available Support Options</h4>
                                    <div className="space-y-3 text-gray-700">
                                        <div className="flex items-start gap-3">
                                            <Mail className="w-5 h-5 text-gray-500 mt-0.5" />
                                            <div>
                                                <p className="font-medium">Email Support</p>
                                                <p className="text-sm">Detailed help for complex issues with response within 24 hours</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <MessageCircle className="w-5 h-5 text-gray-500 mt-0.5" />
                                            <div>
                                                <p className="font-medium">Live Chat</p>
                                                <p className="text-sm">Real-time assistance for urgent questions and immediate help</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Users className="w-5 h-5 text-gray-500 mt-0.5" />
                                            <div>
                                                <p className="font-medium">Community Forums</p>
                                                <p className="text-sm">Peer-to-peer help and discussion about platform features</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Documentation and Resources</h3>
                                <p className="text-gray-700 leading-relaxed mb-6">
                                    Comprehensive documentation is available covering all aspects of the platform. This includes
                                    step-by-step guides for new users, detailed explanations of features, troubleshooting guides,
                                    and best practices for successful skill exchanges. The documentation is regularly updated
                                    to reflect platform changes and user feedback.
                                </p>

                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Community Contributions</h3>
                                <p className="text-gray-700 leading-relaxed mb-6">
                                    The platform encourages community involvement in its development and improvement. Users can
                                    contribute through the GitHub repository, participate in beta testing, and provide feedback
                                    on new features. The development team regularly communicates with the community about
                                    platform updates and future plans.
                                </p>

                                <div className="bg-blue-50 p-6 rounded-lg">
                                    <h4 className="font-semibold text-gray-900 mb-3">Getting Help</h4>
                                    <p className="text-gray-700 mb-3">
                                        If you need assistance with the platform, here are the best ways to get help:
                                    </p>
                                    <div className="space-y-2 text-gray-700">
                                        <p>Check the documentation and FAQ section first for common questions</p>
                                        <p>Use live chat for immediate assistance with urgent issues</p>
                                        <p>Email support for detailed help with complex problems</p>
                                        <p>Join the community forum to connect with other users</p>
                                        <p>Follow the GitHub repository for technical updates and discussions</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                    </main>
                </div>
            </div>
        </div>
    );
}
