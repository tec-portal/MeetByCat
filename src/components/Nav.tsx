"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconCalendar, IconHeart, IconSettings, IconTorii, IconX } from "./Icons";
import { useStore } from "./StoreProvider";

const LINKS = [
  { href: "/", label: "Обзор недели", jp: "週間", icon: IconTorii },
  { href: "/schedule", label: "Расписание", jp: "時間割", icon: IconCalendar },
  { href: "/plans", label: "Планы", jp: "約束", icon: IconHeart },
  { href: "/couple", label: "Пара и QR", jp: "絆", icon: IconHeart },
  { href: "/settings", label: "Настройки", jp: "設定", icon: IconSettings },
];

export default function Nav() {
  const pathname = usePathname();
  const { user, logout } = useStore();

  return (
    <header className="sticky top-0 z-40 border-b border-sakura-200/70 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sakura-300 to-sakura-600 text-white shadow-md">
            <IconTorii className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-base font-bold text-sakura-900">
              Кицунэ-календарь
            </span>
            <span className="jp block text-[11px] text-ink-faint">
              狐の約束 · {user?.coupleName ?? "ваша пара"}
            </span>
          </span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:pb-0">
            {LINKS.map((l) => {
              const active = pathname === l.href;
              const Icon = l.icon;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-gradient-to-r from-sakura-500 to-sakura-600 text-white shadow-md"
                      : "text-sakura-800 hover:bg-sakura-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="whitespace-nowrap">{l.label}</span>
                </Link>
              );
            })}
          </nav>

          {user && (
            <div className="flex items-center gap-2 rounded-full border border-sakura-200 bg-white/80 py-1 pl-3 pr-1">
              <span className="text-xs font-bold text-sakura-900">{user.displayName}</span>
              <span className="jp text-[10px] text-ink-faint">{user.role === "me" ? "彼" : "彼女"}</span>
              <button
                className="btn border border-sakura-200 bg-white/70 px-2 py-1 text-[11px] text-ink-soft hover:bg-sakura-100"
                onClick={() => void logout()}
                title="Выйти"
              >
                <IconX className="h-3.5 w-3.5" /> выйти
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
