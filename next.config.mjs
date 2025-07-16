/** @type {import('next').NextConfig} */
const nextConfig = {
    // Image optimization
    images: {
        domains: ['lh3.googleusercontent.com', 'res.cloudinary.com', 'www.thesprucepets.com'],
        minimumCacheTTL: 86400, // 24 hours
        deviceSizes: [640, 828, 1200, 1920],
        imageSizes: [32, 64, 96, 128, 256],
    },

    // Enable compression
    compress: true,

    // Experimental performance features
    experimental: {
        optimizePackageImports: ['lucide-react'],
    },

    // Simple caching headers
    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, s-maxage=60, stale-while-revalidate=300',
                    },
                ],
            },
        ];
    },

    // Tree shake lucide-react icons
    modularizeImports: {
        'lucide-react': {
            transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
        },
    },
};

export default nextConfig;
