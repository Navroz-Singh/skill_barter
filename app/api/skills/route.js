import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import connectDB from '@/lib/mongodb';
import Skill from '@/models/Skill';
import User from '@/models/User';

// Handle POST request to create a new skill
export async function POST(request) {
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
        await connectDB();

        // Get request body
        const body = await request.json();
        const {
            title,
            description,
            category,
            level,
            tags,
            location,
            deliveryMethod,
            estimatedDuration
        } = body;

        // Validate required fields
        if (!title || !description || !category || !level) {
            return NextResponse.json(
                { error: 'Title, description, category, and level are required' },
                { status: 400 }
            );
        }

        // Find user in MongoDB using Supabase user ID
        const mongoUser = await User.findOne({ supabaseId: user.id });

        if (!mongoUser) {
            return NextResponse.json(
                { error: 'User profile not found. Please complete your profile first.' },
                { status: 404 }
            );
        }

        // Validate category and level against enum values
        const validCategories = ['Technology', 'Design', 'Business', 'Language', 'Photography', 'Music', 'Handcraft', 'Education', 'Other'];
        const validLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

        if (!validCategories.includes(category)) {
            return NextResponse.json(
                { error: 'Invalid category selected' },
                { status: 400 }
            );
        }

        if (!validLevels.includes(level)) {
            return NextResponse.json(
                { error: 'Invalid skill level selected' },
                { status: 400 }
            );
        }

        // Process tags - ensure they don't exceed character limit
        const processedTags = Array.isArray(tags)
            ? tags.map(tag => tag.trim()).filter(tag => tag && tag.length <= 30)
            : [];

        // Create new skill object matching your model
        const newSkill = new Skill({
            title: title.trim(),
            description: description.trim(),
            category: category,
            level: level,
            tags: processedTags,
            owner: mongoUser._id,
            ownerSupabaseId: user.id,
            location: location?.trim() || '',
            deliveryMethod: deliveryMethod || 'Both',
            estimatedDuration: estimatedDuration?.trim() || '',
            isAvailable: true,
            exchangeCount: 0,
            viewCount: 0,
            interestedUsers: []
        });

        // Save skill to database
        const savedSkill = await newSkill.save();

        // Update user's skills array and stats
        await User.findByIdAndUpdate(
            mongoUser.id,
            {
                $push: { skills: savedSkill._id },
                $inc: {
                    'stats.totalSkills': 1,
                    'stats.activeSkills': 1
                },
                $set: { lastActive: new Date() }
            }
        );

        // Populate owner details for response
        await savedSkill.populate('owner', 'name email avatar');

        return NextResponse.json(
            {
                success: true,
                message: 'Skill submitted successfully!',
                skill: {
                    id: savedSkill._id,
                    title: savedSkill.title,
                    description: savedSkill.description,
                    category: savedSkill.category,
                    level: savedSkill.level,
                    tags: savedSkill.tags,
                    location: savedSkill.location,
                    deliveryMethod: savedSkill.deliveryMethod,
                    estimatedDuration: savedSkill.estimatedDuration,
                    isAvailable: savedSkill.isAvailable,
                    exchangeCount: savedSkill.exchangeCount,
                    viewCount: savedSkill.viewCount,
                    createdAt: savedSkill.createdAt,
                    owner: {
                        name: savedSkill.owner.name,
                        email: savedSkill.owner.email,
                        avatar: savedSkill.owner.avatar
                    }
                }
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('Error creating skill:', error);

        // Handle validation errors from Mongoose
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return NextResponse.json(
                { error: validationErrors.join(', ') },
                { status: 400 }
            );
        }

        // Handle duplicate skill error (if you have unique indexes)
        if (error.code === 11000) {
            return NextResponse.json(
                { error: 'You have already submitted a skill with this title' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create skill. Please try again.' },
            { status: 500 }
        );
    }
}

// Handle GET request to fetch skills
export async function GET(request) {
    try {
        await connectDB();

        // Get query parameters for filtering
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const level = searchParams.get('level');
        const search = searchParams.get('search');
        const deliveryMethod = searchParams.get('deliveryMethod');
        const location = searchParams.get('location');
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;

        // Build query object - only show available skills
        let query = { isAvailable: true };

        if (category) {
            query.category = category;
        }

        if (level) {
            query.level = level;
        }

        if (deliveryMethod) {
            query.deliveryMethod = deliveryMethod;
        }

        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        // Calculate skip value for pagination
        const skip = (page - 1) * limit;

        // Fetch skills with owner details, sorted by newest first
        const skills = await Skill.find(query)
            .populate('owner', 'name email avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Get total count for pagination
        const totalSkills = await Skill.countDocuments(query);
        const totalPages = Math.ceil(totalSkills / limit);

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
                exchangeCount: skill.exchangeCount,
                viewCount: skill.viewCount,
                createdAt: skill.createdAt,
                owner: {
                    name: skill.owner.name,
                    email: skill.owner.email,
                    avatar: skill.owner.avatar
                }
            })),
            pagination: {
                currentPage: page,
                totalPages,
                totalSkills,
                hasNext: page < totalPages,
                hasPrev: page > 1
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
