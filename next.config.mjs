/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "nvimvpltihmsboshrksr.supabase.co",
      },
    ],
  },
};

export default nextConfig;
