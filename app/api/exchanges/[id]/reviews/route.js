// app/api/exchanges/[id]/reviews/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import connectDB from '@/lib/mongodb';
import Review from '@/models/Review';
import Exchange from '@/models/Exchange';
import User from '@/models/User';


// GET: Check if user has reviewed or fetch all reviews
export async function GET(request, { params }) {
    try {
      await connectDB();
  
      const { searchParams } = new URL(request.url);
      const checkUserId = searchParams.get('checkUserId'); // New parameter to check specific user
      
      const { id: exchangeId } = await params;
  
      // If checkUserId is provided, check if that user has reviewed this exchange
      if (checkUserId) {
        const userReview = await Review.findOne({
          exchangeId,
          reviewerId: checkUserId
        });
  
        return NextResponse.json({
          success: true,
          hasReviewed: !!userReview,
          review: userReview || null
        });
      }
  
      // Otherwise, fetch all reviews for the exchange (existing functionality)
      const reviews = await Review.find({ exchangeId })
        .populate('reviewerId', 'name avatar')
        .populate('revieweeId', 'name avatar')
        .sort({ createdAt: -1 });
  
      return NextResponse.json({
        success: true,
        reviews
      });
  
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }
  }

// POST: Submit a review
export async function POST(request, { params }) {
    try {
        await connectDB();

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { id: exchangeId } = await params;
        const { rating, comment } = await request.json();

        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json(
                { success: false, error: 'Rating must be between 1 and 5' },
                { status: 400 }
            );
        }

        // Check if exchange exists and is completed
        const exchange = await Exchange.findById(exchangeId);
        if (!exchange) {
            return NextResponse.json(
                { success: false, error: 'Exchange not found' },
                { status: 404 }
            );
        }

        if (exchange.status !== 'completed') {
            return NextResponse.json(
                { success: false, error: 'Can only review completed exchanges' },
                { status: 400 }
            );
        }

        // Get reviewer
        const reviewer = await User.findOne({ supabaseId: user.id });
        if (!reviewer) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Determine reviewee
        let revieweeId = null;
        if (exchange.initiator?.supabaseId === user.id) {
            revieweeId = exchange.recipient?.userId;
        } else if (exchange.recipient?.supabaseId === user.id) {
            revieweeId = exchange.initiator?.userId;
        } else {
            return NextResponse.json(
                { success: false, error: 'You are not part of this exchange' },
                { status: 403 }
            );
        }

        // Check if review already exists
        const existingReview = await Review.findOne({
            exchangeId,
            reviewerId: reviewer._id
        });

        if (existingReview) {
            return NextResponse.json(
                { success: false, error: 'You have already reviewed this exchange' },
                { status: 400 }
            );
        }

        // Create review
        const review = new Review({
            exchangeId,
            reviewerId: reviewer._id,
            revieweeId,
            rating,
            comment: comment?.trim() || ''
        });

        await review.save();

        // Update reviewee's rating and review count
        const userReviews = await Review.find({ revieweeId });
        const totalRating = userReviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = userReviews.length > 0 ? totalRating / userReviews.length : 0;

        await User.findByIdAndUpdate(revieweeId, {
            rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal place
            reviewCount: userReviews.length
        });

        return NextResponse.json({
            success: true,
            message: 'Review submitted successfully',
            review
        });

    } catch (error) {
        console.error('Error submitting review:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to submit review' },
            { status: 500 }
        );
    }
}

