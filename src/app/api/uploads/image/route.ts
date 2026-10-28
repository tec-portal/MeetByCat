import { requireUser } from "@/lib/auth";
import { findUpload } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Отдаёт сохранённый скриншот пары из БД: /api/uploads/image?partner=me&kind=classes */
export async function GET(req: Request) {
  try {
    const user = await requireUser();
    if (!user) return new Response("нужно войти", { status: 401 });

    const url = new URL(req.url);
    const partner = url.searchParams.get("partner");
    const kind = url.searchParams.get("kind");
    if ((partner !== "me" && partner !== "her") || (kind !== "classes" && kind !== "calls")) {
      return new Response("bad slot", { status: 400 });
    }

    const row = await findUpload(user.coupleId, partner, kind);
    if (!row) return new Response("not found", { status: 404 });

    const bytes = Uint8Array.from(Buffer.from(row.data, "base64"));
    return new Response(bytes, {
      headers: {
        "Content-Type": row.mimeType || "image/png",
        "Cache-Control": "private, no-store, max-age=0",
        ETag: `"${new Date(row.createdAt).getTime()}"`,
      },
    });
  } catch (err) {
    console.error(err);
    return new Response(String(err), { status: 500 });
  }
}
