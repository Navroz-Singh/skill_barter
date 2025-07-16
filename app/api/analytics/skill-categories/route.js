// app/api/analytics/skill-categories/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SkillCategory from '@/models/SkillCategory';
import Skill from '@/models/Skill';

export async function GET() {
    try {
        await connectDB();

        // Get all skill categories with their stats
        let categories = await SkillCategory.find({})
            .sort({ skillCount: -1 })
            .select('name userCount skillCount totalViews totalExchanges popularLevel popularDeliveryMethod');

        // If no categories exist yet, create them from actual skills
        if (categories.length === 0) {
            const categoryNames = ['Technology', 'Design', 'Business', 'Language', 'Photography', 'Music', 'Handcraft', 'Education', 'Other'];

            // Initialize categories with current skill data
            for (const categoryName of categoryNames) {
                const skills = await Skill.find({ category: categoryName });
                const uniqueUsers = new Set(skills.map(skill => skill.owner.toString()));

                const categoryData = {
                    name: categoryName,
                    skillCount: skills.length,
                    userCount: uniqueUsers.size,
                    totalViews: skills.reduce((sum, skill) => sum + skill.viewCount, 0),
                    totalExchanges: skills.reduce((sum, skill) => sum + skill.exchangeCount, 0),
                    popularLevel: 'Beginner', // Default, will be calculated later
                    popularDeliveryMethod: 'Both' // Default
                };

                await SkillCategory.create(categoryData);
            }

            // Fetch the newly created categories
            categories = await SkillCategory.find({})
                .sort({ skillCount: -1 })
                .select('name userCount skillCount totalViews totalExchanges popularLevel popularDeliveryMethod');
        }

        return NextResponse.json({
            success: true,
            categories
        });
    } catch (error) {
        console.error('Error fetching skill categories:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

// PUT route to update a specific category's stats
export async function PUT(request) {
    try {
        await connectDB();
        const { categoryName } = await request.json();

        if (!categoryName) {
            return NextResponse.json({
                success: false,
                error: 'Category name is required'
            }, { status: 400 });
        }

        let category = await SkillCategory.findOne({ name: categoryName });

        if (!category) {
            category = new SkillCategory({ name: categoryName });
        }

        await category.updateStats();

        return NextResponse.json({
            success: true,
            category
        });
    } catch (error) {
        console.error('Error updating skill category:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
