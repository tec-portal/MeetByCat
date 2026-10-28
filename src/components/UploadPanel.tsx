"use client";

import { useRef, useState } from "react";
import { applyParse, parseScheduleText } from "@/lib/parse";
import { useStore } from "./StoreProvider";
import { IconAlert, IconImage, IconRefresh, IconSparkle, IconTrash, IconUpload } from "./Icons";
import type { PartnerKey, UploadKind } from "@/lib/types";

const SLOTS: { kind: UploadKind; title: string; jp: string; hint: string }[] = [
  {
    kind: "classes",
    title: "Скрин пар",
    jp: "授業",
    hint: "Расписание занятий: сколько пар и во сколько начинаются",
  },
  {
    kind: "calls",
    title: "Скрин звонков и перемен",
    jp: "休み時間",
    hint: "Расписание перерывов и график ваших созвонов",
  },
];

type LoggerLike = { status?: string; progress?: number };

async function recognizeImage(
  file: File,
  onProgress: (p: number, status: string) => void,
): Promise<string> {
  const prepared = await upscale(file);
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker(["rus", "eng"], 1, {
    logger: (m: unknown) => {
      const msg = m as LoggerLike;
      onProgress(Number(msg.progress ?? 0), String(msg.status ?? ""));
    },
  });
  try {
    const { data } = await worker.recognize(prepared);
    return data.text ?? "";
  } finally {
    await worker.terminate();
  }
}

/**
 * Сжимаем снимок перед отправкой в базу: скриншот с телефона весит 2–5 МБ,
 * а для просмотра и повторного распознавания хватает 1800 px по длинной стороне.
 * Распознавание при этом идёт по оригиналу, так что точность не страдает.
 */
async function compressForStorage(file: File, maxSide = 1800, maxBytes = 3_000_000): Promise<File> {
  if (file.size <= 700_000) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);

    const base = file.name.replace(/\.[^.]+$/, "");
    let last: Blob | null = null;
    for (const quality of [0.92, 0.82, 0.72, 0.6]) {
      last = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality),
      );
      if (last && last.size <= maxBytes) {
        return new File([last], `${base}.jpg`, { type: "image/jpeg" });
      }
    }
    if (last && last.size < file.size) return new File([last], `${base}.jpg`, { type: "image/jpeg" });
    return file;
  } catch {
    return file;
  }
}

/** Небольшие снимки увеличиваем — так распознавание заметно точнее. */
async function upscale(file: File): Promise<File | Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    if (bitmap.width >= 1100) return file;
    const scale = Math.min(3, 1600 / bitmap.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b ?? file), "image/png"),
    );
  } catch {
    return file;
  }
}

