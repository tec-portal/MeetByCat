"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DayDetail from "@/components/DayDetail";
import Kitsune from "@/components/Kitsune";
import UploadPanel from "@/components/UploadPanel";
import WeekStrip from "@/components/WeekStrip";
import {
  IconAlert,
  IconBolt,
  IconCalendar,
  IconChevron,
  IconPhone,
  IconSakura,
  IconSparkle,
  IconTorii,
} from "@/components/Icons";
import { useStore } from "@/components/StoreProvider";
import { dur, pairsWord } from "@/lib/time";

export default function DashboardPage() {
  const { data, analysis, loading, error, refresh, toast } = useStore();
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    if (selected === null && analysis.totals.bestDay) setSelected(analysis.totals.bestDay);
    if (selected === null && !loading) setSelected(1);
  }, [analysis.totals.bestDay, loading, selected]);

  const day = useMemo(
    () => analysis.days.find((d) => d.day === (selected ?? 1)) ?? analysis.days[0],
    [analysis.days, selected],
  );

  const me = data.partners.find((p) => p.key === "me");
  const her = data.partners.find((p) => p.key === "her");
  const hisName = me?.name ?? "Я";
  const herName = her?.name ?? "Она";

  const stale = data.uploads.filter(
    (u) => Date.now() - new Date(u.createdAt).getTime() > 7 * 86400000,
  );
  const missingSlots = 4 - data.uploads.length;

  if (loading)
    return (
      <div className="space-y-4">
        <div className="card h-48 animate-pulse" />
        <div className="card h-64 animate-pulse" />
      </div>
    );

  return (
    <div className="space-y-5">
      {error && (
        <div className="card flex items-center gap-3 border-vermilion/40 p-4 text-sm text-vermilion">
          <IconAlert className="h-5 w-5" /> {error}
        </div>
      )}

      {/* ---- герой + вердикт ---- */}
      <section className="card relative overflow-hidden">
        <div className="asanoha pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative grid gap-6 p-6 lg:grid-cols-[1.1fr_auto] lg:p-8">
          <div>
            <p className="jp text-xs tracking-[0.3em] text-sakura-600">九尾の狐 · 約束の時間</p>
            <h1 className="mt-1 font-display text-3xl font-bold leading-tight text-sakura-900 sm:text-4xl">
              {data.settings.weekLabel?.trim() || "Когда вы свободны вдвоём"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">
              Кицунэ сравнила расписания {hisName.toLowerCase()} и {herName.toLowerCase()}, учла дорогу{" "}
              <b>{data.settings.travelMinutes} мин</b> до {data.settings.meetPlace}, лимит ожидания{" "}
              <b>{data.settings.maxWaitMinutes} мин</b> и допустимый разрыв{" "}
              <b>
                {data.settings.maxGapPairs} {pairsWord(data.settings.maxGapPairs)}
              </b>
              . Вот что получилось.
            </p>

            <div className="mt-4 rounded-3xl border border-sakura-200 bg-white/85 p-4">
              <p className="flex items-center gap-2 font-display text-lg font-bold text-sakura-900">
                <span className="text-xl">{analysis.verdict.emoji}</span>
                {analysis.verdict.title}
              </p>
              <p className="mt-1 text-sm text-ink-soft">{analysis.verdict.text}</p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <Stat icon={<IconTorii className="h-4 w-4" />} label="Встреч на неделе" value={String(analysis.totals.meetingDays)} tint="#d94d88" />
              <Stat icon={<IconSakura className="h-4 w-4" />} label="Время вдвоём" value={dur(analysis.totals.meetingMinutes)} tint="#7c6bd6" />
              <Stat icon={<IconPhone className="h-4 w-4" />} label="Окна для звонков" value={dur(analysis.totals.callMinutes)} tint="#4fae7a" />
              <Stat icon={<IconBolt className="h-4 w-4" />} label="Пар на двоих" value={`${analysis.totals.pairsTotal}`} tint="#d9a441" />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/schedule" className="btn btn-ghost">
                <IconCalendar className="h-4 w-4" /> Проверить расписание
                <IconChevron className="h-3.5 w-3.5" />
              </Link>
              <Link href="/plans" className="btn btn-violet">
                Запланированные свидания
                <IconChevron className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-2">
            <div className="animate-float">
              <Kitsune
                size={190}
                mood={
                  analysis.totals.meetingDays === 0
                    ? "sad"
                    : (analysis.verdict.score ?? 0) >= 55
                      ? "happy"
                      : "calm"
                }
              />
            </div>
            <p className="max-w-[220px] text-center text-xs text-ink-faint">
              Хвостов: {Math.max(1, Math.min(9, Math.round((analysis.verdict.score ?? 0) / 11)))} из 9 —
              столько свободы у вас на этой неделе
            </p>
          </div>
        </div>
      </section>

      {data.demo && (
        <div className="card flex flex-wrap items-center gap-3 border-violet/40 bg-violet/5 p-4 text-sm">
          <IconSparkle className="h-5 w-5 shrink-0 text-violet" />
          <p className="flex-1 text-ink-soft">
            Сейчас в базе <b>пример недели</b> — так видно, как работает разбор. Загрузите свои
            скриншоты выше: первый же снимок полностью заменит пример для этого человека.
          </p>
          <button
            className="btn btn-ghost"
            onClick={async () => {
              await fetch("/api/schedule?partner=me", { method: "DELETE" });
              await fetch("/api/schedule?partner=her", { method: "DELETE" });
              await refresh();
              toast("Пример убран — загрузите свои скриншоты", "warn");
            }}
          >
            Убрать пример
          </button>
        </div>
      )}

      {/* ---- подсказки о данных ---- */}
      {(missingSlots > 0 || stale.length > 0) && (
        <div className="card flex flex-wrap items-center gap-3 border-gold/40 bg-gold/5 p-4 text-sm">
          <IconAlert className="h-5 w-5 shrink-0 text-gold" />
          <p className="text-ink-soft">
            {missingSlots > 0 && (
              <>
                Не хватает <b>{missingSlots}</b> {missingSlots === 1 ? "скриншота" : "скриншотов"} —
                загрузите по два на каждого, и расчёт станет точным.{" "}
              </>
            )}
            {stale.length > 0 && (
              <>
                <b>{stale.length}</b> снимк{stale.length === 1 ? "у" : "ам"} больше недели — замените их
                свежими, расписание-то меняется.
              </>
            )}
          </p>
        </div>
      )}

      <UploadPanel />

      {/* ---- лента недели ---- */}
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-sakura-900">
              Неделя по дням <span className="jp text-sm text-ink-faint">一週間</span>
            </h2>
            <p className="text-sm text-ink-soft">Нажми на день — справа будет подробный разбор.</p>
          </div>
          <span className="chip">
            оценка = сколько времени вдвоём реально получится
          </span>
        </div>
        <WeekStrip analysis={analysis} selected={day?.day ?? 1} onSelect={setSelected} />
      </section>

      {day && (
        <DayDetail
          day={day}
          from={analysis.rangeFrom}
          to={analysis.rangeTo}
          hisName={hisName}
          herName={herName}
        />
      )}

      <section className="card p-5">
        <h2 className="font-display text-lg font-bold text-sakura-900">Как это работает</h2>
        <ol className="mt-3 grid gap-3 text-sm text-ink-soft md:grid-cols-3">
          {[
            {
              t: "1. Два скрина на каждого",
              d: "Расписание пар и расписание звонков/перемен. Кицунэ читает текст прямо в браузере и сама проставляет пары, время начала и конца.",
            },
            {
              t: "2. Строгий расчёт",
              d: `Считаем: твои пары + ${data.settings.travelMinutes} мин дороги, её пары и комендантский час. Разрыв больше ${data.settings.maxGapPairs} ${pairsWord(data.settings.maxGapPairs)} или ожидание дольше ${data.settings.maxWaitMinutes} мин — встреча отменяется.`,
            },
            {
              t: "3. Что делать со временем",
              d: "Для каждого дня — бюджет времени (дорога, ожидание, встреча, домашка) и идеи, на что его потратить, с учётом усталости.",
            },
          ].map((s) => (
            <li key={s.t} className="card-flat p-4">
              <p className="font-display text-sm font-bold text-sakura-900">{s.t}</p>
              <p className="mt-1 text-xs leading-relaxed">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tint: string;
}) {
  return (
    <div className="card-flat p-3">
      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-faint">
        <span style={{ color: tint }}>{icon}</span>
        {label}
      </span>
      <p className="mt-1 font-display text-lg font-bold" style={{ color: tint }}>
        {value}
      </p>
    </div>
  );
}
