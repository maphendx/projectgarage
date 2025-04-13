import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: process.env.NEXT_PUBLIC_API_URL?.split("https://")[1] || "localhost", 
        port: '8000', // Вказуйте порт, з якого завантажуються зображення
        pathname: '/media/**', // Вказує дозволені шляхи
      },
    ],
    domains: [process.env.NEXT_PUBLIC_API_URL?.split("https://")[1] || "localhost"]
  },
};

export default nextConfig;
