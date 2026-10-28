import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { dayClasses, partners, plans, settings, timeBlocks, uploads } from "@/db/schema";
import { DEFAULT_SETTINGS } from "./defaults";
import type {
  BlockInfo,
  BootstrapData,
  DayClassInfo,
  PartnerInfo,
  PlanInfo,
  SettingsInfo,
  UploadMeta,
} from "./types";

/** Первичная обвязка новой пары: партнёры + настройки по умолчанию. */
export async function seedCouple(
  coupleId: number,
  names?: { me?: string | null; her?: string | null },
) {
  await db
    .insert(partners)
    .values([
      {
        coupleId,
        key: "me",
        name: names?.me?.trim() || "Я",
        title: "мои пары и звонки",
        color: "#7c6bd6",
      },
      {
        coupleId,
        key: "her",
        name: names?.her?.trim() || "Она",
        title: "её пары и звонки",
        color: "#e88bab",
      },
    ])
    .onConflictDoNothing();
  await db.insert(settings).values({ coupleId, ...DEFAULT_SETTINGS }).onConflictDoNothing();
}

export async function getSettings(coupleId: number): Promise<SettingsInfo> {
  await seedCouple(coupleId);
  const rows = await db.select().from(settings).where(eq(settings.coupleId, coupleId)).limit(1);
  const row = rows[0];
  if (!row) return DEFAULT_SETTINGS;
  const { coupleId: _drop, ...rest } = row;
  void _drop;
  return rest as SettingsInfo;
}

export async function getPartners(coupleId: number): Promise<PartnerInfo[]> {
  await seedCouple(coupleId);
  const rows = await db
    .select()
    .from(partners)
    .where(eq(partners.coupleId, coupleId))
    .orderBy(asc(partners.key));
  return rows.map((r) => ({
    key: r.key as PartnerInfo["key"],
    name: r.name,
    title: r.title,
    color: r.color,
  }));
}

/** Подписываем сторону расписания именем человека, который к ней подключился. */
export async function setPartnerName(coupleId: number, key: PartnerInfo["key"], name: string) {
  await seedCouple(coupleId);
  const clean = name.trim().slice(0, 40);
  if (!clean) return;
  await db
    .update(partners)
    .set({ name: clean })
    .where(and(eq(partners.coupleId, coupleId), eq(partners.key, key)));
}

export async function getDayClasses(coupleId: number): Promise<DayClassInfo[]> {
  const rows = await db
    .select()
    .from(dayClasses)
    .where(eq(dayClasses.coupleId, coupleId))
    .orderBy(asc(dayClasses.day));
  return rows.map((r) => ({
    partnerKey: r.partnerKey as PartnerInfo["key"],
    day: r.day,
    pairCount: r.pairCount,
    startTime: r.startTime,
    endTime: r.endTime,
    note: r.note,
  }));
}

export async function getTimeBlocks(coupleId: number): Promise<BlockInfo[]> {
  const rows = await db
    .select()
    .from(timeBlocks)
    .where(eq(timeBlocks.coupleId, coupleId))
    .orderBy(asc(timeBlocks.day));
  return rows.map((r) => ({
    id: r.id,
    partnerKey: r.partnerKey as PartnerInfo["key"],
    day: r.day,
    kind: r.kind as BlockInfo["kind"],
    startTime: r.startTime,
    endTime: r.endTime,
    label: r.label,
  }));
}

export async function getUploadMeta(coupleId: number): Promise<UploadMeta[]> {
  const rows = await db
    .select({
      partnerKey: uploads.partnerKey,
      kind: uploads.kind,
      fileName: uploads.fileName,
      mimeType: uploads.mimeType,
      sizeBytes: uploads.sizeBytes,
      createdAt: uploads.createdAt,
      ocrText: uploads.ocrText,
    })
    .from(uploads)
    .where(eq(uploads.coupleId, coupleId));
  return rows.map((r) => ({
    partnerKey: r.partnerKey as PartnerInfo["key"],
    kind: r.kind as UploadMeta["kind"],
    fileName: r.fileName,
    mimeType: r.mimeType,
    sizeBytes: r.sizeBytes,
    createdAt: new Date(r.createdAt).toISOString(),
    ocrText: r.ocrText,
  }));
}

export async function getPlans(coupleId: number): Promise<PlanInfo[]> {
  const rows = await db
    .select()
    .from(plans)
    .where(eq(plans.coupleId, coupleId))
    .orderBy(asc(plans.planDate));
  return rows.map((r) => ({
    id: r.id,
    planDate: r.planDate,
    startTime: r.startTime,
    endTime: r.endTime,
    title: r.title,
    note: r.note,
    day: r.day,
    status: r.status,
  }));
}

export async function getBootstrap(coupleId: number): Promise<BootstrapData> {
  const [p, s, d, b, u] = await Promise.all([
    getPartners(coupleId),
    getSettings(coupleId),
    getDayClasses(coupleId),
    getTimeBlocks(coupleId),
    getUploadMeta(coupleId),
  ]);
  return {
    partners: p,
    settings: s,
    dayClasses: d,
    timeBlocks: b,
    uploads: u,
    hasAnyData: d.length > 0 || b.length > 0 || u.length > 0,
    demo: false,
  };
}

/** Кто из пары уже зарегистрирован (для страницы подключения). */
export async function getCoupleMembers(coupleId: number) {
  const { users } = await import("@/db/schema");
  const rows = await db
    .select({
      role: users.role,
      displayName: users.displayName,
      login: users.login,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.coupleId, coupleId));
  return rows;
}

export async function findUpload(
  coupleId: number,
  partnerKey: string,
  kind: string,
) {
  const rows = await db
    .select({ data: uploads.data, mimeType: uploads.mimeType, createdAt: uploads.createdAt })
    .from(uploads)
    .where(
      and(
        eq(uploads.coupleId, coupleId),
        eq(uploads.partnerKey, partnerKey),
        eq(uploads.kind, kind),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}
