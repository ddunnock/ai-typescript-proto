/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // TODO: Uncomment when packages are created:
    // transpilePackages: [
    //     '@repo/shared',
    //     '@repo/providers',
    //     '@repo/mcp',
    //     '@repo/agents',
    // ],
    experimental: {
        serverComponentsExternalPackages: ['@modelcontextprotocol/sdk'],
    },
};

export default nextConfig;