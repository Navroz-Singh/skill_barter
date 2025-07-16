import SkillView from '@/models/SkillView';
import connectDB from '@/lib/mongodb';

/**
 * Log a skill view event
 * @param {string} skillId - MongoDB ObjectId of the skill
 * @param {string|null} viewerSupabaseId - Supabase ID of viewer (null for anonymous)
 * @param {Object} request - Next.js request object for IP/headers
 */
export async function logSkillView(skillId, viewerSupabaseId = null, request = null) {
    try {
        await connectDB();

        // Get IP address and user agent from request
        let ipAddress = '127.0.0.1'; // Default fallback
        let userAgent = 'Unknown';

        if (request) {
            // Try to get real IP address
            ipAddress =
                request.headers.get('x-forwarded-for')?.split(',')[0] ||
                request.headers.get('x-real-ip') ||
                request.headers.get('cf-connecting-ip') ||
                '127.0.0.1';

            userAgent = request.headers.get('user-agent') || 'Unknown';
        }

        // Create the view record
        const skillView = new SkillView({
            skillId,
            viewerSupabaseId,
            ipAddress,
            userAgent,
            viewDate: new Date()
        });

        await skillView.save();

        // Also increment the total view count on the skill
        const { default: Skill } = await import('@/models/Skill');
        await Skill.findByIdAndUpdate(
            skillId,
            { $inc: { viewCount: 1 } },
            { new: true }
        );

        return { success: true };

    } catch (error) {
        console.error('Error logging skill view:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Check if this is likely a unique view (prevent spam/bot inflation)
 * @param {string} skillId 
 * @param {string} ipAddress 
 * @param {string|null} viewerSupabaseId 
 * @returns {boolean} True if this should be counted as a view
 */
export async function shouldCountView(skillId, ipAddress, viewerSupabaseId = null) {
    try {
        await connectDB();

        // Check for recent views from same source (last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        const query = {
            skillId,
            viewDate: { $gte: fiveMinutesAgo }
        };

        // If user is logged in, check by user ID, otherwise by IP
        if (viewerSupabaseId) {
            query.viewerSupabaseId = viewerSupabaseId;
        } else {
            query.ipAddress = ipAddress;
            query.viewerSupabaseId = null; // Ensure it's anonymous
        }

        const recentView = await SkillView.findOne(query);

        return !recentView; // Return true if no recent view found

    } catch (error) {
        console.error('Error checking view uniqueness:', error);
        return true; // Default to counting the view if check fails
    }
}
