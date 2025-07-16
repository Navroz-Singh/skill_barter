// utils/updateSkillCategories.js
import SkillCategory from '@/models/SkillCategory';

export async function updateSkillCategoryStats(categoryName) {
    try {
        let category = await SkillCategory.findOne({ name: categoryName });

        if (!category) {
            category = new SkillCategory({ name: categoryName });
        }

        await category.updateStats();
        return category;
    } catch (error) {
        console.error('Error updating skill category stats:', error);
        throw error;
    }
}

// Update all categories
export async function updateAllCategoryStats() {
    const categories = ['Technology', 'Design', 'Business', 'Language', 'Photography', 'Music', 'Handcraft', 'Education', 'Other'];

    for (const categoryName of categories) {
        await updateSkillCategoryStats(categoryName);
    }
}
