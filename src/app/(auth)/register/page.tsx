"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { IconAlert, IconHeart, IconSparkle } from "@/components/Icons";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    displayName: "",
    login: "",
    password: "",
    coupleName: "",
    role: "me" as "me" | "her",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !body.ok) throw new Error(body.error || "Не удалось зарегистрироваться");
      router.push("/couple");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Создать пару"
      jp="登録"
      subtitle="Первый шаг: заведите пару и получите QR-код для второго человека."
      footer={
        <>
          Уже есть пара? <Link href="/join" className="font-bold text-violet underline-offset-2 hover:underline">Войти по QR-коду</Link>
        </>
      }
    >
      <form className="space-y-3" onSubmit={submit}>
        {error && (
          <p className="flex items-center gap-2 rounded-2xl border border-vermilion/40 bg-vermilion/10 px-3 py-2 text-sm text-vermilion">
            <IconAlert className="h-4 w-4 shrink-0" /> {error}
          </p>
        )}

        <div>
          <label className="label" htmlFor="dn">Как вас зовут</label>
          <input id="dn" className="input" value={form.displayName} onChange={(e) => set("displayName", e.target.value)} placeholder="Твоё имя" required />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label" htmlFor="lg">Логин</label>
            <input id="lg" className="input" value={form.login} onChange={(e) => set("login", e.target.value)} placeholder="kitsune_2026" required />
          </div>
          <div>
            <label className="label" htmlFor="pw">Пароль</label>
            <input id="pw" type="password" className="input" autoComplete="new-password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="минимум 6 символов" required />
          </div>
        </div>

        <div>
          <span className="label">Кто ты в паре</span>
          <div className="grid grid-cols-2 gap-2">
            {([
              { key: "me", label: "Я — он", jp: "彼", tint: "#7c6bd6", bg: "#f1eeff" },
              { key: "her", label: "Я — она", jp: "彼女", tint: "#d94d88", bg: "#fff0f6" },
            ] as const).map((r) => (
              <button
                type="button"
                key={r.key}
                onClick={() => set("role", r.key)}
                className="rounded-2xl border px-3 py-2.5 text-left transition"
                style={{
                  borderColor: form.role === r.key ? r.tint : "#ffd7e7",
                  background: form.role === r.key ? r.bg : "rgba(255,255,255,.7)",
                }}
              >
                <span className="jp block text-xs" style={{ color: r.tint }}>{r.jp}</span>
                <span className="text-sm font-bold" style={{ color: r.tint }}>{r.label}</span>
              </button>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-ink-faint">
            От этого зависит, чьё расписание считается «моим», а чьё — «её». Второй участник получит
            оставшуюся роль.
          </p>
        </div>

        <div>
          <label className="label" htmlFor="cn">Название пары (необязательно)</label>
          <input id="cn" className="input" value={form.coupleName} onChange={(e) => set("coupleName", e.target.value)} placeholder="Лисы с одного факультета" />
        </div>

        <button className="btn btn-primary w-full" type="submit" disabled={busy}>
          <IconSparkle className="h-4 w-4" /> {busy ? "Создаём пару…" : "Создать пару и получить QR"}
        </button>
        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-ink-faint">
          <IconHeart className="h-3.5 w-3.5 text-sakura-500" /> регистрация открыта всем — у каждой
          пары своё расписание и свои скриншоты
        </p>
      </form>
    </AuthShell>
  );
}
