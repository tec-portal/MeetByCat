import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { dayClasses, timeBlocks } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getBootstrap } from "@/lib/store";
import { toMin } from "@/lib/time";
import type { BlockKind, PartnerKey } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Body {
  partner?: string;
  dayClasses?: {
    partnerKey?: string;
    day?: number;
    pairCount?: number;
    startTime?: string | null;
    endTime?: string | null;
    note?: string | null;
  }[];
  timeBlocks?: {
    partnerKey?: string;
    day?: number;
    kind?: string;
    startTime?: string;
    endTime?: string;
    label?: string | null;
  }[];
}

const validTime = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  return toMin(v) === null ? null : v.trim().slice(0, 5);
};

export async function PUT(req: Request) {
  try {
    const user = await requireUser();
    if (!user) return Response.json({ ok: false, error: "Нужно войти" }, { status: 401 });
    const coupleId = user.coupleId;

    const body = (await req.json()) as Body;
    const partnerRaw = body.partner ?? "all";
    const scope: PartnerKey[] =
      partnerRaw === "all"
        ? ["me", "her"]
        : partnerRaw === "me" || partnerRaw === "her"
          ? [partnerRaw]
          : [];
    if (scope.length === 0) {
      return Response.json({ ok: false, error: "Неверный партнёр" }, { status: 400 });
    }

    /** Чьи это строки: если partnerKey указан — берём его, иначе применяем ко всему scope */
    const ownersOf = (v: unknown): PartnerKey[] =>
      v === "me" || v === "her" ? (scope.includes(v) ? [v] : []) : scope;

    const nextDays = (body.dayClasses ?? [])
      .flatMap((d) =>
        ownersOf(d.partnerKey).map((partnerKey) => ({
          coupleId,
          partnerKey,
          day: Number(d.day),
          pairCount: Math.max(0, Math.min(12, Number(d.pairCount) || 0)),
          startTime: validTime(d.startTime),
          endTime: validTime(d.endTime),
          note: typeof d.note === "string" ? d.note.slice(0, 200) : null,
        })),
      )
      .filter((d) => d.day >= 1 && d.day <= 7);

    const nextBlocks = (body.timeBlocks ?? [])
      .flatMap((b) =>
        ownersOf(b.partnerKey).map((partnerKey) => ({
          coupleId,
          partnerKey,
          day: Number(b.day),
          kind: (b.kind === "break" || b.kind === "call" || b.kind === "other"
            ? b.kind
            : "other") as BlockKind,
          startTime: validTime(b.startTime),
          endTime: validTime(b.endTime),
          label: typeof b.label === "string" && b.label.trim() ? b.label.trim().slice(0, 80) : null,
        })),
      )
      .filter(
        (b) =>
          b.day >= 1 && b.day <= 7 && b.startTime && b.endTime && toMin(b.endTime)! > toMin(b.startTime)!,
      );

    await db.transaction(async (tx) => {
      for (const p of scope) {
        await tx
          .delete(dayClasses)
          .where(and(eq(dayClasses.coupleId, coupleId), eq(dayClasses.partnerKey, p)));
        await tx
          .delete(timeBlocks)
          .where(and(eq(timeBlocks.coupleId, coupleId), eq(timeBlocks.partnerKey, p)));
      }
      const seenDays = new Set<string>();
      const dayRows = nextDays.filter((r) => {
        const k = `${r.partnerKey}:${r.day}`;
        if (seenDays.has(k)) return false;
        seenDays.add(k);
        return true;
      });
      if (dayRows.length) await tx.insert(dayClasses).values(dayRows);

      const seenBlocks = new Set<string>();
      const blockRows = nextBlocks
        .filter((b) => {
          const k = `${b.partnerKey}:${b.day}:${b.kind}:${b.startTime}:${b.endTime}`;
          if (seenBlocks.has(k)) return false;
          seenBlocks.add(k);
          return true;
        })
        .map((b) => ({ ...b, startTime: b.startTime as string, endTime: b.endTime as string }));
      if (blockRows.length) await tx.insert(timeBlocks).values(blockRows);
    });

    return Response.json({ ok: true, data: await getBootstrap(coupleId) });
  } catch (err) {
    console.error(err);
    return Response.json({ ok: false, error: String(err) }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser();
    if (!user) return Response.json({ ok: false, error: "Нужно войти" }, { status: 401 });
    const coupleId = user.coupleId;

    const url = new URL(req.url);
    const partner = url.searchParams.get("partner");
    const day = Number(url.searchParams.get("day"));
    if (partner !== "me" && partner !== "her") {
      return Response.json({ ok: false, error: "Неверный партнёр" }, { status: 400 });
    }
    const dayCond = day >= 1 && day <= 7 ? and(eq(dayClasses.day, day)) : undefined;
    await db
      .delete(dayClasses)
      .where(and(eq(dayClasses.coupleId, coupleId), eq(dayClasses.partnerKey, partner), dayCond));
    const dayCondB = day >= 1 && day <= 7 ? and(eq(timeBlocks.day, day)) : undefined;
    await db
      .delete(timeBlocks)
      .where(and(eq(timeBlocks.coupleId, coupleId), eq(timeBlocks.partnerKey, partner), dayCondB));

    return Response.json({ ok: true, data: await getBootstrap(coupleId) });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 400 });
  }
}
