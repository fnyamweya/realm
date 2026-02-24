/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@realtyos/ui',
    '@realtyos/ui-shells',
    '@realtyos/frontend-utils',
  ],
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
