import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { uploads } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getUploadMeta } from "@/lib/store";
import type { PartnerKey, UploadKind } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * 4 МБ: на Vercel/Railway лимит тела запроса ~4.5 МБ, а клиент ещё и сжимает
 * снимок перед отправкой, так что обычного скриншота с телефона хватает с запасом.
 */
const MAX_BYTES = 4 * 1024 * 1024;

function keys(partner: string | null, kind: string | null) {
  const p: PartnerKey | null = partner === "me" || partner === "her" ? partner : null;
  const k: UploadKind | null = kind === "classes" || kind === "calls" ? kind : null;
  return { p, k };
}

/** Загрузка/замена скриншота пары. Старый снимок того же слота перезаписывается. */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (!user) return Response.json({ ok: false, error: "Нужно войти" }, { status: 401 });

    const form = await req.formData();
    const { p, k } = keys(String(form.get("partner")), String(form.get("kind")));
    const file = form.get("file");
    if (!p || !k) return Response.json({ ok: false, error: "Неверный слот" }, { status: 400 });
    if (!(file instanceof File)) return Response.json({ ok: false, error: "Файл не передан" }, { status: 400 });
    if (file.size > MAX_BYTES)
      return Response.json(
        {
          ok: false,
          error: "Файл больше 4 МБ. Обычно сайт сжимает снимок сам — попробуй ещё раз или сделай скрин без лишних деталей.",
        },
        { status: 413 },
      );
    if (!file.type.startsWith("image/")) return Response.json({ ok: false, error: "Нужно изображение" }, { status: 415 });

    const buf = Buffer.from(await file.arrayBuffer());
    const data = buf.toString("base64");
    const ocrText = typeof form.get("ocrText") === "string" ? String(form.get("ocrText")) : null;
    const row = {
      coupleId: user.coupleId,
      partnerKey: p,
      kind: k,
      fileName: file.name || "screenshot.png",
      mimeType: file.type || "image/png",
      data,
      sizeBytes: file.size,
      ocrText,
    };

    await db
      .insert(uploads)
      .values(row)
      .onConflictDoUpdate({
        target: [uploads.coupleId, uploads.partnerKey, uploads.kind],
        set: {
          fileName: row.fileName,
          mimeType: row.mimeType,
          data,
          sizeBytes: file.size,
          ocrText: ocrText ?? null,
          createdAt: new Date(),
        },
      });

    return Response.json({ ok: true, uploads: await getUploadMeta(user.coupleId) });
  } catch (err) {
    console.error(err);
    return Response.json({ ok: false, error: String(err) }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser();
    if (!user) return Response.json({ ok: false, error: "Нужно войти" }, { status: 401 });

    const url = new URL(req.url);
    const { p, k } = keys(url.searchParams.get("partner"), url.searchParams.get("kind"));
    if (!p || !k) return Response.json({ ok: false, error: "Неверный слот" }, { status: 400 });
    await db
      .delete(uploads)
      .where(
        and(
          eq(uploads.coupleId, user.coupleId),
          eq(uploads.partnerKey, p),
          eq(uploads.kind, k),
        ),
      );
    return Response.json({ ok: true, uploads: await getUploadMeta(user.coupleId) });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 400 });
  }
}
