import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { partners } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getPartners, seedCouple } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  try {
    const user = await requireUser();
    if (!user) return Response.json({ ok: false, error: "Нужно войти" }, { status: 401 });
    await seedCouple(user.coupleId);

    const body = (await req.json()) as { key?: string; name?: string; title?: string };
    const key = body.key;
    if (key !== "me" && key !== "her") {
      return Response.json({ ok: false, error: "Неверный ключ партнёра" }, { status: 400 });
    }
    const name =
      typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 40) : null;
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 100) : null;

    const patch: Partial<{ name: string; title: string }> = {};
    if (name) patch.name = name;
    if (title !== null) patch.title = title;
    if (Object.keys(patch).length > 0) {
      await db
        .update(partners)
        .set(patch)
        .where(and(eq(partners.coupleId, user.coupleId), eq(partners.key, key)));
    }
    return Response.json({ ok: true, partners: await getPartners(user.coupleId) });
  } catch (err) {
    console.error(err);
    return Response.json({ ok: false, error: String(err) }, { status: 400 });
  }
}
