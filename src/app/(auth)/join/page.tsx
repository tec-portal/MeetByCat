"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { IconAlert, IconCheck, IconImage, IconSparkle } from "@/components/Icons";
import { normalizeJoinCode } from "@/lib/joincode";

/** Достаём код пары из QR-картинки (из галереи) прямо в браузере. */
async function readQrFromFile(file: File): Promise<string> {
  const { default: jsQR } = await import("jsqr");
  const bitmap = await createImageBitmap(file);
  const maxSide = 1400;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Не удалось прочитать изображение");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const found = jsQR(img.data, img.width, img.height, { inversionAttempts: "attemptBoth" });
  if (!found?.data) throw new Error("QR-код на картинке не найден");
  return found.data.trim();
}

export default function JoinPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [code, setCode] = useState("");
  const [qrNote, setQrNote] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [form, setForm] = useState({ displayName: "", login: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // код из ссылки /join?code=... (QR, отсканированный камерой телефона)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("code") || params.get("c");
    if (fromUrl) setCode(normalizeJoinCode(fromUrl));
  }, []);

  const onQrFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setReading(true);
    setQrNote(null);
    try {
      const raw = await readQrFromFile(file);
      const extracted = normalizeJoinCode(raw);
      setCode(extracted);
      setQrNote(`QR прочитан: ${extracted}`);
    } catch (e) {
      setQrNote(e instanceof Error ? e.message : "Не удалось прочитать QR");
    } finally {
      setReading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, code }),
      });
      const body = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !body.ok) throw new Error(body.error || "Не удалось присоединиться");
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка подключения");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Подключиться к паре"
      jp="接続"
      subtitle="Прикрепи QR-код из галереи или введи код вручную — и ваши расписания встретятся."
      footer={
        <>
          Нет кода? <Link href="/register" className="font-bold text-sakura-700 underline-offset-2 hover:underline">Создай свою пару</Link>
        </>
      }
    >
      <form className="space-y-3" onSubmit={submit}>
        {error && (
          <p className="flex items-center gap-2 rounded-2xl border border-vermilion/40 bg-vermilion/10 px-3 py-2 text-sm text-vermilion">
            <IconAlert className="h-4 w-4 shrink-0" /> {error}
          </p>
        )}

        <div className="rounded-3xl border border-sakura-200 bg-sakura-50/70 p-3">
          <span className="label">QR-код пары из галереи</span>
          <div
            className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-sakura-300 bg-white/70 px-3 py-4 text-sakura-700 transition hover:border-sakura-500"
            onClick={() => fileRef.current?.click()}
            onDragOver={(ev) => ev.preventDefault()}
            onDrop={(ev) => {
              ev.preventDefault();
              void onQrFile(ev.dataTransfer.files);
            }}
          >
            <IconImage className="h-5 w-5" />
            <span className="text-xs font-semibold">
              {reading ? "Читаем QR…" : "Перетащи или нажми — выберем снимок QR-кода"}
            </span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void onQrFile(e.target.files);
              e.target.value = "";
            }}
          />
          {qrNote && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-sakura-800">
              <IconCheck className="h-3.5 w-3.5" /> {qrNote}
            </p>
          )}
        </div>

        <div>
          <label className="label" htmlFor="code">Код пары</label>
          <input
            id="code"
            className="input text-center font-mono text-base tracking-[0.2em]"
            value={code}
            onChange={(e) => setCode(normalizeJoinCode(e.target.value))}
            placeholder="SAKURA-7F3K2Q"
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="dn2">Как тебя зовут</label>
          <input id="dn2" className="input" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="Имя" required />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label" htmlFor="lg2">Логин</label>
            <input id="lg2" className="input" value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} placeholder="sakura_girl" required />
          </div>
          <div>
            <label className="label" htmlFor="pw2">Пароль</label>
            <input id="pw2" type="password" className="input" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="минимум 6 символов" required />
          </div>
        </div>

        <button className="btn btn-primary w-full" type="submit" disabled={busy || !code}>
          <IconSparkle className="h-4 w-4" /> {busy ? "Соединяем расписания…" : "Присоединиться"}
        </button>
        <p className="text-center text-[11px] text-ink-faint">
          Роль в паре выдастся автоматически: свободная сторона расписания станет твоей.
        </p>
      </form>
    </AuthShell>
  );
}
