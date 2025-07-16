// app/api/skills/[id]/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import connectDB from '@/lib/mongodb';
import Skill from '@/models/Skill';
import User from '@/models/User';
import { logSkillView, shouldCountView } from '@/lib/analytics';

// GET - Fetch single skill by ID with view tracking
export async function GET(request, { params }) {
    const { id } = await params;

    await connectDB();
    try {
        const skill = await Skill.findById(id)
            .populate('owner', 'name avatar bio location rating reviewCount');

        if (!skill) {
            return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
        }

        // Get current user (optional - works for both authenticated and anonymous)
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Extract IP address for tracking
        const ipAddress =
            request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            request.headers.get('cf-connecting-ip') ||
            '127.0.0.1';

        // Check if we should count this view (prevents spam)
        const shouldCount = shouldCountView(
            id,
            ipAddress,
            user?.id || null
        );

        // Log the view if it's valid and not the skill owner viewing their own skill
        if (shouldCount && (!user || user.id !== skill.ownerSupabaseId)) {
            // Log view in background (don't wait for it to complete)
            logSkillView(id, user?.id || null, request).catch(error => {
                console.error('Failed to log skill view:', error);
                // Don't throw error - just log it so page loading isn't affected
            });
        }

        return NextResponse.json({ 
            success: true,
            skill 
        });
    } catch (error) {
        console.error('Error fetching skill:', error);
        return NextResponse.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
}

// PUT - Update skill with image support
export async function PUT(request, { params }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ 
            success: false,
            error: 'Authentication required' 
        }, { status: 401 });
    }

    await connectDB();
    try {
        const { id } = await params;
        const body = await request.json();

        const skill = await Skill.findById(id);
        if (!skill) {
            return NextResponse.json({ 
                success: false,
                error: 'Skill not found' 
            }, { status: 404 });
        }

        if (skill.ownerSupabaseId !== user.id) {
            return NextResponse.json({ 
                success: false,
                error: 'You can only edit your own skills' 
            }, { status: 403 });
        }

        // ✅ Updated: Include 'images' in allowed fields
        const allowedFields = [
            'title', 
            'description', 
            'category', 
            'level', 
            'tags', 
            'images', // ✅ Added images support
            'location', 
            'deliveryMethod', 
            'estimatedDuration', 
            'isAvailable'
        ];

        // Validate images if provided
        if (body.images && Array.isArray(body.images)) {
            if (body.images.length > 3) {
                return NextResponse.json({ 
                    success: false,
                    error: 'Maximum 3 images allowed per skill' 
                }, { status: 400 });
            }

            // Validate each image structure
            for (const image of body.images) {
                if (!image.url || !image.publicId) {
                    return NextResponse.json({ 
                        success: false,
                        error: 'Invalid image data. URL and publicId are required.' 
                    }, { status: 400 });
                }

                // Validate Cloudinary URL
                if (!image.url.includes('cloudinary.com')) {
                    return NextResponse.json({ 
                        success: false,
                        error: 'Invalid image URL. Only Cloudinary URLs are allowed.' 
                    }, { status: 400 });
                }
            }
        }

        // Update allowed fields only
        allowedFields.forEach(field => {
            if (body[field] !== undefined) {
                skill[field] = body[field];
            }
        });

        await skill.save();

        // Populate owner details for response
        await skill.populate('owner', 'name avatar bio location rating reviewCount');

        return NextResponse.json({ 
            success: true,
            message: 'Skill updated successfully',
            skill 
        });
    } catch (error) {
        console.error('Error updating skill:', error);
        return NextResponse.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
}

// DELETE - Delete skill with enhanced error handling
export async function DELETE(request, { params }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ 
            success: false,
            error: 'Authentication required' 
        }, { status: 401 });
    }

    await connectDB();
    try {
        const { id } = await params;
        
        const skill = await Skill.findById(id);
        if (!skill) {
            return NextResponse.json({ 
                success: false,
                error: 'Skill not found' 
            }, { status: 404 });
        }

        if (skill.ownerSupabaseId !== user.id) {
            return NextResponse.json({ 
                success: false,
                error: 'You can only delete your own skills' 
            }, { status: 403 });
        }

        // Update user stats
        const mongoUser = await User.findOne({ supabaseId: user.id });
        if (mongoUser) {
            await User.findByIdAndUpdate(mongoUser._id, {
                $pull: { skills: id },
                $inc: {
                    'stats.totalSkills': -1,
                    'stats.activeSkills': skill.isAvailable ? -1 : 0
                }
            });
        }

        await skill.deleteOne();

        return NextResponse.json({ 
            success: true,
            message: 'Skill deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting skill:', error);
        return NextResponse.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
}
