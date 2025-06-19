import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
    // Create response object
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    // Create Supabase client for middleware
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value);
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    // Get current user session
    const { data: { user } } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // Define protected routes (routes that need authentication)
    const protectedRoutes = ['/dashboard', '/my-skills', '/exchanges', '/profile'];
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    // Define auth routes (routes for login/signup)
    const authRoutes = ['/auth'];
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

    // Redirect unauthenticated users from protected routes to auth
    if (isProtectedRoute && !user) {
        return NextResponse.redirect(new URL('/auth', request.url));
    }

    // Redirect authenticated users from auth routes to dashboard
    if (isAuthRoute && user) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc.)
         * - API routes
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)',
    ],
};
