import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  register: true,
  // 開発(dev)では無効 / 本番(build/start)で有効
  disable: process.env.NODE_ENV !== "production",
});

const nextConfig: NextConfig = {
  // TIP: Turbopackの警告を黙らせたいだけなら下を追加してもOK（任意）
  // turbopack: {},
};

export default withSerwist(nextConfig);
