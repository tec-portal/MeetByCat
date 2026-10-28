"use client";

import type { WeekAnalysis } from "@/lib/analysis";
import { fmt } from "@/lib/time";
import { STATUS_META } from "@/lib/ui";

interface Props {
  analysis: WeekAnalysis;
  selected: number;
  onSelect: (day: number) => void;
}

export default function WeekStrip({ analysis, selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
      {analysis.days.map((d) => {
        const meta = STATUS_META[d.status];
        const active = d.day === selected;
        return (
          <button
            key={d.day}
            type="button"
            onClick={() => onSelect(d.day)}
            className={`group relative flex flex-col items-start gap-1.5 overflow-hidden rounded-3xl border p-3 text-left transition-all duration-200 ${
              active
                ? "-translate-y-0.5 border-sakura-400 bg-white shadow-lg"
                : "border-sakura-200/70 bg-white/70 hover:-translate-y-0.5 hover:border-sakura-300 hover:bg-white"
            }`}
          >
            <span
              className="absolute right-0 top-0 h-16 w-16 -translate-y-6 translate-x-5 rounded-full opacity-25 blur-md transition group-hover:opacity-40"
              style={{ background: meta.dot }}
            />
            <div className="flex w-full items-center justify-between">
              <span className="font-display text-sm font-bold text-sakura-900">{d.short}</span>
              <span className="jp text-xs text-ink-faint">{d.kanji}</span>
            </div>

            <div className="flex w-full items-center gap-2">
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center">
                <svg viewBox="0 0 36 36" className="h-9 w-9 -rotate-90">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#ffe9f2" strokeWidth="4" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke={meta.ring}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${(d.score / 100) * 97.4} 97.4`}
                  />
                </svg>
                <span className="absolute text-[10px] font-extrabold text-ink">{d.score}</span>
              </span>
              <span className={`chip px-2 py-0.5 text-[10px] ${meta.chip}`}>{meta.label}</span>
            </div>

            <span className="text-[11px] font-bold" style={{ color: meta.dot }}>
              {d.meeting ? `${fmt(d.meeting.start)}–${fmt(d.meeting.end)}` : meta.label === "Нет данных" ? "—" : "только звонок"}
            </span>
            <span className="line-clamp-2 text-[11px] leading-snug text-ink-soft">{d.headline}</span>
          </button>
        );
      })}
    </div>
  );
}
