import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/store";
import { toMin } from "@/lib/time";

export const dynamic = "force-dynamic";

const num = (v: unknown, fallback: number, min: number, max: number) => {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
};

const time = (v: unknown, fallback: string) => {
  const s = typeof v === "string" ? v.trim() : "";
  return toMin(s) === null ? fallback : s.slice(0, 5);
};

export async function PUT(req: Request) {
  try {
    const user = await requireUser();
    if (!user) return Response.json({ ok: false, error: "Нужно войти" }, { status: 401 });

    const body = (await req.json()) as Record<string, unknown>;
    const current = await getSettings(user.coupleId);

    const next = {
      weekLabel:
        typeof body.weekLabel === "string" && body.weekLabel.trim()
          ? body.weekLabel.trim().slice(0, 120)
          : current.weekLabel,
      travelMinutes: num(body.travelMinutes, current.travelMinutes, 0, 180),
      returnTravelMinutes: num(body.returnTravelMinutes, current.returnTravelMinutes, 0, 180),
      herReturnMinutes: num(body.herReturnMinutes, current.herReturnMinutes, 0, 120),
      pairMinutes: num(body.pairMinutes, current.pairMinutes, 20, 240),
      breakMinutes: num(body.breakMinutes, current.breakMinutes, 0, 60),
      maxWaitMinutes: num(body.maxWaitMinutes, current.maxWaitMinutes, 0, 240),
      maxGapPairs: num(body.maxGapPairs, current.maxGapPairs, 0, 6),
      fatigueSoloPairs: num(body.fatigueSoloPairs, current.fatigueSoloPairs, 1, 10),
      fatigueTotalPairs: num(body.fatigueTotalPairs, current.fatigueTotalPairs, 2, 16),
      homeworkMinutes: num(body.homeworkMinutes, current.homeworkMinutes, 0, 240),
      dayStart: time(body.dayStart, current.dayStart),
      herCurfew: time(body.herCurfew, current.herCurfew),
      myCurfew: time(body.myCurfew, current.myCurfew),
      minMeetingMinutes: num(body.minMeetingMinutes, current.minMeetingMinutes, 15, 240),
      meetPlace:
        typeof body.meetPlace === "string" && body.meetPlace.trim()
          ? body.meetPlace.trim().slice(0, 120)
          : current.meetPlace,
    };

    await db.update(settings).set(next).where(eq(settings.coupleId, user.coupleId));
    return Response.json({ ok: true, settings: await getSettings(user.coupleId) });
  } catch (err) {
    console.error(err);
    return Response.json({ ok: false, error: String(err) }, { status: 400 });
  }
}
