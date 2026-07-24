/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@querydash/ui', '@querydash/types'],
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
};

export default nextConfig;
