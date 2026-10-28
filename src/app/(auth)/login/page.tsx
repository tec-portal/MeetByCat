"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { IconAlert, IconTorii } from "@/components/Icons";

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      const body = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !body.ok) throw new Error(body.error || "Не удалось войти");
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Вход"
      jp="ログイン"
      subtitle="Введите логин и пароль — расписание вашей пары уже ждёт."
      footer={
        <>
          Нет аккаунта? <Link href="/register" className="font-bold text-sakura-700 underline-offset-2 hover:underline">Создать пару</Link>
          {" · "}
          Есть QR-код? <Link href="/join" className="font-bold text-violet underline-offset-2 hover:underline">Присоединиться</Link>
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
          <label className="label" htmlFor="login">Логин</label>
          <input
            id="login"
            className="input"
            autoComplete="username"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            placeholder="kitsune_2026"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="password">Пароль</label>
          <input
            id="password"
            type="password"
            className="input"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            required
          />
        </div>
        <button className="btn btn-primary w-full" type="submit" disabled={busy}>
          <IconTorii className="h-4 w-4" /> {busy ? "Открываем калитку…" : "Войти"}
        </button>
        <p className="text-center text-[11px] text-ink-faint">
          Вход работает с любого устройства и браузера — сессия живёт 60 дней.
        </p>
      </form>
    </AuthShell>
  );
}
