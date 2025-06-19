import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import connectDB from '@/lib/mongodb';
import Skill from '@/models/Skill';

export async function GET() {
    try {
        await connectDB();

        // Get and verify Supabase session
        const supabase = createClient();
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError || !session) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Fetch user's skills
        const skills = await Skill.find({ ownerSupabaseId: session.user.id })
            .sort({ createdAt: -1 })
            .populate('owner', 'name email profilePicture');

        return NextResponse.json({
            success: true,
            skills: skills.map(skill => ({
                id: skill._id,
                title: skill.title,
                description: skill.description,
                category: skill.category,
                level: skill.level,
                tags: skill.tags,
                location: skill.location,
                deliveryMethod: skill.deliveryMethod,
                estimatedDuration: skill.estimatedDuration,
                isAvailable: skill.isAvailable,
                exchangeCount: skill.exchangeCount,
                viewCount: skill.viewCount,
                createdAt: skill.createdAt,
                updatedAt: skill.updatedAt
            }))
        });

    } catch (error) {
        console.error('Error fetching user skills:', error);
        return NextResponse.json(
            { error: 'Failed to fetch skills' },
            { status: 500 }
        );
    }
}
