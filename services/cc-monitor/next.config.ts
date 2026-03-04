import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3는 네이티브 모듈이므로 번들링에서 제외
  // Vercel에서는 해당 모듈이 없을 수 있으므로 조건부 설정
  ...(process.env.VERCEL
    ? {}
    : { serverExternalPackages: ["better-sqlite3"] }),
};

export default nextConfig;
