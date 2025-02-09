import type { NextConfig } from "next";

console.log("NEXTAUTH_URL (из process.env):", process.env.NEXTAUTH_URL);

const nextConfig: NextConfig = {
    images: {
        domains: ['localhost'], 
    }
};

export default nextConfig;
