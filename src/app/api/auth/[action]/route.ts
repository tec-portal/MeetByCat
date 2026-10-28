import { eq } from "drizzle-orm";
import { db } from "@/db";
import { couples, users } from "@/db/schema";
import {
  createSession,
  destroySession,
  hashPassword,
  loginHint,
  makeJoinCode,
  normalizeCode,
  passwordHint,
  requireUser,
  verifyPassword,
} from "@/lib/auth";
import { seedCouple, setPartnerName } from "@/lib/store";
import type { PartnerKey } from "@/lib/types";

export const dynamic = "force-dynamic";

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

async function freeRole(coupleId: number): Promise<PartnerKey | null> {
  const rows = await db.select({ role: users.role }).from(users).where(eq(users.coupleId, coupleId));
  const taken = new Set(rows.map((r) => r.role));
  if (!taken.has("me")) return "me";
  if (!taken.has("her")) return "her";
  return null;
}

export async function POST(req: Request, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    if (action === "logout") {
      await destroySession();
      return Response.json({ ok: true });
    }

    if (action === "login") {
      const login = clean(body.login, 40).toLowerCase();
      const password = String(body.password ?? "");
      const rows = await db.select().from(users).where(eq(users.login, login)).limit(1);
      const user = rows[0];
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return Response.json({ ok: false, error: "Неверный логин или пароль" }, { status: 401 });
      }
      await createSession(user.id, user.coupleId, req.headers.get("user-agent"));
      return Response.json({ ok: true, redirect: "/" });
    }

    if (action === "register") {
      const login = clean(body.login, 40).toLowerCase();
      const displayName = clean(body.displayName, 40) || login;
      const password = String(body.password ?? "");
      const role: PartnerKey = body.role === "her" ? "her" : "me";
      const coupleName = clean(body.coupleName, 80) || "Пара";

      const loginError = loginHint(login);
      if (loginError) return Response.json({ ok: false, error: loginError }, { status: 400 });
      const pwError = passwordHint(password);
      if (pwError) return Response.json({ ok: false, error: pwError }, { status: 400 });

      const existing = await db.select({ id: users.id }).from(users).where(eq(users.login, login)).limit(1);
      if (existing.length) {
        return Response.json({ ok: false, error: "Такой логин уже занят" }, { status: 409 });
      }

      let joinCode = makeJoinCode();
      for (let i = 0; i < 5; i++) {
        const dup = await db.select({ id: couples.id }).from(couples).where(eq(couples.joinCode, joinCode)).limit(1);
        if (dup.length === 0) break;
        joinCode = makeJoinCode();
      }

      const [couple] = await db
        .insert(couples)
        .values({ name: coupleName, joinCode })
        .returning({ id: couples.id });
      await seedCouple(couple.id, role === "me" ? { me: displayName } : { her: displayName });
      const [user] = await db
        .insert(users)
        .values({
          coupleId: couple.id,
          login,
          displayName,
          passwordHash: hashPassword(password),
          role,
        })
        .returning({ id: users.id });
      await setPartnerName(couple.id, role, displayName);
      await createSession(user.id, couple.id, req.headers.get("user-agent"));
      return Response.json({ ok: true, redirect: "/couple", joinCode });
    }

    if (action === "join") {
      const rawCode = clean(body.code, 24);
      const code = normalizeCode(rawCode);
      const login = clean(body.login, 40).toLowerCase();
      const displayName = clean(body.displayName, 40) || login;
      const password = String(body.password ?? "");

      if (!code) return Response.json({ ok: false, error: "Введите код пары" }, { status: 400 });
      const loginError = loginHint(login);
      if (loginError) return Response.json({ ok: false, error: loginError }, { status: 400 });
      const pwError = passwordHint(password);
      if (pwError) return Response.json({ ok: false, error: pwError }, { status: 400 });

      const found = await db.select().from(couples).where(eq(couples.joinCode, code)).limit(1);
      const couple = found[0];
      if (!couple) {
        return Response.json({ ok: false, error: "Пара с таким кодом не найдена" }, { status: 404 });
      }
      const role = await freeRole(couple.id);
      if (!role) {
        return Response.json({ ok: false, error: "В этой паре уже два человека" }, { status: 409 });
      }
      const existing = await db.select({ id: users.id }).from(users).where(eq(users.login, login)).limit(1);
      if (existing.length) {
        return Response.json({ ok: false, error: "Такой логин уже занят" }, { status: 409 });
      }

      await seedCouple(couple.id, role === "me" ? { me: displayName } : { her: displayName });
      const [user] = await db
        .insert(users)
        .values({
          coupleId: couple.id,
          login,
          displayName,
          passwordHash: hashPassword(password),
          role,
        })
        .returning({ id: users.id });
      await setPartnerName(couple.id, role, displayName);
      await createSession(user.id, couple.id, req.headers.get("user-agent"));
      return Response.json({ ok: true, redirect: "/" });
    }

    if (action === "attach") {
      // уже вошли — просто подключаемся к паре по коду (без нового аккаунта)
      const user = await requireUser();
      if (!user) return Response.json({ ok: false, error: "Нужно войти" }, { status: 401 });
      const code = normalizeCode(clean(body.code, 24));
      const found = await db.select().from(couples).where(eq(couples.joinCode, code)).limit(1);
      if (!found[0]) return Response.json({ ok: false, error: "Код не найден" }, { status: 404 });
      return Response.json({ ok: true, coupleName: found[0].name });
    }

    if (action === "rotate") {
      const user = await requireUser();
      if (!user) return Response.json({ ok: false, error: "Нужно войти" }, { status: 401 });
      const joinCode = makeJoinCode();
      await db.update(couples).set({ joinCode }).where(eq(couples.id, user.coupleId));
      return Response.json({ ok: true, joinCode });
    }

    return Response.json({ ok: false, error: "Неизвестное действие" }, { status: 400 });
  } catch (err) {
    console.error("auth error", err);
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
