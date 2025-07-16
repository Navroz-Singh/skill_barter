import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import connectDB from '@/lib/mongodb';
import SkillView from '@/models/SkillView';
import Exchange from '@/models/Exchange';
import Skill from '@/models/Skill';

export async function GET() {
    try {
        // Authenticate user
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({
                success: false,
                error: 'Authentication required'
            }, { status: 401 });
        }

        await connectDB();

        // Get date ranges
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        const eightWeeksAgo = new Date();
        eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
        eightWeeksAgo.setHours(0, 0, 0, 0);

        // Get user's skills to filter views
        const userSkills = await Skill.find({
            ownerSupabaseId: user.id
        }).select('_id');

        const skillIds = userSkills.map(skill => skill._id);

        // 1. Get daily skill views for last 30 days
        const skillViewsData = await SkillView.aggregate([
            {
                $match: {
                    skillId: { $in: skillIds },
                    viewDate: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$viewDate' },
                        month: { $month: '$viewDate' },
                        day: { $dayOfMonth: '$viewDate' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
            }
        ]);

        // 3. Format daily skill views data for Chart.js
        const last30Days = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            // Find matching data from aggregation
            const matchingData = skillViewsData.find(item => {
                const itemDate = new Date(item._id.year, item._id.month - 1, item._id.day);
                return itemDate.getTime() === date.getTime();
            });

            last30Days.push({
                date: date.toISOString().split('T')[0], // YYYY-MM-DD format
                count: matchingData ? matchingData.count : 0,
                label: date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                })
            });
        }

        // FIXED: 4. Format weekly exchange data with proper week calculation
        const last8Weeks = [];
        const now = new Date();

        for (let i = 7; i >= 0; i--) {
            // Calculate the start of the week (Monday) for each week
            const weekStart = getWeekStart(new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000)));
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);

            // Get exchanges for this specific week range
            const weekExchanges = await Exchange.countDocuments({
                $or: [
                    { 'initiator.supabaseId': user.id },
                    { 'recipient.supabaseId': user.id }
                ],
                createdAt: {
                    $gte: weekStart,
                    $lte: weekEnd
                }
            });

            // Generate proper labels
            let weekLabel;
            if (i === 0) {
                weekLabel = 'This Week';
            } else if (i === 1) {
                weekLabel = 'Last Week';
            } else {
                // Use week number and month for clarity
                const weekNumber = getWeekNumber(weekStart);
                const monthName = weekStart.toLocaleDateString('en-US', { month: 'short' });
                weekLabel = `Week ${weekNumber} (${monthName})`;
            }

            last8Weeks.push({
                week: weekLabel,
                count: weekExchanges,
                weekStart: weekStart.toISOString().split('T')[0],
                weekEnd: weekEnd.toISOString().split('T')[0],
                weekNumber: getWeekNumber(weekStart),
                year: weekStart.getFullYear()
            });
        }

        // 5. Get summary statistics
        const totalViews = skillViewsData.reduce((sum, item) => sum + item.count, 0);
        const totalExchanges = last8Weeks.reduce((sum, item) => sum + item.count, 0);

        return NextResponse.json({
            success: true,
            data: {
                skillViews: {
                    daily: last30Days,
                    total: totalViews,
                    period: '30 days'
                },
                exchanges: {
                    weekly: last8Weeks,
                    total: totalExchanges,
                    period: '8 weeks'
                },
                summary: {
                    totalSkillViews: totalViews,
                    totalExchanges: totalExchanges,
                    avgViewsPerDay: totalViews / 30,
                    avgExchangesPerWeek: totalExchanges / 8
                }
            }
        });

    } catch (error) {
        console.error('Analytics API error:', error);

        return NextResponse.json({
            success: false,
            error: 'Failed to fetch analytics data',
            details: error.message
        }, { status: 500 });
    }
}

// FIXED: Helper function to get the start of the week (Monday)
function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const weekStart = new Date(d.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
}

// Helper function to get ISO week number
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Handle unsupported methods
export async function POST() {
    return NextResponse.json({
        success: false,
        error: 'Method not allowed'
    }, { status: 405 });
}
