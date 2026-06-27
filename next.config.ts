import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 这个项目在多项目目录下，显式锁定工作区根，避免 Next 误选父级 lockfile
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
