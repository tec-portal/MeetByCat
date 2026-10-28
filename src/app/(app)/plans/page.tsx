"use client";

import { useMemo, useState } from "react";
import {
  IconCalendar,
  IconCheck,
  IconClock,
  IconHeart,
  IconPlus,
  IconSparkle,
  IconTrash,
} from "@/components/Icons";
import { useStore } from "@/components/StoreProvider";
import { addDays, dur, fmt, isoDate, mondayOf } from "@/lib/time";
import { DAY_NAMES } from "@/lib/time";
import { STATUS_META } from "@/lib/ui";

function nextDateForDay(day: number): Date {
  const monday = mondayOf(new Date());
  let d = addDays(monday, day - 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d.getTime() < today.getTime()) d = addDays(d, 7);
  return d;
}

const prettyDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return `${date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}, ${
    DAY_NAMES[(date.getDay() + 6) % 7]
  }`;
};

export default function PlansPage() {
  const { analysis, plans, addPlan, deletePlan, updatePlanStatus, data } = useStore();
  const [form, setForm] = useState({ planDate: "", startTime: "18:00", endTime: "20:00", title: "", note: "" });

  const opportunities = useMemo(
    () =>
      analysis.days
        .filter((d) => d.meeting && d.status !== "none" && d.status !== "empty")
        .map((d) => ({ day: d, date: nextDateForDay(d.day) })),
    [analysis.days],
  );

  const me = data.partners.find((p) => p.key === "me")?.name ?? "Я";
  const her = data.partners.find((p) => p.key === "her")?.name ?? "Она";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const planDate = form.planDate || isoDate(new Date());
    await addPlan({
      planDate,
      startTime: form.startTime,
      endTime: form.endTime,
      title: form.title.trim() || "Свидание",
      note: form.note.trim() || null,
      day: ((new Date(planDate).getDay() + 6) % 7) + 1,
      status: "planned",
    });
    setForm({ planDate: "", startTime: "18:00", endTime: "20:00", title: "", note: "" });
  };

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <h1 className="font-display text-2xl font-bold text-sakura-900">
          Планы встреч <span className="jp text-base text-ink-faint">約束</span>
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          Здесь живут обещания: что и когда вы решили. Кицунэ подскажет ближайшие окна из анализа, а
          дальше — ваш ход.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section className="card p-5">
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-sakura-900">
            <IconSparkle className="h-4 w-4 text-gold" /> Ближайшие окна из анализа
          </h2>
          {opportunities.length === 0 && (
            <p className="mt-2 text-sm text-ink-soft">
              Свободных окон нет. Загляни в «Настройки» — возможно, лимит ожидания слишком строгий, или
              обнови скриншоты расписания.
            </p>
          )}
          <div className="mt-3 space-y-2">
            {opportunities.map(({ day, date }) => {
              const meta = STATUS_META[day.status];
              const m = day.meeting!;
              return (
                <div key={day.day} className="card-flat flex flex-wrap items-center gap-3 p-3">
                  <span className="jp flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-sakura-700">
                    {day.kanji}
                  </span>
                  <div className="min-w-[140px] flex-1">
                    <p className="text-sm font-bold text-sakura-900">
                      {date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })} · {day.name}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {fmt(m.start)}–{fmt(m.end)} · {dur(m.duration)} · {day.ideas[0]?.title ?? "свидание"}
                    </p>
                  </div>
                  <span className={`chip ${meta.chip}`}>{meta.label}</span>
                  <button
                    className="btn btn-primary px-3 py-1.5 text-xs"
                    onClick={() =>
                      void addPlan({
                        planDate: isoDate(date),
                        startTime: fmt(m.start),
                        endTime: fmt(m.end),
                        title: `${day.name}: ${day.ideas[0]?.title ?? "свидание"}`,
                        note: day.summary,
                        day: day.day,
                        status: "planned",
                      })
                    }
                  >
                    <IconPlus className="h-3.5 w-3.5" /> запланировать
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-sakura-900">
            <IconCalendar className="h-4 w-4 text-violet" /> Добавить своё
          </h2>
          <form className="mt-3 space-y-2.5" onSubmit={submit}>
            <div>
              <label className="label">Дата</label>
              <input
                type="date"
                className="input"
                value={form.planDate}
                onChange={(e) => setForm({ ...form, planDate: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Начало</label>
                <input
                  type="time"
                  className="input"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Конец</label>
                <input
                  type="time"
                  className="input"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Что делаете</label>
              <input
                className="input"
                placeholder="Рамен и прогулка"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Заметка</label>
              <textarea
                className="input h-20"
                placeholder="Взять её любимые конфеты, заехать после третьей пары"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </div>
            <button className="btn btn-primary w-full" type="submit">
              <IconHeart className="h-4 w-4" /> Сохранить план
            </button>
          </form>
        </section>
      </div>

      <section className="card p-5">
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-sakura-900">
          <IconClock className="h-4 w-4 text-sakura-500" /> Сохранённые свидания ({plans.length})
        </h2>
        {plans.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">
            Пока пусто. Добавь первую встречу — {me} и {her} увидят её здесь.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {[...plans]
              .sort((a, b) => a.planDate.localeCompare(b.planDate))
              .map((p) => (
                <div
                  key={p.id}
                  className={`card-flat flex flex-wrap items-center gap-3 p-3 ${
                    p.status === "done" ? "opacity-65" : ""
                  }`}
                >
                  <span
                    className="flex h-10 w-10 flex-col items-center justify-center rounded-2xl bg-white text-sakura-700"
                    title={p.planDate}
                  >
                    <span className="text-[10px] font-bold uppercase">
                      {new Date(p.planDate).toLocaleDateString("ru-RU", { month: "short" })}
                    </span>
                    <span className="font-display text-sm font-bold leading-none">
                      {Number(p.planDate.slice(8, 10))}
                    </span>
                  </span>
                  <div className="min-w-[160px] flex-1">
                    <p className="text-sm font-bold text-sakura-900">
                      {p.title}{" "}
                      <span className="text-xs font-semibold text-ink-faint">
                        {p.startTime}–{p.endTime}
                      </span>
                    </p>
                    <p className="text-xs text-ink-soft">
                      {prettyDate(p.planDate)}
                      {p.note ? ` · ${p.note}` : ""}
                    </p>
                  </div>
                  <button
                    className={`btn px-3 py-1.5 text-xs ${
                      p.status === "done" ? "btn-ghost" : "btn-violet"
                    }`}
                    onClick={() => void updatePlanStatus(p.id, p.status === "done" ? "planned" : "done")}
                  >
                    <IconCheck className="h-3.5 w-3.5" /> {p.status === "done" ? "состоялось" : "отметить"}
                  </button>
                  <button
                    className="btn border border-vermilion/30 bg-white/70 px-2.5 py-1.5 text-vermilion"
                    onClick={() => void deletePlan(p.id)}
                  >
                    <IconTrash className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
