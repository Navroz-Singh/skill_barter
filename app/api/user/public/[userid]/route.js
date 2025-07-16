// app/api/user/public/[userid]/route.js

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Skill from '@/models/Skill';

export async function GET(req, { params }) {
    try {
        const { userid } = await params;

        if (!userid) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        await connectDB();

        // Fetch user data
        const user = await User.findById(userid).select(
            'name avatar bio location rating reviewCount stats createdAt isActive preferences'
        );

        if (!user || !user.isActive) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Fetch user's public skills
        const skills = await Skill.find({
            owner: userid,
            isAvailable: true
        }).select('title description category level viewCount interestedUsers');

        // Prepare public user data respecting privacy settings
        const publicUserData = {
            _id: user._id,
            name: user.name,
            avatar: user.avatar,
            bio: user.bio,
            location: user.preferences?.privacy?.showLocation ? user.location : null,
            rating: user.rating,
            reviewCount: user.reviewCount,
            stats: user.stats,
            memberSince: user.createdAt,
            skillCount: skills.length,
            skills: skills.map(skill => ({
                _id: skill._id,
                title: skill.title,
                description: skill.description,
                category: skill.category,
                level: skill.level,
                viewCount: skill.viewCount || 0,
                interestedCount: skill.interestedUsers?.length || 0
            }))
        };

        return NextResponse.json({ user: publicUserData });
    } catch (error) {
        console.error('Error fetching public user data:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
