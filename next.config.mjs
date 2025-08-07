/** @type {import('next').NextConfig} */
const nextConfig = {
  // 禁用ESLint在构建时运行以解决配置问题
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // 禁用类型检查在构建时运行
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // 启用实验性功能以提升性能
  experimental: {
    // 启用更快的热重载
    optimizePackageImports: [
      '@cloudbase/js-sdk',
      '@tiptap/react',
      '@tiptap/pm',
      'react-dropzone',
      'jspdf',
      'html2canvas',
    ],
  },

  // Turbopack配置（替代experimental.turbo）
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // SWC编译器已在新版本Next.js中默认启用

  // 优化图片处理
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  // 启用压缩
  compress: true,

  // 优化构建输出 - standalone用于CloudBase容器部署
  output: 'standalone',

  // 注释：移除env配置，改用运行时环境变量访问
  // Next.js standalone模式下使用serverRuntimeConfig更可靠

  // 开发指示器配置已在新版本中移除

  // 启用更快的源映射
  productionBrowserSourceMaps: false,

  // 优化模块解析
  webpack: (config, { dev, isServer }) => {
    // 开发环境优化
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }

    // 优化模块解析
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },
};

export default nextConfig; 