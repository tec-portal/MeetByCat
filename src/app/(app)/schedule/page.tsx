"use client";

import { useEffect, useMemo, useState } from "react";
import {
  IconAlert,
  IconBook,
  IconCopy,
  IconPhone,
  IconPlus,
  IconRefresh,
  IconSave,
  IconSparkle,
  IconTrash,
  IconX,
} from "@/components/Icons";
import { useStore } from "@/components/StoreProvider";
import { applyParse, parseScheduleText } from "@/lib/parse";
import { DAY_KANJI, DAY_NAMES, DAY_SHORT, fmt, toMin } from "@/lib/time";
import type { BlockInfo, BlockKind, DayClassInfo, PartnerKey } from "@/lib/types";

const KIND_LABEL: Record<BlockKind, string> = {
  break: "перемена",
  call: "звонок",
  other: "свои дела",
};

export default function SchedulePage() {
  const { data, saveSchedule, toast, imageVersion } = useStore();
  const [days, setDays] = useState<DayClassInfo[]>([]);
  const [blocks, setBlocks] = useState<BlockInfo[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [ocrDrafts, setOcrDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    setDays(data.dayClasses);
    setBlocks(data.timeBlocks);
    setOcrDrafts(
      Object.fromEntries(data.uploads.filter((u) => u.ocrText).map((u) => [`${u.partnerKey}:${u.kind}`, u.ocrText ?? ""])),
    );
    setDirty(false);
  }, [data]);

  const settings = data.settings;

  const dayOf = (partner: PartnerKey, day: number) =>
    days.find((d) => d.partnerKey === partner && d.day === day);
  const blocksOf = (partner: PartnerKey, day: number) =>
    blocks
      .filter((b) => b.partnerKey === partner && b.day === day)
      .sort((a, b) => (toMin(a.startTime) ?? 0) - (toMin(b.startTime) ?? 0));

  const patchDay = (partner: PartnerKey, day: number, patch: Partial<DayClassInfo>) => {
    setDirty(true);
    setDays((prev) => {
      const existing = prev.find((d) => d.partnerKey === partner && d.day === day);
      if (existing) return prev.map((d) => (d === existing ? { ...d, ...patch } : d));
      return [
        ...prev,
        { partnerKey: partner, day, pairCount: 0, startTime: null, endTime: null, note: null, ...patch },
      ];
    });
  };

  const patchBlocks = (partner: PartnerKey, day: number, next: BlockInfo[]) => {
    setDirty(true);
    setBlocks((prev) => [
      ...prev.filter((b) => !(b.partnerKey === partner && b.day === day)),
      ...next.map((b) => ({ ...b, partnerKey: partner, day })),
    ]);
  };

  const autoBreaks = (partner: PartnerKey, day: number) => {
    const d = dayOf(partner, day);
    if (!d || d.pairCount < 2 || !d.startTime) {
      toast("Нужно указать число пар и время начала", "warn");
      return;
    }
    const start = toMin(d.startTime) ?? 8 * 60 + 30;
    const next: BlockInfo[] = blocksOf(partner, day).filter((b) => b.kind !== "break");
    for (let i = 1; i < d.pairCount; i++) {
      const at = start + i * settings.pairMinutes + (i - 1) * settings.breakMinutes;
      next.push({
        partnerKey: partner,
        day,
        kind: "break",
        startTime: fmt(at),
        endTime: fmt(at + settings.breakMinutes),
        label: `перемена после ${i}-й пары`,
      });
    }
    patchBlocks(partner, day, next);
    if (!d.endTime) patchDay(partner, day, { endTime: fmt(start + d.pairCount * settings.pairMinutes + (d.pairCount - 1) * settings.breakMinutes) });
  };

  const copyDayToWeek = (partner: PartnerKey, fromDay: number) => {
    const src = dayOf(partner, fromDay);
    if (!src) {
      toast("В этом дне пусто", "warn");
      return;
    }
    setDirty(true);
    setDays((prev) => {
      const base = prev.filter((d) => d.partnerKey !== partner);
      const kept = prev.filter((d) => d.partnerKey === partner && d.day === fromDay);
      const extra: DayClassInfo[] = [];
      for (let day = 1; day <= 6; day++) {
        if (day === fromDay) continue;
        extra.push({ ...src, day });
      }
      return [...base, ...kept, ...extra].sort((a, b) => a.partnerKey.localeCompare(b.partnerKey) || a.day - b.day);
    });
    toast(`День ${DAY_SHORT[fromDay - 1]} скопирован на Пн–Сб для «${nameOf(partner)}»`);
  };

  const clearWeekend = (partner: PartnerKey) => {
    setDirty(true);
    setDays((prev) => prev.filter((d) => !(d.partnerKey === partner && d.day >= 6)));
    setBlocks((prev) => prev.filter((b) => !(b.partnerKey === partner && b.day >= 6)));
    toast("Сб и Вс очищены");
  };

  const nameOf = (partner: PartnerKey) =>
    data.partners.find((p) => p.key === partner)?.name ?? (partner === "me" ? "Я" : "Она");

  const save = async () => {
    setSaving(true);
    const ok = await saveSchedule({ partner: "all", dayClasses: days, timeBlocks: blocks });
    setSaving(false);
    if (ok) setDirty(false);
  };

  const reparseText = (partner: PartnerKey, kind: "classes" | "calls") => {
    const text = ocrDrafts[`${partner}:${kind}`];
    if (!text || !text.trim()) {
      toast("Текст пустой", "warn");
      return;
    }
    const parsed = parseScheduleText(text, kind);
    if (parsed.days.length === 0 && parsed.blocks.length === 0) {
      toast("В этом тексте нет времени вида «8:30-10:05»", "warn");
      return;
    }
    const merged = applyParse(parsed, partner, { dayClasses: days, timeBlocks: blocks });
    setDays(merged.dayClasses);
    setBlocks(merged.timeBlocks);
    setDirty(true);
    toast(
      `Подставлено: ${parsed.days.length} дн. с парами, ${parsed.blocks.length} интервалов. Не забудь сохранить.`,
    );
  };

  const totals = useMemo(
    () => ({
      me: days.filter((d) => d.partnerKey === "me").reduce((a, d) => a + d.pairCount, 0),
      her: days.filter((d) => d.partnerKey === "her").reduce((a, d) => a + d.pairCount, 0),
      blocks: blocks.length,
    }),
    [days, blocks],
  );

  return (
    <div className="space-y-5">
      <section className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-sakura-900">
            Расписание <span className="jp text-base text-ink-faint">時間割</span>
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">
            Всё, что кицунэ прочитала со скриншотов, можно поправить руками: число пар, время начала и
            конца, перемены, созвоны и личные дела. Изменения применяются к анализу сразу после
            сохранения.
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="chip">{nameOf("me")}: {totals.me} пар</span>
            <span className="chip">{nameOf("her")}: {totals.her} пар</span>
            <span className="chip">интервалов: {totals.blocks}</span>
            <span className="chip">пара = {settings.pairMinutes} мин, перемена = {settings.breakMinutes} мин</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <span className="chip border-gold/50 bg-gold/10 text-[#a3761f]">
              <IconAlert className="h-3.5 w-3.5" /> не сохранено
            </span>
          )}
          <button className="btn btn-ghost" onClick={() => void copyDayToWeek("her", 1)} title="Скопировать понедельник на всю неделю">
            <IconCopy className="h-4 w-4" /> Пн → неделя
          </button>
          <button className="btn btn-primary" onClick={() => void save()} disabled={saving || !dirty}>
            <IconSave className="h-4 w-4" /> {saving ? "Сохраняем…" : "Сохранить"}
          </button>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {(["me", "her"] as PartnerKey[]).map((partner) => (
          <section key={partner} className="card overflow-hidden">
            <header
              className="flex items-center justify-between gap-2 border-b border-sakura-200/70 px-4 py-3"
              style={{ background: partner === "me" ? "#f1eeff" : "#fff0f6" }}
            >
              <div className="flex items-center gap-2">
                <span className="jp text-lg" style={{ color: partner === "me" ? "#5b4bb0" : "#b23a6d" }}>
                  {partner === "me" ? "彼" : "彼女"}
                </span>
                <h2 className="font-display text-base font-bold" style={{ color: partner === "me" ? "#5b4bb0" : "#b23a6d" }}>
                  {nameOf(partner)}
                </h2>
              </div>
              <button className="btn btn-ghost px-3 py-1.5 text-xs" onClick={() => clearWeekend(partner)}>
                <IconX className="h-3.5 w-3.5" /> очистить выходные
              </button>
            </header>

            <div className="divide-y divide-sakura-100">
              {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => {
                const d = dayOf(partner, day);
                const dayBlocks = blocksOf(partner, day);
                const open = openDay === `${partner}:${day}`;
                return (
                  <div key={day} className="p-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="jp flex h-8 w-8 items-center justify-center rounded-xl bg-sakura-100 text-sm text-sakura-700">
                        {DAY_KANJI[day - 1]}
                      </span>
                      <span className="w-24 font-display text-sm font-bold text-sakura-900">
                        {DAY_NAMES[day - 1]}
                      </span>

                      <div className="flex items-center gap-1 rounded-full border border-sakura-200 bg-white/80 px-1.5 py-1">
                        <button
                          className="h-6 w-6 rounded-full text-sakura-700 transition hover:bg-sakura-100"
                          onClick={() => patchDay(partner, day, { pairCount: Math.max(0, (d?.pairCount ?? 0) - 1) })}
                          aria-label="меньше пар"
                        >
                          −
                        </button>
                        <span className="flex items-center gap-1 text-xs font-bold text-ink">
                          <IconBook className="h-3.5 w-3.5 text-sakura-500" />
                          {d?.pairCount ?? 0} пар
                        </span>
                        <button
                          className="h-6 w-6 rounded-full text-sakura-700 transition hover:bg-sakura-100"
                          onClick={() => patchDay(partner, day, { pairCount: Math.min(12, (d?.pairCount ?? 0) + 1) })}
                          aria-label="больше пар"
                        >
                          +
                        </button>
                      </div>

                      <label className="flex items-center gap-1 text-xs text-ink-soft">
                        с
                        <input
                          type="time"
                          className="input w-[104px] px-2 py-1"
                          value={d?.startTime ?? ""}
                          onChange={(e) => patchDay(partner, day, { startTime: e.target.value || null })}
                        />
                      </label>
                      <label className="flex items-center gap-1 text-xs text-ink-soft">
                        до
                        <input
                          type="time"
                          className="input w-[104px] px-2 py-1"
                          value={d?.endTime ?? ""}
                          onChange={(e) => patchDay(partner, day, { endTime: e.target.value || null })}
                        />
                      </label>

                      <div className="ml-auto flex items-center gap-1">
                        <button
                          className="btn btn-ghost px-2.5 py-1 text-[11px]"
                          onClick={() => autoBreaks(partner, day)}
                          title="Расставить перемены между парами автоматически"
                        >
                          <IconSparkle className="h-3.5 w-3.5" /> перемены
                        </button>
                        <button
                          className="btn btn-ghost px-2.5 py-1 text-[11px]"
                          onClick={() => copyDayToWeek(partner, day)}
                          title="Скопировать этот день на Пн–Сб"
                        >
                          <IconCopy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="btn btn-ghost px-2.5 py-1 text-[11px]"
                          onClick={() => setOpenDay(open ? null : `${partner}:${day}`)}
                        >
                          {dayBlocks.length > 0 ? `${dayBlocks.length} ⏱` : "интервалы"}
                          <IconPlus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <input
                      className="input mt-2 py-1 text-xs"
                      placeholder="заметка: например, «физкультура в другом корпусе»"
                      value={d?.note ?? ""}
                      onChange={(e) => patchDay(partner, day, { note: e.target.value })}
                    />

                    {open && (
                      <div className="mt-2 space-y-2 rounded-2xl border border-sakura-200 bg-sakura-50/60 p-3">
                        {dayBlocks.map((b, idx) => (
                          <div key={idx} className="flex flex-wrap items-center gap-1.5">
                            <select
                              className="input w-[118px] px-2 py-1 text-xs"
                              value={b.kind}
                              onChange={(e) =>
                                patchBlocks(
                                  partner,
                                  day,
                                  dayBlocks.map((x, i) =>
                                    i === idx ? { ...x, kind: e.target.value as BlockKind } : x,
                                  ),
                                )
                              }
                            >
                              {(Object.keys(KIND_LABEL) as BlockKind[]).map((k) => (
                                <option key={k} value={k}>
                                  {KIND_LABEL[k]}
                                </option>
                              ))}
                            </select>
                            <input
                              type="time"
                              className="input w-[104px] px-2 py-1 text-xs"
                              value={b.startTime}
                              onChange={(e) =>
                                patchBlocks(
                                  partner,
                                  day,
                                  dayBlocks.map((x, i) => (i === idx ? { ...x, startTime: e.target.value } : x)),
                                )
                              }
                            />
                            <input
                              type="time"
                              className="input w-[104px] px-2 py-1 text-xs"
                              value={b.endTime}
                              onChange={(e) =>
                                patchBlocks(
                                  partner,
                                  day,
                                  dayBlocks.map((x, i) => (i === idx ? { ...x, endTime: e.target.value } : x)),
                                )
                              }
                            />
                            <input
                              className="input min-w-[110px] flex-1 px-2 py-1 text-xs"
                              placeholder="подпись"
                              value={b.label ?? ""}
                              onChange={(e) =>
                                patchBlocks(
                                  partner,
                                  day,
                                  dayBlocks.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)),
                                )
                              }
                            />
                            <button
                              className="btn border border-vermilion/30 bg-white/70 px-2 py-1 text-vermilion"
                              onClick={() => patchBlocks(partner, day, dayBlocks.filter((_, i) => i !== idx))}
                            >
                              <IconTrash className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                        <button
                          className="btn btn-ghost px-3 py-1.5 text-xs"
                          onClick={() =>
                            patchBlocks(partner, day, [
                              ...dayBlocks,
                              {
                                partnerKey: partner,
                                day,
                                kind: "call",
                                startTime: "21:00",
                                endTime: "21:30",
                                label: "вечерний созвон",
                              },
                            ])
                          }
                        >
                          <IconPlus className="h-3.5 w-3.5" /> добавить интервал
                        </button>
                        <p className="text-[11px] text-ink-faint">
                          Перемены внутри пар учитываются как «можно быстро созвониться», звонки и личные
                          дела — как занятое время.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <section className="card p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-sakura-900">
          <IconPhone className="h-4 w-4 text-violet" /> Текст со скриншотов
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Это то, что кицунэ прочитала на изображениях. Можно поправить текст руками и разобрать его
          заново — полезно, если цифры распознались криво.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {data.uploads.map((u) => {
            const key = `${u.partnerKey}:${u.kind}`;
            return (
              <div key={key} className="card-flat p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-sakura-900">
                    {nameOf(u.partnerKey)} · {u.kind === "classes" ? "пары" : "звонки и перемены"}
                  </p>
                  <span className="text-[11px] text-ink-faint">{u.fileName}</span>
                </div>
                <textarea
                  className="input mt-2 h-28 font-mono text-[11px]"
                  value={ocrDrafts[key] ?? u.ocrText ?? ""}
                  onChange={(e) => setOcrDrafts((s) => ({ ...s, [key]: e.target.value }))}
                  placeholder="текст не распознан — можно вставить сюда расписание вручную"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <button className="btn btn-primary px-3 py-1.5 text-xs" onClick={() => reparseText(u.partnerKey, u.kind)}>
                    <IconRefresh className="h-3.5 w-3.5" /> разобрать и подставить
                  </button>
                  <a
                    className="btn btn-ghost px-3 py-1.5 text-xs"
                    href={`/api/uploads/image?partner=${u.partnerKey}&kind=${u.kind}&v=${imageVersion}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    открыть скрин
                  </a>
                </div>
              </div>
            );
          })}
          {data.uploads.length === 0 && (
            <p className="text-sm text-ink-soft">
              Скриншотов пока нет — загрузите их на главной, и текст появится здесь.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
