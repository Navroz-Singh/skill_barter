import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req) {
    try {
        // Check if user is authenticated
        const supabase = await createClient();
        const authHeader = req.headers.get('authorization');
        let authResult;
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.slice(7);
            authResult = await supabase.auth.getUser(token);
        } else {
            authResult = await supabase.auth.getUser();
        }
        const { data: { user }, error } = authResult;

        if (error || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Connect to database
        await connectDB();

        // Check if user exists in MongoDB
        let mongoUser = await User.findOne({ supabaseId: user.id });

        if (!mongoUser) {
            // Create new user in MongoDB
            mongoUser = await User.create({
                supabaseId: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.email.split('@')[0],
                avatar: user.user_metadata?.avatar_url,
                bio: '',
                location: '',
                preferences: {
                    notifications: {
                        email: true,
                        push: true,
                        exchanges: true,
                        messages: true,
                    },
                    privacy: {
                        showEmail: false,
                        showLocation: true,
                        profileVisibility: 'public',
                    }
                },
                stats: {
                    totalSkills: 0,
                    activeSkills: 0,
                    totalViews: 0,
                    successfulExchanges: 0,
                },
                lastActive: new Date(),
            });
        } else {
            // Update existing user
            const updateData = {
                lastActive: new Date(),
            };

            // Sync data from Supabase if changed
            if (user.user_metadata?.full_name && user.user_metadata.full_name !== mongoUser.name) {
                updateData.name = user.user_metadata.full_name;
            }

            if (user.user_metadata?.avatar_url && user.user_metadata.avatar_url !== mongoUser.avatar) {
                updateData.avatar = user.user_metadata.avatar_url;
            }

            if (user.email && user.email !== mongoUser.email) {
                updateData.email = user.email;
            }

            // Initialize missing fields for existing users
            if (!mongoUser.preferences) {
                updateData.preferences = {
                    notifications: {
                        email: true,
                        push: true,
                        exchanges: true,
                        messages: true,
                    },
                    privacy: {
                        showEmail: false,
                        showLocation: true,
                        profileVisibility: 'public',
                    }
                };
            }

            if (!mongoUser.stats) {
                updateData.stats = {
                    totalSkills: 0,
                    activeSkills: 0,
                    totalViews: 0,
                    successfulExchanges: 0,
                };
            }

            mongoUser = await User.findByIdAndUpdate(
                mongoUser._id,
                updateData,
                { new: true, runValidators: true }
            );
        }

        // Return safe user data
        const safeUserData = {
            _id: mongoUser._id,
            supabaseId: mongoUser.supabaseId,
            email: mongoUser.email,
            name: mongoUser.name,
            avatar: mongoUser.avatar,
            bio: mongoUser.bio,
            location: mongoUser.location,
            rating: mongoUser.rating,
            reviewCount: mongoUser.reviewCount,
            isActive: mongoUser.isActive,
            stats: mongoUser.stats,
            createdAt: mongoUser.createdAt,
            lastActive: mongoUser.lastActive,
        };

        return NextResponse.json({ user: safeUserData }, { status: 200 });
    } catch (error) {
        console.error('User sync error:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            return NextResponse.json({
                error: 'User data validation failed',
                details: error.message
            }, { status: 400 });
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            return NextResponse.json({
                error: 'User already exists with this email or Supabase ID'
            }, { status: 409 });
        }

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
