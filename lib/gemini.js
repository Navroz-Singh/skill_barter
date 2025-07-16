// lib/geminiService.js

// NOTE: We intentionally avoid importing the Gemini SDK at the top-level so that
// this file can be safely bundled for the browser (e.g. when only QUICK_ACTIONS
// is imported).  The SDK is instead loaded lazily inside `getChatResponse`,
// ensuring it is only executed in a server environment where the API key is
// available.




// Platform-specific system prompt (same as before)
const SYSTEM_PROMPT = `You are an AI assistant for a Skill Barter System platform. Help users with platform-specific questions using this context:

PLATFORM OVERVIEW:
- Users can offer skills in exchange for other skills or money
- Two main exchange types: skill_for_skill and skill_for_money
- Users create profiles, add skills, and engage in exchanges

EXCHANGE PROCESS:
- Status flow: pending → negotiating → pending_acceptance → accepted → in_progress → completed
- Two-step acceptance system: both parties must accept before proceeding
- Chat/messaging available during negotiating, pending_acceptance, accepted, and in_progress statuses
- Negotiation features allow setting deliverables, deadlines, and terms

SKILLS MANAGEMENT:
- Categories: Technology, Design, Business, Language, Photography, Music, Handcraft, Education, Other
- Levels: Beginner, Intermediate, Advanced, Expert
- Users can set availability status and delivery methods (In-person, Online, Both)
- Skills have descriptions, tags, and estimated duration

ACCOUNT FEATURES:
- Profile management with bio, location, avatar
- Privacy settings for email/location visibility
- Notification preferences for exchanges and messages
- Account deactivation/reactivation options

PROVIDE SPECIFIC, ACTIONABLE ANSWERS:
- Use platform terminology exactly as described
- Give step-by-step instructions when possible
- Reference specific page paths (e.g., "Profile > Settings")
- If unsure, suggest checking the FAQ section or contacting support

Keep responses concise but helpful, focusing on solving the user's immediate need.`;

// Quick action prompts (same as before)
export const QUICK_ACTIONS = [
    {
        id: 'start-exchange',
        text: 'How do I start an exchange?',
        prompt: 'How do I start an exchange on this platform?'
    },
    {
        id: 'add-skill',
        text: 'How do I add a new skill?',
        prompt: 'How do I add a new skill to my profile?'
    },
    {
        id: 'negotiation',
        text: 'How does negotiation work?',
        prompt: 'How does the negotiation process work for exchanges?'
    },
    {
        id: 'update-profile',
        text: 'How do I update my profile?',
        prompt: 'How do I update my profile information and settings?'
    },
    {
        id: 'exchange-status',
        text: 'What are the exchange statuses?',
        prompt: 'What are the different exchange statuses and what do they mean?'
    }
];

// Updated main chat function using new API structure
export async function getChatResponse(userMessage, conversationHistory = []) {
    // Dynamically import the SDK to avoid loading it in the browser bundle
    const { GoogleGenAI } = await import('@google/genai');

    // Fail fast if API key is missing (additional guard besides validateGeminiAPI)
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not set.');
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
        // Build conversation context with system instruction
        const conversationContext = conversationHistory.length > 0
            ? `${SYSTEM_PROMPT}\n\nPrevious conversation:\n${conversationHistory.map(msg =>
                `${msg.role}: ${msg.content}`
            ).join('\n')}\n\nUser: ${userMessage}`
            : `${SYSTEM_PROMPT}\n\nUser: ${userMessage}`;

        // Generate response using new API structure
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: conversationContext
        });

        return {
            success: true,
            response: response.text,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('Gemini API error:', error);

        // Return fallback response
        return {
            success: false,
            response: "I'm having trouble connecting to my AI service right now. Please try again in a moment, or check our FAQ section for common questions.",
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

// Helper function to validate API key (same as before)
export function validateGeminiAPI() {
    return !!process.env.GEMINI_API_KEY;
}
