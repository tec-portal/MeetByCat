import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { uploads } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getUploadMeta } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Сохраняет распознанный текст скриншота, чтобы разобрать его повторно. */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (!user) return Response.json({ ok: false, error: "Нужно войти" }, { status: 401 });

    const body = (await req.json()) as { partner?: string; kind?: string; text?: string };
    const partner = body.partner;
    const kind = body.kind;
    if ((partner !== "me" && partner !== "her") || (kind !== "classes" && kind !== "calls")) {
      return Response.json({ ok: false, error: "Неверный слот" }, { status: 400 });
    }
    const text = typeof body.text === "string" ? body.text.slice(0, 20000) : "";
    await db
      .update(uploads)
      .set({ ocrText: text })
      .where(
        and(
          eq(uploads.coupleId, user.coupleId),
          eq(uploads.partnerKey, partner),
          eq(uploads.kind, kind),
        ),
      );
    return Response.json({ ok: true, uploads: await getUploadMeta(user.coupleId) });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 400 });
  }
}
