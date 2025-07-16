// app/api/user/profile/route.js

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function PATCH(req) {
    try {
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const updateData = await req.json();
        
        // Validate the data
        if (updateData.name && updateData.name.length > 60) {
            return NextResponse.json({ error: 'Name too long' }, { status: 400 });
        }
        
        if (updateData.bio && updateData.bio.length > 500) {
            return NextResponse.json({ error: 'Bio too long' }, { status: 400 });
        }
        
        if (updateData.location && updateData.location.length > 100) {
            return NextResponse.json({ error: 'Location too long' }, { status: 400 });
        }

        await connectDB();

        // Build update object
        const mongoUpdateData = {
            lastActive: new Date()
        };

        // Track which fields are being edited
        const editedFields = {};

        if (updateData.name !== undefined) {
            mongoUpdateData.name = updateData.name;
            editedFields['profileEditedFields.name'] = true;
        }

        if (updateData.avatar !== undefined) {
            mongoUpdateData.avatar = updateData.avatar;
            editedFields['profileEditedFields.avatar'] = true;
        }

        if (updateData.bio !== undefined) {
            mongoUpdateData.bio = updateData.bio;
            editedFields['profileEditedFields.bio'] = true;
        }

        if (updateData.location !== undefined) {
            mongoUpdateData.location = updateData.location;
            editedFields['profileEditedFields.location'] = true;
        }

        if (updateData.preferences) {
            mongoUpdateData.preferences = updateData.preferences;
        }

        // Combine the updates
        const finalUpdateData = { ...mongoUpdateData, ...editedFields };

        const updatedUser = await User.findOneAndUpdate(
            { supabaseId: user.id },
            { $set: finalUpdateData },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
