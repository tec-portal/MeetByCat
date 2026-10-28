import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // нужно для Docker/VPS-деплоя: собирает минимальный самодостаточный сервер
  output: "standalone",
};

export default nextConfig;
