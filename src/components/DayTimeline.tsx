"use client";

import type { DayAnalysis, Segment } from "@/lib/analysis";
import { fmt } from "@/lib/time";
import { SEG_STYLE } from "@/lib/ui";

interface Props {
  day: DayAnalysis;
  from: number;
  to: number;
  hisName: string;
  herName: string;
}

function Row({
  label,
  color,
  segments,
  from,
  to,
  sub,
}: {
  label: string;
  color: string;
  segments: Segment[];
  from: number;
  to: number;
  sub: string;
}) {
  const span = Math.max(60, to - from);
  const pos = (m: number) => ((Math.min(Math.max(m, from), to) - from) / span) * 100;

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="flex items-center gap-2 text-xs font-bold" style={{ color }}>
          <span className="h-2 w-2 rounded-full" style={{ background: color }} />
          {label}
        </span>
        <span className="text-[11px] text-ink-faint">{sub}</span>
      </div>
      <div className="relative h-9 overflow-hidden rounded-xl border border-sakura-200 bg-white/70">
        {/* часовая сетка */}
        {Array.from({ length: Math.floor(span / 60) + 1 }, (_, i) => from + i * 60).map((h) => (
          <div
            key={h}
            className="absolute inset-y-0 w-px bg-sakura-100"
            style={{ left: `${pos(h)}%` }}
          />
        ))}
        {segments.map((s, i) => {
          const left = pos(s.start);
          const width = Math.max(0.6, pos(s.end) - left);
          const style = SEG_STYLE[s.kind];
          return (
            <div
              key={i}
              title={`${style.title}${s.label ? ` · ${s.label}` : ""}: ${fmt(s.start)}–${fmt(s.end)}`}
              className="absolute inset-y-1 rounded-md border border-white/60 shadow-sm transition hover:z-10 hover:scale-y-110"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                background: style.bg,
                boxShadow: s.kind === "meeting" ? "0 0 0 2px rgba(217,77,136,.25)" : undefined,
              }}
            />
          );
        })}
        {segments.length === 0 && (
          <div className="flex h-full items-center px-2 text-[11px] text-ink-faint">нет данных</div>
        )}
      </div>
    </div>
  );
}

export default function DayTimeline({ day, from, to, hisName, herName }: Props) {
  const span = Math.max(60, to - from);
  const ticks: number[] = [];
  for (let t = Math.ceil(from / 60) * 60; t <= to; t += 60 * 2) ticks.push(t);

  return (
    <div className="space-y-3">
      <div className="grid gap-3">
        <Row
          label={hisName}
          color="#5b4bb0"
          segments={day.hisSegments}
          from={from}
          to={to}
          sub={`${day.hisPairs} пар(ы)`}
        />
        <Row
          label={herName}
          color="#b23a6d"
          segments={day.herSegments}
          from={from}
          to={to}
          sub={`${day.herPairs} пар(ы)`}
        />
      </div>
      <div className="relative h-5 text-[10px] font-semibold text-ink-faint">
        {ticks.map((t) => (
          <span
            key={t}
            className="absolute -translate-x-1/2"
            style={{ left: `${((t - from) / span) * 100}%` }}
          >
            {fmt(t)}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-soft">
        {(Object.keys(SEG_STYLE) as (keyof typeof SEG_STYLE)[]).map((k) => (
          <span key={k} className="flex items-center gap-1.5">
            <span
              className="h-3 w-5 rounded border border-white/70"
              style={{ background: SEG_STYLE[k].bg }}
            />
            {SEG_STYLE[k].title}
          </span>
        ))}
      </div>
    </div>
  );
}
