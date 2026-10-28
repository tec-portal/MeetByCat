import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { plans } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getPlans } from "@/lib/store";
import { toMin } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    if (!user) return Response.json({ ok: false, error: "Нужно войти" }, { status: 401 });
    return Response.json({ ok: true, plans: await getPlans(user.coupleId) });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (!user) return Response.json({ ok: false, error: "Нужно войти" }, { status: 401 });

    const body = (await req.json()) as Record<string, unknown>;
    const planDate = typeof body.planDate === "string" ? body.planDate.slice(0, 10) : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(planDate)) {
      return Response.json({ ok: false, error: "Нужна дата в формате ГГГГ-ММ-ДД" }, { status: 400 });
    }
    const title =
      typeof body.title === "string" && body.title.trim() ? body.title.trim().slice(0, 140) : "Свидание";
    const startTime =
      typeof body.startTime === "string" && toMin(body.startTime) !== null
        ? body.startTime.slice(0, 5)
        : "18:00";
    const endTime =
      typeof body.endTime === "string" && toMin(body.endTime) !== null ? body.endTime.slice(0, 5) : "20:00";
    const note = typeof body.note === "string" ? body.note.slice(0, 500) : null;
    const dayNum = Number(body.day);
    const day = dayNum >= 1 && dayNum <= 7 ? dayNum : null;

    const inserted = await db
      .insert(plans)
      .values({
        coupleId: user.coupleId,
        planDate,
        title,
        startTime,
        endTime,
        note,
        day,
        status: "planned",
      })
      .returning({ id: plans.id });

    return Response.json({ ok: true, id: inserted[0]?.id, plans: await getPlans(user.coupleId) });
  } catch (err) {
    console.error(err);
    return Response.json({ ok: false, error: String(err) }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    if (!user) return Response.json({ ok: false, error: "Нужно войти" }, { status: 401 });

    const body = (await req.json()) as { id?: number; status?: string; title?: string };
    if (typeof body.id !== "number") {
      return Response.json({ ok: false, error: "Нет id" }, { status: 400 });
    }
    const patch: Partial<{ status: string; title: string }> = {};
    if (body.status === "planned" || body.status === "done") patch.status = body.status;
    if (typeof body.title === "string" && body.title.trim()) patch.title = body.title.trim().slice(0, 140);
    if (Object.keys(patch).length) {
      await db
        .update(plans)
        .set(patch)
        .where(and(eq(plans.id, body.id), eq(plans.coupleId, user.coupleId)));
    }
    return Response.json({ ok: true, plans: await getPlans(user.coupleId) });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser();
    if (!user) return Response.json({ ok: false, error: "Нужно войти" }, { status: 401 });

    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id"));
    if (!Number.isFinite(id) || id <= 0) {
      return Response.json({ ok: false, error: "Нет id" }, { status: 400 });
    }
    await db.delete(plans).where(and(eq(plans.id, id), eq(plans.coupleId, user.coupleId)));
    return Response.json({ ok: true, plans: await getPlans(user.coupleId) });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 400 });
  }
}
