/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 在构建时禁用 ESLint 检查
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 在构建时禁用 TypeScript 类型检查
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // 解决 Node.js 模块在客户端构建中的问题
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        https: false,
        string_decoder: false,
        timers: false,
        // 可能需要添加其他 Node.js 模块
        fs: false,
        path: false,
        crypto: false,
        os: false,
        stream: false,
        buffer: false,
        util: false,
        url: false,
        http: false,
        net: false,
        tls: false,
        zlib: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
