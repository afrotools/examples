import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    'b104-2a01-e0a-eee-a340-6846-432d-2f2f-449a.ngrok-free.app',
    '192.168.1.182',
  ],
};

export default nextConfig;
