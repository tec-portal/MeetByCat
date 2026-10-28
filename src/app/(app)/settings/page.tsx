"use client";

import { useEffect, useState } from "react";
import { IconAlert, IconRefresh, IconRoute, IconSave, IconSparkle, IconTrash } from "@/components/Icons";
import { useStore } from "@/components/StoreProvider";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import type { SettingsInfo } from "@/lib/types";

interface Field {
  key: keyof SettingsInfo;
  label: string;
  hint: string;
  type?: "number" | "time" | "text";
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}

const GROUPS: { title: string; jp: string; desc: string; fields: Field[] }[] = [
  {
    title: "Дорога между вами",
    jp: "道のり",
    desc: "Сколько занимает путь и где вы встречаетесь. Это главный ограничитель вечера.",
    fields: [
      { key: "travelMinutes", label: "Дорога до неё", hint: "Обычно 30 минут", suffix: "мин", min: 0, max: 180 },
      { key: "returnTravelMinutes", label: "Твоя дорога домой", hint: "Обратный путь вечером", suffix: "мин", min: 0, max: 180 },
      { key: "herReturnMinutes", label: "Её дорога домой", hint: "От места встречи до дома", suffix: "мин", min: 0, max: 120 },
      { key: "meetPlace", label: "Место встречи", hint: "Подпись в анализе", type: "text" },
    ],
  },
  {
    title: "Строгость правил",
    jp: "厳しさ",
    desc: "Насколько жёстко кицунэ отсекает сомнительные варианты.",
    fields: [
      { key: "maxGapPairs", label: "Максимальный разрыв", hint: "В парах: больше — встреча отменяется", suffix: "пар", min: 0, max: 5 },
      { key: "maxWaitMinutes", label: "Кто-то ждёт не дольше", hint: "Ожидание у техникума", suffix: "мин", min: 0, max: 180 },
      { key: "minMeetingMinutes", label: "Минимум на встречу", hint: "Меньше — нет смысла ехать", suffix: "мин", min: 15, max: 180 },
      { key: "pairMinutes", label: "Длина пары", hint: "Для пересчёта разрыва в минуты", suffix: "мин", min: 30, max: 180 },
      { key: "breakMinutes", label: "Перемена между парами", hint: "Если точное время конца неизвестно", suffix: "мин", min: 0, max: 40 },
    ],
  },
  {
    title: "Усталость и учёба",
    jp: "疲れ",
    desc: "После скольких пар вы уже не люди и сколько времени нужно оставить на домашку.",
    fields: [
      { key: "fatigueSoloPairs", label: "Усталость у одного", hint: "Пар в день у одного человека", suffix: "пар", min: 2, max: 8 },
      { key: "fatigueTotalPairs", label: "Усталость на двоих", hint: "Суммарно пар за день", suffix: "пар", min: 3, max: 14 },
      { key: "homeworkMinutes", label: "Запас на учёбу", hint: "Отнимается от встречи при 3+ парах", suffix: "мин", min: 0, max: 240 },
    ],
  },
  {
    title: "Границы дня",
    jp: "時間",
    desc: "Когда день начинается и когда каждый из вас должен быть дома.",
    fields: [
      { key: "dayStart", label: "День начинается", hint: "Раньше этого времени не считаем", type: "time" },
      { key: "herCurfew", label: "Её комендантский час", hint: "Дома к этому времени", type: "time" },
      { key: "myCurfew", label: "Твой комендантский час", hint: "Дома к этому времени", type: "time" },
    ],
  },
];

