import { redirect } from "next/navigation";
import QRCode from "qrcode";
import CoupleActions from "@/components/CoupleActions";
import Kitsune from "@/components/Kitsune";
import { IconCheck, IconHeart, IconImage, IconSparkle } from "@/components/Icons";
import { currentUser } from "@/lib/auth";
import { siteOrigin } from "@/lib/origin";
import { getCoupleMembers } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CouplePage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const origin = await siteOrigin();
  const link = `${origin}/join?code=${encodeURIComponent(user.joinCode)}`;
  const qr = await QRCode.toDataURL(link, {
    margin: 1,
    width: 640,
    errorCorrectionLevel: "M",
    color: { dark: "#8a2c55", light: "#fffafc" },
  });

  const members = await getCoupleMembers(user.coupleId);
  const slotMe = members.find((m) => m.role === "me");
  const slotHer = members.find((m) => m.role === "her");
  const complete = Boolean(slotMe && slotHer);

  return (
    <div className="space-y-5">
      <section className="card relative overflow-hidden">
        <div className="asanoha pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative grid gap-6 p-6 lg:grid-cols-[auto_1fr] lg:p-8">
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-[28px] border-4 border-sakura-200 bg-white p-3 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="QR-код пары" width={248} height={248} className="h-56 w-56 sm:h-62 sm:w-62" />
            </div>
            <a href={qr} download="kitsune-qr.png" className="btn btn-ghost">
              <IconImage className="h-4 w-4" /> скачать QR
            </a>
          </div>

          <div>
            <p className="jp text-xs tracking-[0.3em] text-sakura-600">絆 · связь пары</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-sakura-900">{user.coupleName}</h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-soft">
              Покажи этот QR-код второму человеку: он отсканирует его камерой телефона или прикрепит
              снимок из галереи на странице подключения — и ваши расписания окажутся в одном календаре.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-sakura-300 bg-white/85 px-4 py-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">код пары</p>
                <p className="font-mono text-xl font-extrabold tracking-[0.18em] text-sakura-800">
                  {user.joinCode}
                </p>
              </div>
              <div className="min-w-[200px] flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">ссылка</p>
                <p className="truncate text-sm font-semibold text-violet">{link}</p>
              </div>
            </div>

            <div className="mt-4">
              <CoupleActions code={user.joinCode} link={link} />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { slot: slotMe, jp: "彼", label: "Он (моё расписание)", tint: "#7c6bd6", bg: "#f1eeff" },
                { slot: slotHer, jp: "彼女", label: "Она (её расписание)", tint: "#d94d88", bg: "#fff0f6" },
              ].map((s) => (
                <div
                  key={s.jp}
                  className="rounded-3xl border p-4"
                  style={{ borderColor: `${s.tint}44`, background: s.bg }}
                >
                  <p className="jp text-xs" style={{ color: s.tint }}>{s.jp}</p>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">{s.label}</p>
                  {s.slot ? (
                    <p className="mt-1 flex items-center gap-2 font-display text-base font-bold" style={{ color: s.tint }}>
                      <IconCheck className="h-4 w-4" /> {s.slot.displayName}
                      <span className="text-xs font-semibold text-ink-faint">@{s.slot.login}</span>
                    </p>
                  ) : (
                    <p className="mt-1 font-display text-base font-bold text-ink-faint">
                      свободно — ждём второго
                    </p>
                  )}
                </div>
              ))}
            </div>

            <p
              className={`mt-4 flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold ${
                complete
                  ? "border-matcha/40 bg-matcha/10 text-[#3f8b62]"
                  : "border-gold/40 bg-gold/10 text-[#a3761f]"
              }`}
            >
              {complete ? <IconHeart className="h-4 w-4" /> : <IconSparkle className="h-4 w-4" />}
              {complete
                ? "Пара соединена: вы видите одно расписание на двоих и оба можете менять скриншоты."
                : "Пара ещё не полная: как только второй человек войдёт по коду, здесь появится его имя."}
            </p>
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="font-display text-lg font-bold text-sakura-900">Как подключиться вдвоём</h2>
        <ol className="mt-3 grid gap-3 text-sm text-ink-soft md:grid-cols-3">
          {[
            {
              t: "1. Один создаёт пару",
              d: "Регистрация занимает 20 секунд: имя, логин, пароль и роль — «я он» или «я она».",
            },
            {
              t: "2. Второй входит по QR",
              d: "Камерой телефона или через «прикрепить из галереи» на странице подключения. Можно и просто вписать код.",
            },
            {
              t: "3. Дальше — оба",
              d: "Каждый загружает свои два скрина: пары и звонки/перемены. Вход с любого устройства и браузера, сессия живёт 60 дней.",
            },
          ].map((s) => (
            <li key={s.t} className="card-flat p-4">
              <p className="font-display text-sm font-bold text-sakura-900">{s.t}</p>
              <p className="mt-1 text-xs leading-relaxed">{s.d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-sakura-50/80 p-3">
          <Kitsune size={54} mood={complete ? "happy" : "calm"} />
          <p className="text-xs text-ink-soft">
            Кицунэ напоминает: сайт доступен всем — у каждой пары своё расписание, свои скриншоты и
            своя приватность. Чужие данные вы не увидите.
          </p>
        </div>
      </section>
    </div>
  );
}
