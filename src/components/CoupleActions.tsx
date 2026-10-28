"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconCopy, IconRefresh } from "./Icons";

export default function CoupleActions({ code, link }: { code: string; link: string }) {
  const router = useRouter();
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setNote(`${what} скопирован`);
    } catch {
      setNote("Скопируй вручную — браузер не дал доступ к буферу");
    }
    setTimeout(() => setNote(null), 2600);
  };

  const rotate = async () => {
    setBusy(true);
    const res = await fetch("/api/auth/rotate", { method: "POST" });
    const body = (await res.json().catch(() => ({}))) as { ok?: boolean; joinCode?: string };
    setBusy(false);
    if (body.ok && body.joinCode) {
      setNote(`Новый код: ${body.joinCode}`);
      router.refresh();
    } else setNote("Не удалось обновить код");
    setTimeout(() => setNote(null), 4000);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button className="btn btn-ghost" onClick={() => void copy(code, "Код")}>
        <IconCopy className="h-4 w-4" /> скопировать код
      </button>
      <button className="btn btn-ghost" onClick={() => void copy(link, "Ссылка с QR")}>
        <IconCopy className="h-4 w-4" /> скопировать ссылку
      </button>
      <button className="btn btn-primary" onClick={() => void rotate()} disabled={busy}>
        <IconRefresh className="h-4 w-4" /> {busy ? "Обновляем…" : "новый QR-код"}
      </button>
      {note && <span className="chip border-matcha/40 bg-matcha/10 text-[#3f8b62]">{note}</span>}
    </div>
  );
}
