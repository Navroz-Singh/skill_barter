// app/api/help/chat/route.js

import { NextResponse } from 'next/server';
import { getChatResponse, validateGeminiAPI } from '@/lib/gemini';
import { createClient } from '@/lib/supabase/server';

export async function POST(request) {
    try {
        // Validate API key
        if (!validateGeminiAPI()) {
            return NextResponse.json({
                success: false,
                error: 'AI service is not configured properly'
            }, { status: 500 });
        }

        // Get user authentication (optional)
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Parse request body
        const { message, conversationHistory = [] } = await request.json();

        // Validate input
        if (!message || typeof message !== 'string') {
            return NextResponse.json({
                success: false,
                error: 'Message is required'
            }, { status: 400 });
        }

        if (message.trim().length === 0) {
            return NextResponse.json({
                success: false,
                error: 'Message cannot be empty'
            }, { status: 400 });
        }

        if (message.length > 1000) {
            return NextResponse.json({
                success: false,
                error: 'Message is too long (max 1000 characters)'
            }, { status: 400 });
        }

        // Validate conversation history format
        if (!Array.isArray(conversationHistory)) {
            return NextResponse.json({
                success: false,
                error: 'Invalid conversation history format'
            }, { status: 400 });
        }

        // Limit conversation history to prevent token overflow
        const limitedHistory = conversationHistory.slice(-8);

        // Get AI response using updated service
        const aiResponse = await getChatResponse(message, limitedHistory);

        // Add user context if authenticated
        const responseData = {
            ...aiResponse,
            userId: user?.id || null,
            timestamp: new Date().toISOString()
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('Chat API error:', error);

        return NextResponse.json({
            success: false,
            error: 'An error occurred while processing your request',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

// Handle unsupported methods
export async function GET() {
    return NextResponse.json({
        success: false,
        error: 'Method not allowed'
    }, { status: 405 });
}
