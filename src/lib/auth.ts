import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { couples, sessions, users } from "@/db/schema";
import { normalizeJoinCode } from "./joincode";
import type { PartnerKey } from "./types";

export const COOKIE_NAME = "kitsune_session";
export const SESSION_DAYS = 60;

export interface AuthUser {
  userId: number;
  coupleId: number;
  login: string;
  displayName: string;
  role: PartnerKey;
  coupleName: string;
  joinCode: string;
}

const CODE_WORDS = ["SAKURA", "KITSUNE", "TORII", "YUKI", "HANA", "TSUKI", "HOSHI", "MOMIJI"];
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Человекочитаемый код пары: SAKURA-7F3K2Q */
export function makeJoinCode(): string {
  const bytes = randomBytes(8);
  const word = CODE_WORDS[bytes[0] % CODE_WORDS.length];
  let tail = "";
  for (let i = 1; i <= 6; i++) tail += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return `${word}-${tail}`;
}

export function normalizeCode(code: string): string {
  return normalizeJoinCode(code);
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export async function createSession(userId: number, coupleId: number, userAgent?: string | null) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await db.insert(sessions).values({
    token,
    userId,
    coupleId,
    userAgent: userAgent?.slice(0, 300) ?? null,
    expiresAt,
  });
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return token;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.token, token));
  store.delete(COOKIE_NAME);
}

/** Текущий пользователь из cookie. Возвращает null, если входа не было. */
export async function currentUser(): Promise<AuthUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const rows = await db
    .select({
      sessionToken: sessions.token,
      userId: users.id,
      coupleId: users.coupleId,
      login: users.login,
      displayName: users.displayName,
      role: users.role,
      coupleName: couples.name,
      joinCode: couples.joinCode,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .innerJoin(couples, eq(couples.id, users.coupleId))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  return {
    userId: row.userId,
    coupleId: row.coupleId,
    login: row.login,
    displayName: row.displayName,
    role: row.role as PartnerKey,
    coupleName: row.coupleName,
    joinCode: row.joinCode,
  };
}

/** Для API: пользователь или null (роут сам вернёт 401). */
export const requireUser = currentUser;

export function loginHint(login: string): string | null {
  const v = login.trim().toLowerCase();
  if (v.length < 3) return "Логин минимум 3 символа";
  if (!/^[a-z0-9_.-]+$/.test(v)) return "Только латиница, цифры, _ . -";
  return null;
}

export function passwordHint(pw: string): string | null {
  if (pw.length < 6) return "Пароль минимум 6 символов";
  return null;
}