export default function SettingsPage() {
  const { data, saveSettings, savePartner, toast } = useStore();
  const [form, setForm] = useState<SettingsInfo>(data.settings);
  const [names, setNames] = useState({ me: "", her: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(data.settings);
    setNames({
      me: data.partners.find((p) => p.key === "me")?.name ?? "Я",
      her: data.partners.find((p) => p.key === "her")?.name ?? "Она",
    });
  }, [data]);

  const dirty = JSON.stringify(form) !== JSON.stringify(data.settings);

  const set = (key: keyof SettingsInfo, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value } as SettingsInfo));

  const save = async () => {
    setSaving(true);
    const ok = await saveSettings(form);
    await savePartner("me", { name: names.me || "Я" });
    await savePartner("her", { name: names.her || "Она" });
    setSaving(false);
    if (ok) toast("Настройки пересчитали анализ недели");
  };

  const clearSchedule = async (partner: "me" | "her") => {
    const res = await fetch(`/api/schedule?partner=${partner}`, { method: "DELETE" });
    if (res.ok) {
      toast(`Расписание «${partner === "me" ? names.me : names.her}» очищено`, "warn");
      location.reload();
    } else toast("Не удалось очистить", "err");
  };

  const clearUploads = async () => {
    for (const p of ["me", "her"])
      for (const k of ["classes", "calls"])
        await fetch(`/api/uploads?partner=${p}&kind=${k}`, { method: "DELETE" });
    toast("Все скриншоты удалены", "warn");
    location.reload();
  };

  return (
    <div className="space-y-5">
      <section className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-sakura-900">
            Настройки <span className="jp text-base text-ink-faint">設定</span>
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">
            Правила строгости: дорога, ожидание, разрыв в парах, усталость и время, к которому нужно
            быть дома. Меняй — анализ пересчитается мгновенно.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <span className="chip border-gold/50 bg-gold/10 text-[#a3761f]">
              <IconAlert className="h-3.5 w-3.5" /> есть изменения
            </span>
          )}
          <button className="btn btn-ghost" onClick={() => setForm(DEFAULT_SETTINGS)}>
            <IconRefresh className="h-4 w-4" /> по умолчанию
          </button>
          <button className="btn btn-primary" onClick={() => void save()} disabled={saving || !dirty}>
            <IconSave className="h-4 w-4" /> Сохранить
          </button>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-sakura-900">
          <IconSparkle className="h-4 w-4 text-sakura-500" /> Как вас зовут
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label">Ты</label>
            <input className="input" value={names.me} onChange={(e) => setNames({ ...names, me: e.target.value })} />
          </div>
          <div>
            <label className="label">Она</label>
            <input className="input" value={names.her} onChange={(e) => setNames({ ...names, her: e.target.value })} />
          </div>
          <div>
            <label className="label">Название недели</label>
            <input
              className="input"
              placeholder="Неделя с 3 марта"
              value={form.weekLabel ?? ""}
              onChange={(e) => set("weekLabel", e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {GROUPS.map((g) => (
          <section key={g.title} className="card p-5">
            <h2 className="flex items-center gap-2 font-display text-base font-bold text-sakura-900">
              <IconRoute className="h-4 w-4 text-violet" /> {g.title}{" "}
              <span className="jp text-xs font-normal text-ink-faint">{g.jp}</span>
            </h2>
            <p className="mt-1 text-xs text-ink-soft">{g.desc}</p>
            <div className="mt-3 space-y-3">
              {g.fields.map((f) => (
                <div key={f.key} className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-[180px] flex-1">
                    <p className="text-sm font-semibold text-ink">{f.label}</p>
                    <p className="text-[11px] text-ink-faint">{f.hint}</p>
                  </div>
                  {f.type === "time" ? (
                    <input
                      type="time"
                      className="input w-[120px]"
                      value={String(form[f.key] ?? "")}
                      onChange={(e) => set(f.key, e.target.value)}
                    />
                  ) : f.type === "text" ? (
                    <input
                      className="input w-[190px]"
                      value={String(form[f.key] ?? "")}
                      onChange={(e) => set(f.key, e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={f.min ?? 0}
                        max={f.max ?? 120}
                        step={f.step ?? 1}
                        value={Number(form[f.key] ?? 0)}
                        onChange={(e) => set(f.key, Number(e.target.value))}
                        className="h-1.5 w-28 cursor-pointer appearance-none rounded-full bg-sakura-200 accent-sakura-600"
                      />
                      <span className="w-20 rounded-xl border border-sakura-200 bg-white/80 px-2 py-1 text-right text-xs font-bold text-sakura-900">
                        {Number(form[f.key] ?? 0)} {f.suffix}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="card border-vermilion/30 p-5">
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-vermilion">
          <IconTrash className="h-4 w-4" /> Опасная зона
        </h2>
        <p className="mt-1 text-xs text-ink-soft">
          Скриншоты и расписание хранятся в базе и переживают перезапуск сайта. Удаляй только когда
          действительно нужно начать с нуля.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn btn-ghost" onClick={() => void clearSchedule("me")}>
            Очистить расписание: {names.me}
          </button>
          <button className="btn btn-ghost" onClick={() => void clearSchedule("her")}>
            Очистить расписание: {names.her}
          </button>
          <button className="btn border border-vermilion/30 bg-white/70 text-vermilion" onClick={() => void clearUploads()}>
            Удалить все скриншоты
          </button>
        </div>
      </section>
    </div>
  );
}
