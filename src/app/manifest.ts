import type { MetadataRoute } from "next";

/** Манифест: на телефоне сайт можно «установить» на главный экран как приложение. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Кицунэ-календарь · свободные окна для встреч",
    short_name: "Кицунэ",
    description:
      "Расписание пары: загрузите скриншоты пар и звонков — сайт посчитает, когда вы реально сможете встретиться.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fff6fa",
    theme_color: "#f26fa4",
    lang: "ru",
    categories: ["lifestyle", "productivity"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
