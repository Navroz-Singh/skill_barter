// data/helpFAQs.js

export const helpFAQs = [
    // Exchange Process (10 FAQs)
    {
        id: 1,
        question: "How do I start an exchange?",
        answer: "To start an exchange, browse skills on the platform, find a skill you're interested in, and click 'Request Exchange'. You'll then specify what you're offering in return (your skill or payment) and provide details about your offer.",
        category: "Exchange Process"
    },
    {
        id: 2,
        question: "What are the different exchange statuses?",
        answer: "Exchange statuses are: Pending (initial request), Negotiating (discussing terms), Pending Acceptance (one party accepted), Accepted (both parties agreed), In Progress (exchange happening), Completed (finished), Cancelled, or Expired.",
        category: "Exchange Process"
    },
    {
        id: 3,
        question: "How does the negotiation process work?",
        answer: "During negotiation, both parties can chat, discuss terms, set deliverables, and agree on timeline. Once both parties accept the terms, the exchange moves to 'Accepted' status and you can begin the actual skill exchange.",
        category: "Exchange Process"
    },
    {
        id: 4,
        question: "What happens after both parties accept an exchange?",
        answer: "Once both parties accept, the exchange status changes to 'In Progress'. You can then start the actual skill exchange, communicate directly, and work on the agreed deliverables.",
        category: "Exchange Process"
    },
    {
        id: 17,
        question: "How do I cancel an exchange?",
        answer: "You can cancel an exchange during the 'Pending' or 'Negotiating' stages by going to your exchange details and clicking 'Cancel Exchange'. Once both parties have accepted, cancellation requires mutual agreement or contacting support.",
        category: "Exchange Process"
    },
    {
        id: 18,
        question: "Can I modify my offer after submitting?",
        answer: "Yes, during the negotiation phase you can modify your offer details, deliverables, timeline, and terms. Any changes will reset the acceptance status and require both parties to re-agree to the updated terms.",
        category: "Exchange Process"
    },
    {
        id: 19,
        question: "What delivery methods are available for exchanges?",
        answer: "You can choose from three delivery methods: In-person (face-to-face meetings), Online (video calls, digital delivery), or Both (flexible approach). Specify your preferred method when creating your skill listing.",
        category: "Exchange Process"
    },
    {
        id: 20,
        question: "How long do exchanges typically take to complete?",
        answer: "Exchange duration varies by skill complexity. Simple consultations might take 1-2 hours, while complex projects can span weeks. You'll agree on timeline and deliverables during the negotiation phase.",
        category: "Exchange Process"
    },
    {
        id: 21,
        question: "Can I have multiple active exchanges at the same time?",
        answer: "Yes, you can participate in multiple exchanges simultaneously. However, make sure you can manage your time effectively and fulfill all your commitments to maintain a good reputation on the platform.",
        category: "Exchange Process"
    },
    {
        id: 22,
        question: "What happens when an exchange expires?",
        answer: "Exchanges automatically expire after 30 days of inactivity. Expired exchanges are closed and cannot be reactivated. If you want to continue, you'll need to start a new exchange request.",
        category: "Exchange Process"
    },

    // Skills Management (10 FAQs)
    {
        id: 5,
        question: "How do I add a new skill?",
        answer: "Go to 'My Skills' in your profile and click 'Add Skill'. Fill in the skill title, description, category, level, and any additional details. Make sure to add relevant tags to help others find your skill.",
        category: "Skills Management"
    },
    {
        id: 6,
        question: "How do I edit my existing skills?",
        answer: "In your profile under 'My Skills', find the skill you want to edit and click the 'Edit' button. You can update all details including availability status.",
        category: "Skills Management"
    },
    {
        id: 7,
        question: "What skill categories are available?",
        answer: "Available categories include: Technology, Design, Business, Language, Photography, Music, Handcraft, Education, and Other. Choose the most relevant category for your skill.",
        category: "Skills Management"
    },
    {
        id: 8,
        question: "How do I make my skill unavailable temporarily?",
        answer: "In your skill edit page, you can toggle the 'Available' status to temporarily hide your skill from other users while keeping it in your profile.",
        category: "Skills Management"
    },
    {
        id: 23,
        question: "How do I delete a skill permanently?",
        answer: "In your 'My Skills' section, click on the skill you want to delete, then click 'Edit' and look for the 'Delete Skill' option. Note that skills involved in active exchanges cannot be deleted.",
        category: "Skills Management"
    },
    {
        id: 24,
        question: "Can I duplicate an existing skill listing?",
        answer: "Currently, there's no direct copy feature, but you can create a new skill and manually copy details from an existing one. This is useful for creating variations of similar skills.",
        category: "Skills Management"
    },
    {
        id: 25,
        question: "How do I add images to my skill listing?",
        answer: "When creating or editing a skill, scroll to the 'Images' section and click 'Upload Images'. You can add multiple images to showcase your work, portfolio pieces, or examples of your skill.",
        category: "Skills Management"
    },
    {
        id: 26,
        question: "What makes a good skill description?",
        answer: "A good description is specific, detailed, and explains what you'll deliver. Include your experience level, what the recipient will learn or receive, and any prerequisites. Use keywords others might search for.",
        category: "Skills Management"
    },
    {
        id: 27,
        question: "How do I set an estimated duration for my skill?",
        answer: "In the skill creation form, there's an 'Estimated Duration' field where you can specify how long the skill exchange typically takes (e.g., '2 hours', '1 week project', '3 sessions').",
        category: "Skills Management"
    },
    {
        id: 28,
        question: "Can I offer the same skill multiple times?",
        answer: "Yes, you can create multiple listings for the same skill if you want to offer different packages, levels, or approaches. For example, 'Basic Photography' and 'Advanced Photography Masterclass'.",
        category: "Skills Management"
    },

    // Account Settings (10 FAQs)
    {
        id: 9,
        question: "How do I update my profile information?",
        answer: "Go to Profile > Settings to update your name, bio, location, and other profile details. You can also manage your privacy settings and notification preferences.",
        category: "Account Settings"
    },
    {
        id: 10,
        question: "How do I change my notification preferences?",
        answer: "In Profile > Settings, scroll to the Notifications section. You can toggle email notifications, push notifications, and specific alerts for exchanges and messages.",
        category: "Account Settings"
    },
    {
        id: 11,
        question: "How do I deactivate my account?",
        answer: "In Profile > Settings, scroll to the Account Management section. Click 'Deactivate Account' and confirm. Your account will be hidden but can be reactivated later.",
        category: "Account Settings"
    },
    {
        id: 12,
        question: "How do I change my password?",
        answer: "Since authentication is handled by Supabase, you can reset your password through the login page or your email settings. Look for 'Forgot Password' on the login screen.",
        category: "Account Settings"
    },
    {
        id: 29,
        question: "How do I upload a profile picture?",
        answer: "Go to Profile > Settings and click on your current avatar or the camera icon. Select a new image from your device. Profile pictures help build trust and make your profile more personable.",
        category: "Account Settings"
    },
    {
        id: 30,
        question: "Can I change my email address?",
        answer: "Email changes are handled through Supabase authentication. You'll need to log out and use the 'Change Email' option, or contact support if you're having trouble accessing your account.",
        category: "Account Settings"
    },
    {
        id: 31,
        question: "How do I manage my privacy settings?",
        answer: "In Profile > Settings, find the Privacy section where you can control whether your email and location are visible to other users, and set your overall profile visibility to public or private.",
        category: "Account Settings"
    },
    {
        id: 32,
        question: "What information can other users see about me?",
        answer: "Other users can see your name, bio, skills, location (if enabled), and exchange history. Your email is only visible if you enable it in privacy settings. Your rating and review count are always public.",
        category: "Account Settings"
    },
    {
        id: 33,
        question: "How do I delete my account permanently?",
        answer: "In Profile > Settings, scroll to Account Management and click 'Delete Account'. This permanently removes all your data including skills, exchanges, and messages. This action cannot be undone.",
        category: "Account Settings"
    },
    {
        id: 34,
        question: "Can I reactivate a deactivated account?",
        answer: "Yes, deactivated accounts can be reactivated by simply logging back in. All your data, skills, and exchange history will be restored. Your profile will become visible to other users again.",
        category: "Account Settings"
    },

    // Troubleshooting (10 FAQs)
    {
        id: 13,
        question: "I'm not receiving notifications, what should I do?",
        answer: "Check your notification settings in Profile > Settings. Ensure notifications are enabled for the types you want to receive. Also check your email spam folder for email notifications.",
        category: "Troubleshooting"
    },
    {
        id: 14,
        question: "My exchange is stuck in 'Pending' status, why?",
        answer: "An exchange stays in 'Pending' until the recipient responds. If it's been a while, try messaging them directly or consider that they may not be active on the platform.",
        category: "Troubleshooting"
    },
    {
        id: 15,
        question: "I can't see the chat option in my exchange",
        answer: "Chat is only available when exchanges are in 'Negotiating', 'Pending Acceptance', 'Accepted', or 'In Progress' status. If your exchange is still 'Pending', chat will be enabled once the recipient responds.",
        category: "Troubleshooting"
    },
    {
        id: 16,
        question: "How do I report a problem with another user?",
        answer: "If you encounter issues with another user, try resolving it through the chat feature first. For serious issues, you can contact support through this help center or reach out via email.",
        category: "Troubleshooting"
    },
    {
        id: 35,
        question: "Why can't I find any skills to exchange for?",
        answer: "Try adjusting your search filters, check different categories, or browse without location restrictions. If you're in a small area, consider online delivery methods to access more skills.",
        category: "Troubleshooting"
    },
    {
        id: 36,
        question: "My messages aren't sending in the chat",
        answer: "Check your internet connection, try refreshing the page, or try logging out and back in. If the problem persists, the other user might have connectivity issues or the exchange may be in the wrong status.",
        category: "Troubleshooting"
    },
    {
        id: 37,
        question: "The platform is running slowly or freezing",
        answer: "Try clearing your browser cache, disabling browser extensions, or switching to a different browser. Ensure you have a stable internet connection. Contact support if issues persist.",
        category: "Troubleshooting"
    },
    {
        id: 38,
        question: "I can't upload images to my skill or profile",
        answer: "Ensure your images are under 5MB and in supported formats (JPG, PNG, GIF). Try a different browser or clear your cache. Check that JavaScript is enabled in your browser.",
        category: "Troubleshooting"
    },
    {
        id: 39,
        question: "I accidentally deleted a skill, can I recover it?",
        answer: "Unfortunately, deleted skills cannot be recovered. You'll need to recreate the skill listing. To avoid this in the future, consider making skills 'unavailable' instead of deleting them.",
        category: "Troubleshooting"
    },
    {
        id: 40,
        question: "Why am I not getting any exchange requests?",
        answer: "Ensure your skills are marked as 'available', have detailed descriptions with good keywords, include images if possible, and check that your profile is complete. Consider adjusting your skill offerings or delivery methods.",
        category: "Troubleshooting"
    }
];

// Helper function to get FAQs by category
export const getFAQsByCategory = () => {
    const categories = {};
    helpFAQs.forEach(faq => {
        if (!categories[faq.category]) {
            categories[faq.category] = [];
        }
        categories[faq.category].push(faq);
    });
    return categories;
};

// Helper function to get all categories
export const getCategories = () => {
    return [...new Set(helpFAQs.map(faq => faq.category))];
};

// Helper function to get popular FAQs (most commonly accessed)
export const getPopularFAQs = (limit = 5) => {
    return helpFAQs
        .filter(faq => [1, 2, 5, 9, 13].includes(faq.id)) // Most essential FAQs
        .slice(0, limit);
};

// Helper function to search FAQs
export const searchFAQs = (searchTerm) => {
    if (!searchTerm.trim()) return helpFAQs;

    const term = searchTerm.toLowerCase();
    return helpFAQs.filter(faq =>
        faq.question.toLowerCase().includes(term) ||
        faq.answer.toLowerCase().includes(term) ||
        faq.category.toLowerCase().includes(term)
    );
};