function daysAgo(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

export default function UploadPanel() {
  const { data, imageVersion, uploadImage, deleteUpload, saveSchedule, toast } = useStore();
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [lightbox, setLightbox] = useState<{ partner: PartnerKey; kind: UploadKind } | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const runOcrAndSave = async (partner: PartnerKey, kind: UploadKind, file: File) => {
    const key = `${partner}:${kind}`;
    setBusy(key);
    setProgress(0.02);
    let text = "";
    let ocrFailed = false;
    try {
      text = await recognizeImage(file, (p, status) => {
        setProgress(status === "recognizing text" ? 0.25 + p * 0.65 : Math.max(0.05, p * 0.25));
      });
    } catch (e) {
      ocrFailed = true;
      console.warn("OCR недоступен", e);
    }
    setProgress(0.9);
    const toStore = await compressForStorage(file);
    setProgress(0.95);

    const okUpload = await uploadImage(partner, kind, toStore, text || undefined);
    if (!okUpload) {
      setBusy(null);
      return;
    }

    if (text.trim()) {
      const parsed = parseScheduleText(text, kind);
      if (parsed.days.length > 0 || parsed.blocks.length > 0) {
        // первый скрин этого человека полностью заменяет его расписание (в т.ч. пример)
        const firstForPartner = !data.uploads.some((u) => u.partnerKey === partner);
        const merged = applyParse(parsed, partner, {
          dayClasses: firstForPartner
            ? data.dayClasses.filter((d) => d.partnerKey !== partner)
            : data.dayClasses,
          timeBlocks: firstForPartner
            ? data.timeBlocks.filter((b) => b.partnerKey !== partner)
            : data.timeBlocks,
        });
        await saveSchedule({ partner, dayClasses: merged.dayClasses, timeBlocks: merged.timeBlocks });
        const bits: string[] = [];
        if (parsed.days.length) bits.push(`дней с парами: ${parsed.days.length}`);
        if (parsed.blocks.length) bits.push(`интервалов перемен/звонков: ${parsed.blocks.length}`);
        toast(`Распознано — ${bits.join(", ")}. Проверь на вкладке «Расписание».`, "warn");
      } else {
        toast("Скрин сохранён, но время не распознано — заполни день вручную", "warn");
      }
    } else if (ocrFailed) {
      toast("Скрин сохранён. Распознавание текста недоступно — заполни расписание вручную", "warn");
    } else {
      toast("Скрин сохранён, но текст не найден — заполни расписание вручную", "warn");
    }
    setProgress(1);
    setBusy(null);
  };

  const onPick = async (partner: PartnerKey, kind: UploadKind, files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("Нужно изображение (PNG/JPG)", "err");
      return;
    }
    await runOcrAndSave(partner, kind, file);
  };

  const reparse = async (partner: PartnerKey, kind: UploadKind) => {
    setBusy(`${partner}:${kind}`);
    setProgress(0.05);
    try {
      const res = await fetch(`/api/uploads/image?partner=${partner}&kind=${kind}&v=${imageVersion}`);
      if (!res.ok) throw new Error("нет изображения");
      const blob = await res.blob();
      const file = new File([blob], "screenshot.png", { type: blob.type || "image/png" });
      const text = await recognizeImage(file, (p, status) =>
        setProgress(status === "recognizing text" ? 0.2 + p * 0.7 : Math.max(0.05, p * 0.2)),
      );
      const parsed = parseScheduleText(text, kind);
      await fetch("/api/uploads/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partner, kind, text }),
      });
      if (parsed.days.length === 0 && parsed.blocks.length === 0) {
        toast("Ничего не распознано — попробуй скрин покрупнее", "warn");
      } else {
        const merged = applyParse(parsed, partner, {
          dayClasses: data.dayClasses,
          timeBlocks: data.timeBlocks,
        });
        await saveSchedule({ partner, dayClasses: merged.dayClasses, timeBlocks: merged.timeBlocks });
        toast("Расписание обновлено по скриншоту 🌸");
      }
    } catch (e) {
      toast(e instanceof Error ? `Не удалось распознать: ${e.message}` : "Ошибка распознавания", "err");
    } finally {
      setBusy(null);
      setProgress(0);
    }
  };

  return (
    <section className="card overflow-hidden">
      <div className="seigaiha flex flex-wrap items-end justify-between gap-3 border-b border-sakura-200/70 px-5 py-4">
        <div>
          <h2 className="text-lg font-bold text-sakura-900">
            Скриншоты расписаний <span className="jp text-sm text-ink-faint">時間割</span>
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">
            Достаточно <b>двух картинок на каждого</b>: пары и звонки/перемены. Снимки хранятся в базе и
            не сбрасываются — раз в неделю просто замени их новыми, и анализ пересчитается.
          </p>
        </div>
        <span className="chip">
          <IconSparkle className="h-3.5 w-3.5" /> распознавание прямо в браузере
        </span>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-2">
        {(["me", "her"] as PartnerKey[]).map((partner) => {
          const p = data.partners.find((x) => x.key === partner);
          return (
            <div key={partner} className="space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: partner === "me" ? "#7c6bd6" : "#f26fa4" }}
                />
                <h3 className="font-display text-base font-bold" style={{ color: partner === "me" ? "#5b4bb0" : "#b23a6d" }}>
                  {p?.name ?? (partner === "me" ? "Я" : "Она")}
                </h3>
                <span className="jp text-xs text-ink-faint">{partner === "me" ? "彼" : "彼女"}</span>
              </div>

              {SLOTS.map((slot) => {
                const key = `${partner}:${slot.kind}`;
                const meta = data.uploads.find((u) => u.partnerKey === partner && u.kind === slot.kind);
                const isBusy = busy === key;
                const age = meta ? daysAgo(meta.createdAt) : null;
                return (
                  <div
                    key={key}
                    className="card-flat relative p-3.5 transition hover:border-sakura-300"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      void onPick(partner, slot.kind, e.dataTransfer.files);
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-sm font-bold text-sakura-900">
                          {slot.title} <span className="jp text-[11px] font-normal text-ink-faint">{slot.jp}</span>
                        </p>
                        <p className="mt-0.5 text-xs text-ink-soft">{slot.hint}</p>
                      </div>
                      {meta && age !== null && (
                        <span
                          className={`chip shrink-0 ${age > 7 ? "border-vermilion/40 text-vermilion" : "text-sakura-800"}`}
                          title="Скриншоты стоит менять раз в неделю"
                        >
                          {age === 0 ? "сегодня" : `${age} дн. назад`}
                          {age > 7 && <IconAlert className="h-3.5 w-3.5" />}
                        </span>
                      )}
                    </div>

                    {meta ? (
                      <div className="mt-3 flex gap-3">
                        <button
                          type="button"
                          onClick={() => setLightbox({ partner, kind: slot.kind })}
                          className="group relative h-24 w-32 shrink-0 overflow-hidden rounded-2xl border border-sakura-200 bg-white"
                          title="Открыть скриншот"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/api/uploads/image?partner=${partner}&kind=${slot.kind}&v=${imageVersion}`}
                            alt={meta.fileName}
                            className="h-full w-full object-cover transition group-hover:scale-105"
                          />
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-ink">{meta.fileName}</p>
                          <p className="text-[11px] text-ink-faint">
                            {(meta.sizeBytes / 1024).toFixed(0)} КБ ·{" "}
                            {new Date(meta.createdAt).toLocaleString("ru-RU", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <button
                              className="btn btn-ghost px-3 py-1.5 text-xs"
                              onClick={() => inputs.current[key]?.click()}
                              disabled={isBusy}
                            >
                              <IconUpload className="h-3.5 w-3.5" /> Заменить
                            </button>
                            <button
                              className="btn btn-ghost px-3 py-1.5 text-xs"
                              onClick={() => void reparse(partner, slot.kind)}
                              disabled={isBusy}
                              title="Заново прочитать текст со скриншота"
                            >
                              <IconRefresh className="h-3.5 w-3.5" /> Распознать
                            </button>
                            <button
                              className="btn border border-vermilion/30 bg-white/70 px-3 py-1.5 text-xs text-vermilion hover:bg-vermilion/10"
                              onClick={() => void deleteUpload(partner, slot.kind)}
                              disabled={isBusy}
                            >
                              <IconTrash className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => inputs.current[key]?.click()}
                        disabled={isBusy}
                        className="mt-3 flex h-24 w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-sakura-300 bg-white/60 text-sakura-700 transition hover:border-sakura-500 hover:bg-sakura-100/70"
                      >
                        <IconImage className="h-6 w-6" />
                        <span className="text-xs font-semibold">Перетащи скрин или нажми</span>
                      </button>
                    )}

                    <input
                      ref={(el) => {
                        inputs.current[key] = el;
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        void onPick(partner, slot.kind, e.target.files);
                        e.target.value = "";
                      }}
                    />

                    {isBusy && (
                      <div className="mt-3">
                        <div className="h-2 overflow-hidden rounded-full bg-sakura-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-sakura-400 to-sakura-600 transition-all duration-300"
                            style={{ width: `${Math.round(progress * 100)}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-ink-soft">
                          Кицунэ читает скриншот… {Math.round(progress * 100)}%
                          {progress < 0.15 ? " (в первый раз качает модель языка)" : ""}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-sakura-900/60 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <div className="max-h-[88vh] max-w-3xl overflow-auto rounded-3xl border border-sakura-200 bg-white p-3 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/uploads/image?partner=${lightbox.partner}&kind=${lightbox.kind}&v=${imageVersion}`}
              alt="Скриншот расписания"
              className="w-full rounded-2xl"
            />
            <p className="px-2 py-2 text-center text-xs text-ink-faint">Нажми куда угодно, чтобы закрыть</p>
          </div>
        </div>
      )}
    </section>
  );
}
