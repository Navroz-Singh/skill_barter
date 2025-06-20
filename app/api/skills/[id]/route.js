import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import connectDB from '@/lib/mongodb';
import Skill from '@/models/Skill';
import User from '@/models/User';

// GET - Fetch single skill by ID
export async function GET(request, { params }) {
    const { id } = await params;
    
    await connectDB();
    try {
        const skill = await Skill.findById(id)
            .populate('owner', 'name avatar bio location rating reviewCount');

        if (!skill) {
            return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
        }

        return NextResponse.json({ skill });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT - Update skill
export async function PUT(request, { params }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectDB();
    try {
        const { id } = await params;
        const body = await request.json();
        
        const skill = await Skill.findById(id);
        if (!skill) {
            return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
        }

        if (skill.ownerSupabaseId !== user.id) {
            return NextResponse.json({ error: 'You can only edit your own skills' }, { status: 403 });
        }

        // Update allowed fields only
        const allowedFields = ['title', 'description', 'category', 'level', 'tags', 'location', 'deliveryMethod', 'estimatedDuration', 'isAvailable'];

        allowedFields.forEach(field => {
            if (body[field] !== undefined) {
                skill[field] = body[field];
            }
        });

        await skill.save();

        return NextResponse.json({ skill });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE - Delete skill
export async function DELETE(request, { params }) {
    const supabase = await createClient();
    const { id } = await params;
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectDB();
    try {
        const skill = await Skill.findById(id);
        if (!skill) {
            return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
        }

        if (skill.ownerSupabaseId !== user.id) {
            return NextResponse.json({ error: 'You can only delete your own skills' }, { status: 403 });
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

        return NextResponse.json({ message: 'Skill deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
