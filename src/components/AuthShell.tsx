"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import Kitsune from "./Kitsune";
import Sakura from "./Sakura";
import { IconTorii } from "./Icons";

export default function AuthShell({
  title,
  jp,
  subtitle,
  children,
  footer,
}: {
  title: string;
  jp: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      <Sakura count={16} />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-6 px-4 py-10 lg:flex-row lg:items-center lg:gap-10">
        <div className="hidden w-72 shrink-0 flex-col items-center text-center lg:flex">
          <div className="animate-float">
            <Kitsune size={230} mood="happy" />
          </div>
          <p className="jp mt-2 text-sm tracking-[0.35em] text-sakura-600">九尾の狐</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-sakura-900">Кицунэ-календарь</h2>
          <p className="mt-2 max-w-xs text-sm text-ink-soft">
            Девятихвостая лиса хранит ваше расписание и показывает, когда вы действительно свободны
            вдвоём.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-ink-faint">
            <IconTorii className="h-4 w-4 text-sakura-500" />
            вход только для вашей пары
          </div>
        </div>

        <div className="card w-full max-w-md overflow-hidden">
          <div className="seigaiha border-b border-sakura-200/70 px-6 py-5">
            <div className="flex items-center gap-3 lg:hidden">
              <Kitsune size={54} mood="happy" />
              <div>
                <p className="jp text-[11px] tracking-[0.3em] text-sakura-600">{jp}</p>
                <h1 className="font-display text-xl font-bold text-sakura-900">{title}</h1>
              </div>
            </div>
            <div className="hidden lg:block">
              <p className="jp text-[11px] tracking-[0.3em] text-sakura-600">{jp}</p>
              <h1 className="font-display text-2xl font-bold text-sakura-900">{title}</h1>
            </div>
            <p className="mt-1.5 text-sm text-ink-soft">{subtitle}</p>
          </div>
          <div className="px-6 py-5">{children}</div>
          {footer && (
            <div className="border-t border-sakura-200/70 bg-sakura-50/70 px-6 py-3 text-center text-xs text-ink-soft">
              {footer}
            </div>
          )}
        </div>
      </div>

      <Link
        href="/login"
        className="fixed bottom-4 left-1/2 z-20 -translate-x-1/2 text-[11px] font-semibold text-ink-faint underline-offset-2 hover:text-sakura-700 hover:underline"
      >
        уже есть вход →
      </Link>
    </div>
  );
}
