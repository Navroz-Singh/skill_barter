import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import connectDB from '@/lib/mongodb';
import Skill from '@/models/Skill';
import User from '@/models/User';

// GET - Fetch all skills with filtering
export async function GET(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const level = searchParams.get('level');
        const available = searchParams.get('available');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 12;
        const skip = (page - 1) * limit;

        // Build query
        let query = {};

        if (category && category !== 'all') {
            query.category = category;
        }

        if (level && level !== 'all') {
            query.level = level;
        }

        if (available !== null && available !== undefined) {
            query.isAvailable = available === 'true';
        }

        // Simple search instead of text search
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Execute query with pagination
        const skills = await Skill.find(query)
            .populate('owner', 'name email avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Skill.countDocuments(query);

        return NextResponse.json({
            skills,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching skills:', error);
        return NextResponse.json(
            { error: 'Failed to fetch skills' },
            { status: 500 }
        );
    }
}

// POST - Create new skill
export async function POST(request) {
    try {
        await connectDB();

        // Verify authentication
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { title, description, category, level, tags, images, location, deliveryMethod, estimatedDuration } = body;

        // Validation
        if (!title || !description || !category || !level) {
            return NextResponse.json(
                { error: 'Title, description, category, and level are required' },
                { status: 400 }
            );
        }

        // Find the MongoDB user
        const mongoUser = await User.findOne({ supabaseId: user.id });
        if (!mongoUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Create skill
        const skill = new Skill({
            title: title.trim(),
            description: description.trim(),
            category,
            level,
            tags: tags ? tags.map(tag => tag.trim()).filter(tag => tag.length > 0) : [],
            images: images || [],
            owner: mongoUser._id,
            ownerSupabaseId: user.id,
            location: location?.trim(),
            deliveryMethod: deliveryMethod || 'Both',
            estimatedDuration: estimatedDuration?.trim()
        });

        await skill.save();

        // Update user's skills array
        await User.findByIdAndUpdate(
            mongoUser._id,
            { $push: { skills: skill._id } }
        );

        // Populate owner data for response
        await skill.populate('owner', 'name email avatar');

        return NextResponse.json({
            message: 'Skill created successfully',
            skill
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating skill:', error);

        if (error.name === 'ValidationError') {
            return NextResponse.json(
                { error: 'Validation error', details: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create skill' },
            { status: 500 }
        );
    }
}
