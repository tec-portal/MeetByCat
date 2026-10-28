import QRCode from "qrcode";
import { requireUser } from "@/lib/auth";
import { siteOrigin } from "@/lib/origin";
import { getCoupleMembers } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Данные пары: код подключения, состав и QR-код картинкой. */
export async function GET(req: Request) {
  try {
    const user = await requireUser();
    if (!user) return Response.json({ ok: false, error: "Нужно войти" }, { status: 401 });

    const origin = await siteOrigin();
    const link = `${origin}/join?code=${encodeURIComponent(user.joinCode)}`;
    const qrDataUrl = await QRCode.toDataURL(link, {
      margin: 1,
      width: 560,
      errorCorrectionLevel: "M",
      color: { dark: "#8a2c55", light: "#fffafc" },
    });
    const members = await getCoupleMembers(user.coupleId);

    return Response.json({
      ok: true,
      couple: { id: user.coupleId, name: user.coupleName, joinCode: user.joinCode },
      link,
      origin,
      qrDataUrl,
      members: members.map((m) => ({
        role: m.role,
        displayName: m.displayName,
        login: m.login,
        createdAt: new Date(m.createdAt).toISOString(),
      })),
      you: { role: user.role, displayName: user.displayName, login: user.login },
    });
  } catch (err) {
    console.error(err);
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
