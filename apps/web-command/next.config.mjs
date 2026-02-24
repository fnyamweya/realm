/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@realtyos/ui',
    '@realtyos/ui-shells',
    '@realtyos/frontend-utils',
    '@realtyos/sdk',
    '@realtyos/auth-web',
    '@realtyos/config-web',
    '@realtyos/policy-ui',
    '@realtyos/forms',
    '@realtyos/tables',
    '@realtyos/telemetry-web',
  ],
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
