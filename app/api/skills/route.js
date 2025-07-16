// app/api/skills/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import connectDB from '@/lib/mongodb'; // ✅ Using your existing connectDB
import Skill from '@/models/Skill';
import User from '@/models/User';

// ✅ Import the actual function name from your utils
// Change this to match your actual function name
import { updateSkillCategoryStats } from '@/utils/updateSkillCategories';

// Helper function to escape special regex characters
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Handle POST request to create a new skill with image support
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
            estimatedDuration,
            images // NEW: Extract images from request body
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

        // ✅ FIXED: More lenient image processing
        const processedImages = [];
        if (images && Array.isArray(images) && images.length > 0) {
            // Only validate if images are provided
            if (images.length > 3) {
                return NextResponse.json(
                    { error: 'Maximum 3 images allowed per skill' },
                    { status: 400 }
                );
            }

            // Process each image with better error handling
            for (const image of images) {
                // More lenient validation
                if (image && typeof image === 'object' && image.url) {
                    processedImages.push({
                        url: image.url,
                        publicId: image.publicId || '', // Allow empty publicId
                        alt: image.alt || 'Skill image'
                    });
                }
            }
        }

        // Create new skill object matching your model
        const skillData = {
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
        };

        // ✅ Only add images if they exist
        if (processedImages.length > 0) {
            skillData.images = processedImages;
        }

        const newSkill = new Skill(skillData);

        // Save skill to database
        const savedSkill = await newSkill.save();

        // Update user's skills array and stats
        await User.findByIdAndUpdate(
            mongoUser._id,
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
        
        // ✅ FIXED: Safely update skill categories with error handling
        try {
            await updateSkillCategoryStats(savedSkill.category);
        } catch (categoryError) {
            console.warn('Failed to update skill categories:', categoryError);
            // Don't fail the entire request if category update fails
        }

        // ✅ FIXED: Build response object safely
        const responseSkill = {
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
        };

        // Only include images if they exist
        if (savedSkill.images && savedSkill.images.length > 0) {
            responseSkill.images = savedSkill.images;
        }

        return NextResponse.json(
            {
                success: true,
                message: 'Skill submitted successfully!',
                skill: responseSkill
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

// ✅ UNCHANGED: Keep your existing GET function exactly as it was
export async function GET(request) {
    try {
        await connectDB();

        // Get current user to exclude their skills
        let currentUserId = null;
        try {
            const supabase = await createClient();
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            if (!authError && user) {
                const mongoUser = await User.findOne({ supabaseId: user.id });
                if (mongoUser) {
                    currentUserId = mongoUser._id;
                }
            }
        } catch (authError) {
            console.log('No authenticated user, showing all skills');
        }

        // Get query parameters for filtering
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const level = searchParams.get('level');
        const search = searchParams.get('search');
        const deliveryMethod = searchParams.get('deliveryMethod');
        const isAvailable = searchParams.get('isAvailable');
        const location = searchParams.get('location');
        const tags = searchParams.get('tags');
        const ownerName = searchParams.get('ownerName');
        const exchangeCountMin = searchParams.get('exchangeCountMin');
        const exchangeCountMax = searchParams.get('exchangeCountMax');
        const viewCountMin = searchParams.get('viewCountMin');
        const viewCountMax = searchParams.get('viewCountMax');
        const dateRange = searchParams.get('dateRange');
        const estimatedDuration = searchParams.get('estimatedDuration');
        const sortBy = searchParams.get('sortBy') || 'newest';
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = Math.min(50, parseInt(searchParams.get('limit')) || 12);

        // Calculate skip value for pagination
        const skip = (page - 1) * limit;

        // Build base match query for skills
        let baseQuery = {};

        // Exclude current user's skills from results
        if (currentUserId) {
            baseQuery.owner = { $ne: currentUserId };
        }

        // Availability filter
        if (isAvailable) {
            baseQuery.isAvailable = isAvailable === 'true';
        } else {
            baseQuery.isAvailable = true;
        }

        // Category filter
        if (category) {
            baseQuery.category = category;
        }

        // Level filter
        if (level) {
            baseQuery.level = level;
        }

        // Delivery method filter
        if (deliveryMethod) {
            baseQuery.deliveryMethod = deliveryMethod;
        }

        // Location search
        if (location && location.trim()) {
            baseQuery.location = { $regex: location.trim(), $options: 'i' };
        }

        // Tags filter
        if (tags && tags.trim()) {
            const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            if (tagsArray.length > 0) {
                baseQuery.tags = {
                    $in: tagsArray.map(tag => new RegExp(`^${escapeRegex(tag)}$`, 'i'))
                };
            }
        }

        // Text search
        if (search && search.trim()) {
            baseQuery.$or = [
                { title: { $regex: search.trim(), $options: 'i' } },
                { description: { $regex: search.trim(), $options: 'i' } }
            ];
        }

        // Exchange count range filter
        if (exchangeCountMin || exchangeCountMax) {
            baseQuery.exchangeCount = {};
            if (exchangeCountMin) {
                const min = parseInt(exchangeCountMin);
                if (!isNaN(min) && min >= 0) {
                    baseQuery.exchangeCount.$gte = min;
                }
            }
            if (exchangeCountMax) {
                const max = parseInt(exchangeCountMax);
                if (!isNaN(max) && max >= 0) {
                    baseQuery.exchangeCount.$lte = max;
                }
            }
        }

        // View count range filter
        if (viewCountMin || viewCountMax) {
            baseQuery.viewCount = {};
            if (viewCountMin) {
                const min = parseInt(viewCountMin);
                if (!isNaN(min) && min >= 0) {
                    baseQuery.viewCount.$gte = min;
                }
            }
            if (viewCountMax) {
                const max = parseInt(viewCountMax);
                if (!isNaN(max) && max >= 0) {
                    baseQuery.viewCount.$lte = max;
                }
            }
        }

        // Date range filter
        if (dateRange) {
            const now = new Date();
            let startDate;

            switch (dateRange) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                    break;
                case '3months':
                    startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                    break;
                default:
                    startDate = null;
            }

            if (startDate) {
                baseQuery.createdAt = { $gte: startDate };
            }
        }

        // Estimated duration filter
        if (estimatedDuration) {
            const durationPatterns = {
                'quick': /hour|min|quick/i,
                'short': /1-5|short/i,
                'medium': /(5-20|medium)/i,
                'long': /(20\+|long|weeks|months)/i
            };

            if (durationPatterns[estimatedDuration]) {
                baseQuery.estimatedDuration = {
                    $regex: durationPatterns[estimatedDuration]
                };
            }
        }

        // Build aggregation pipeline
        const pipeline = [
            { $match: baseQuery },
            {
                $lookup: {
                    from: 'users',
                    localField: 'owner',
                    foreignField: '_id',
                    as: 'ownerInfo'
                }
            },
            {
                $unwind: {
                    path: '$ownerInfo',
                    preserveNullAndEmptyArrays: true
                }
            }
        ];

        // Add owner name filter if provided
        if (ownerName && ownerName.trim()) {
            pipeline.push({
                $match: {
                    'ownerInfo.name': { $regex: ownerName.trim(), $options: 'i' }
                }
            });
        }

        // Add popularity score if needed for sorting
        if (sortBy === 'mostPopular') {
            pipeline.push({
                $addFields: {
                    popularityScore: {
                        $add: ['$viewCount', { $multiply: ['$exchangeCount', 2] }]
                    }
                }
            });
        }

        // Add sorting
        let sortStage = {};
        switch (sortBy) {
            case 'oldest':
                sortStage = { createdAt: 1 };
                break;
            case 'mostViewed':
                sortStage = { viewCount: -1, createdAt: -1 };
                break;
            case 'mostExchanged':
                sortStage = { exchangeCount: -1, createdAt: -1 };
                break;
            case 'alphabetical':
                sortStage = { title: 1 };
                break;
            case 'alphabeticalDesc':
                sortStage = { title: -1 };
                break;
            case 'mostPopular':
                sortStage = { popularityScore: -1, createdAt: -1 };
                break;
            case 'newest':
            default:
                sortStage = { createdAt: -1 };
                break;
        }

        pipeline.push({ $sort: sortStage });
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit });

        // Project the final result structure
        pipeline.push({
            $project: {
                _id: 1,
                title: 1,
                description: 1,
                category: 1,
                level: 1,
                tags: 1,
                images: 1,
                location: 1,
                deliveryMethod: 1,
                estimatedDuration: 1,
                exchangeCount: 1,
                viewCount: 1,
                isAvailable: 1,
                createdAt: 1,
                owner: {
                    name: { $ifNull: ['$ownerInfo.name', 'Anonymous'] },
                    email: { $ifNull: ['$ownerInfo.email', ''] },
                    avatar: { $ifNull: ['$ownerInfo.avatar', ''] },
                    rating: { $ifNull: ['$ownerInfo.rating', 0] }
                }
            }
        });

        // Execute the main query
        const skills = await Skill.aggregate(pipeline);

        // Get total count
        const countPipeline = [
            { $match: baseQuery },
            {
                $lookup: {
                    from: 'users',
                    localField: 'owner',
                    foreignField: '_id',
                    as: 'ownerInfo'
                }
            },
            {
                $unwind: {
                    path: '$ownerInfo',
                    preserveNullAndEmptyArrays: true
                }
            }
        ];

        if (ownerName && ownerName.trim()) {
            countPipeline.push({
                $match: {
                    'ownerInfo.name': { $regex: ownerName.trim(), $options: 'i' }
                }
            });
        }

        countPipeline.push({ $count: "total" });

        const totalResult = await Skill.aggregate(countPipeline);
        const total = totalResult[0]?.total || 0;
        const totalPages = Math.ceil(total / limit);

        return NextResponse.json({
            success: true,
            data: {
                skills: skills,
                total: total,
                currentPage: page,
                totalPages: totalPages
            }
        });

    } catch (error) {
        console.error('Error fetching skills:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch skills',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
}
