/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'kezjxnkrmtahxlvafcuh.supabase.co',
          },
        ],
      },
};

export default nextConfig;
