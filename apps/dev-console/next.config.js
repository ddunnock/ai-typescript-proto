/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: [
        '@convergence/shared',
        '@convergence/providers',
        '@convergence/mcp',
        '@convergence/agents',
    ],
    experimental: {
        serverComponentsExternalPackages: ['@modelcontextprotocol/sdk'],
    },
};

export default nextConfig;