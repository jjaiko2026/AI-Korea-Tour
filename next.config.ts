import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "tong.visitkorea.or.kr" },
      { protocol: "https", hostname: "img1.kakaocdn.net" },
    ],
  },
};

export default nextConfig;
