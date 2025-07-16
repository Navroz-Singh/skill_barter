import { NextResponse } from "next/server";
import User from "@/models/User";
import connectDB from "@/lib/mongodb";

export async function GET(request, { params }) {
    const { id } = await params;
    await connectDB();
    const user = await User.findOne({ supabaseId: id });
    if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({
        success: true,
        user
    });
}
