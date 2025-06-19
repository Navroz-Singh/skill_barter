import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import connectDB from '@/lib/mongodb';
import Skill from '@/models/Skill';

export async function GET(req) {
    try {
        // Get and verify Supabase session
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Connect to MongoDB after successful auth
        await connectDB();

        // Fetch user's skills
        const skills = await Skill.find({ ownerSupabaseId: user.id })
            .sort({ createdAt: -1 })
            .populate('owner', 'name email avatar'); // Changed from 'profilePicture' to 'avatar'

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
                updatedAt: skill.updatedAt,
                // Include owner details in response
                owner: {
                    name: skill.owner.name,
                    email: skill.owner.email,
                    avatar: skill.owner.avatar
                }
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
