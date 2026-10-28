"use client";

import { useState } from "react";
import type { DayAnalysis } from "@/lib/analysis";
import { addDays, dur, fmt, isoDate, mondayOf } from "@/lib/time";
import { STATUS_META } from "@/lib/ui";
import { useStore } from "./StoreProvider";
import DayTimeline from "./DayTimeline";
import {
  IconAlert,
  IconBolt,
  IconCheck,
  IconClock,
  IconHeart,
  IconMoon,
  IconPhone,
  IconRoute,
  IconSparkle,
} from "./Icons";

interface Props {
  day: DayAnalysis;
  from: number;
  to: number;
  hisName: string;
  herName: string;
}

function nextDateForDay(day: number): Date {
  const monday = mondayOf(new Date());
  let d = addDays(monday, day - 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d.getTime() < today.getTime()) d = addDays(d, 7);
  return d;
}

export default function DayDetail({ day, from, to, hisName, herName }: Props) {
  const { addPlan, toast } = useStore();
  const [saving, setSaving] = useState(false);
  const meta = STATUS_META[day.status];

  const planIt = async () => {
    if (!day.meeting) {
      toast("В этот день окно для встречи не находится — попробуй другой день", "warn");
      return;
    }
    setSaving(true);
    const date = nextDateForDay(day.day);
    await addPlan({
      planDate: isoDate(date),
      startTime: fmt(day.meeting.start),
      endTime: fmt(day.meeting.end),
      title: `${day.name}: ${day.ideas[0]?.title ?? "свидание"}`,
      note: day.summary,
      day: day.day,
      status: "planned",
    });
    setSaving(false);
  };

  const maxBudget = Math.max(1, ...day.budget.map((b) => b.minutes));
  const toneBg: Record<string, string> = {
    pink: "linear-gradient(90deg,#ff94bc,#d94d88)",
    violet: "linear-gradient(90deg,#b9aef2,#7c6bd6)",
    gold: "linear-gradient(90deg,#f0d79b,#d9a441)",
    grey: "linear-gradient(90deg,#eadde5,#c9b3c1)",
  };

  return (
    <section className="card animate-fade-up overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-sakura-200/70 px-5 py-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="jp flex h-9 w-9 items-center justify-center rounded-2xl bg-sakura-100 text-lg text-sakura-700">
              {day.kanji}
            </span>
            <h2 className="font-display text-xl font-bold text-sakura-900">{day.name}</h2>
            <span className={`chip ${meta.chip}`}>{meta.label}</span>
            {day.energy.tired && (
              <span className="chip border-gold/40 bg-gold/10 text-[#a3761f]">
                <IconBolt className="h-3.5 w-3.5" /> тяжёлый день
              </span>
            )}
          </div>
          <p className="mt-2 text-sm font-semibold text-ink">{day.headline}</p>
          <p className="mt-1 max-w-3xl text-sm text-ink-soft">{day.summary}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">оценка дня</p>
            <p className="font-display text-3xl font-bold" style={{ color: meta.dot }}>
              {day.score}
              <span className="text-base text-ink-faint">/100</span>
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => void planIt()} disabled={saving}>
            <IconHeart className="h-4 w-4" /> В план
          </button>
        </div>
      </header>

      <div className="grid gap-5 p-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-5">
          <div className="card-flat p-4">
            <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-bold text-sakura-900">
              <IconClock className="h-4 w-4 text-sakura-600" /> Лента дня
            </h3>
            <DayTimeline day={day} from={from} to={to} hisName={hisName} herName={herName} />
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {day.facts.map((f) => (
              <div key={f.label} className="card-flat px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{f.label}</p>
                <p className="mt-0.5 text-sm font-bold text-sakura-900">{f.value}</p>
              </div>
            ))}
          </div>

          <div className="card-flat p-4">
            <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-bold text-sakura-900">
              <IconSparkle className="h-4 w-4 text-gold" /> Почему кицунэ так решила
            </h3>
            <ul className="space-y-1.5">
              {day.reasons.length === 0 && (
                <li className="text-sm text-ink-soft">Данных пока нет — загрузите скриншоты.</li>
              )}
              {day.reasons.map((r, i) => (
                <li key={i} className="flex gap-2 text-sm text-ink-soft">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sakura-400" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          {day.budget.length > 0 && (
            <div className="card-flat p-4">
              <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-bold text-sakura-900">
                <IconRoute className="h-4 w-4 text-violet" /> На что уйдёт время
              </h3>
              <div className="space-y-2.5">
                {day.budget.map((b) => (
                  <div key={b.label}>
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="font-bold text-ink">{b.label}</span>
                      <span className="font-semibold text-ink-soft">{dur(b.minutes)}</span>
                    </div>
                    <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-white/80">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.max(2, (b.minutes / maxBudget) * 100)}%`, background: toneBg[b.tone] }}
                      />
                    </div>
                    <p className="mt-0.5 text-[11px] text-ink-faint">{b.hint}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div
            className="rounded-3xl border p-4"
            style={{ borderColor: `${meta.dot}44`, background: `${meta.dot}0f` }}
          >
            <p className="flex items-start gap-2 text-sm font-semibold text-ink">
              <span className="text-lg leading-none">🦊</span>
              <span>{day.kitsune}</span>
            </p>
            {day.meeting && (
              <div className="mt-3 space-y-1.5 rounded-2xl bg-white/75 p-3 text-xs text-ink-soft">
                <p className="flex items-center gap-2 font-bold text-sakura-900">
                  <IconHeart className="h-3.5 w-3.5 text-sakura-500" /> Встреча {fmt(day.meeting.start)}–
                  {fmt(day.meeting.end)} · {dur(day.meeting.duration)}
                </p>
                <p className="flex items-center gap-2">
                  <IconRoute className="h-3.5 w-3.5 text-violet" /> Место: {day.meeting.place}, ты
                  подъезжаешь к {fmt(day.meeting.hisArrival)}
                </p>
                <p className="flex items-center gap-2">
                  <IconClock className="h-3.5 w-3.5 text-gold" />
                  {day.meeting.waitMinutes > 0
                    ? `${day.meeting.whoWaits === "me" ? "Ты ждёшь" : "Она ждёт"} ${dur(day.meeting.waitMinutes)}`
                    : "Без ожидания — вы свободны одновременно"}
                </p>
                <p className="flex items-center gap-2">
                  <IconMoon className="h-3.5 w-3.5 text-violet" /> Дома: ты к {fmt(day.meeting.hisHomeBy)},{" "}
                  {herName.toLowerCase()} к {fmt(day.meeting.herHomeBy)}
                </p>
                {day.meeting.recommended > 0 && day.meeting.recommended < day.meeting.duration && (
                  <p className="flex items-center gap-2 font-semibold text-sakura-800">
                    <IconCheck className="h-3.5 w-3.5" /> Совет: закончить на {dur(day.meeting.duration - day.meeting.recommended)}{" "}
                    раньше ({dur(day.meeting.recommended)})
                  </p>
                )}
              </div>
            )}
            {day.morning && (
              <p className="mt-2 rounded-2xl bg-white/75 p-3 text-xs font-semibold text-sakura-900">
                ☀️ {day.morning.label}: {fmt(day.morning.start)}–{fmt(day.morning.end)} ({dur(day.morning.duration)})
              </p>
            )}
          </div>

          <div className="card-flat p-4">
            <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-bold text-sakura-900">
              <IconSparkle className="h-4 w-4 text-sakura-500" /> На что потратить это время
            </h3>
            <div className="space-y-2">
              {day.ideas.map((idea) => (
                <div key={idea.title} className="rounded-2xl border border-sakura-200 bg-white/80 p-3">
                  <p className="flex items-center gap-2 text-sm font-bold text-sakura-900">
                    <span className="text-base">{idea.icon}</span>
                    {idea.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">{idea.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card-flat p-4">
            <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-bold text-sakura-900">
              <IconPhone className="h-4 w-4 text-violet" /> Звонки и перемены
            </h3>
            {day.callWindows.length === 0 && day.breakCalls.length === 0 && (
              <p className="text-xs text-ink-soft">
                Свободных окон для созвона нет: день забит парами. Напиши ей сообщение между парами.
              </p>
            )}
            <div className="space-y-1.5">
              {day.callWindows.map((c) => (
                <p
                  key={`${c.start}-${c.end}`}
                  className="flex items-center justify-between gap-2 rounded-xl bg-white/80 px-3 py-1.5 text-xs"
                >
                  <span className="font-bold text-violet">{c.label}</span>
                  <span className="font-semibold text-ink">
                    {fmt(c.start)}–{fmt(c.end)} · {dur(c.duration)}
                  </span>
                </p>
              ))}
              {day.breakCalls.map((b, i) => (
                <p
                  key={i}
                  className={`rounded-xl px-3 py-1.5 text-xs ${
                    b.tone === "good" ? "bg-matcha/10 text-[#3f8b62]" : "bg-vermilion/10 text-vermilion"
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-bold">
                    {b.tone === "good" ? <IconCheck className="h-3.5 w-3.5" /> : <IconAlert className="h-3.5 w-3.5" />}
                    {b.label} · {b.owner === "me" ? hisName : herName}
                  </span>
                  <span className="mt-0.5 block opacity-90">{b.note}</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
