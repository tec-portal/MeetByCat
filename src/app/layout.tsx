import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Кицунэ-календарь · свободные окна для встреч",
  description:
    "Загрузите скриншоты расписаний пар и звонков — сайт посчитает, когда вы реально сможете встретиться, с учётом дороги, усталости и перерывов.",
};

export const viewport: Viewport = {
  themeColor: "#fff6fa",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&family=Shippori+Mincho+B1:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
