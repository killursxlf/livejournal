import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: false,
    images: {
      remotePatterns: [
        {
          protocol: 'http',
          hostname: 'localhost',
          port: '3000',
          pathname: '/**',
        },
        {
          protocol: 'http',
          hostname: '192.168.178.24',
          port: '3000',
          pathname: '/**',
        },
      ],
      domains: ['lh3.googleusercontent.com'],
    },
};

export default nextConfig;
