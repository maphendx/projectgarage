import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000', // Вказуйте порт, з якого завантажуються зображення
        pathname: '/media/**', // Вказує дозволені шляхи
      },
    ],
  },
};

export default nextConfig;
