import { analyzeWeek } from "@/lib/analysis";
import { requireUser } from "@/lib/auth";
import { getBootstrap } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    if (!user) return Response.json({ ok: false, error: "Нужно войти" }, { status: 401 });

    const data = await getBootstrap(user.coupleId);
    const analysis = analyzeWeek({
      settings: data.settings,
      partners: data.partners,
      dayClasses: data.dayClasses,
      timeBlocks: data.timeBlocks,
      uploadsKnown: (key) =>
        data.uploads.some((u) => u.partnerKey === key) ||
        data.dayClasses.some((c) => c.partnerKey === key) ||
        data.timeBlocks.some((b) => b.partnerKey === key),
    });
    return Response.json({ ok: true, data, analysis, user });
  } catch (err) {
    console.error("bootstrap failed", err);
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
