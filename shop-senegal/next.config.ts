import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    'f809-2a01-e0a-eee-a340-500b-8817-c743-ee07.ngrok-free.app',
    '192.168.1.182',
  ],
};

export default nextConfig;
