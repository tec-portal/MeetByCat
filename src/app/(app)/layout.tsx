import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Sakura from "@/components/Sakura";
import StoreProvider from "@/components/StoreProvider";
import { currentUser } from "@/lib/auth";
import { EMPTY_BOOTSTRAP } from "@/lib/defaults";
import { getBootstrap, getPlans } from "@/lib/store";
import type { BootstrapData, PlanInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Все страницы приложения: пускаем только после входа. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");

  let initialData: BootstrapData = EMPTY_BOOTSTRAP;
  let initialPlans: PlanInfo[] = [];
  try {
    [initialData, initialPlans] = await Promise.all([
      getBootstrap(user.coupleId),
      getPlans(user.coupleId),
    ]);
  } catch (err) {
    console.error("Не удалось подготовить данные пары:", err);
  }

  return (
    <StoreProvider initialData={initialData} initialPlans={initialPlans} user={user}>
      <Sakura count={18} />
      <Nav />
      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-20 pt-6">{children}</main>
      <footer className="relative z-10 border-t border-sakura-200/60 py-6 text-center text-xs text-ink-faint">
        <span className="jp">九尾の狐</span> · {user.coupleName} · скриншоты хранятся в вашей паре и
        обновляются вручную раз в неделю
      </footer>
    </StoreProvider>
  );
}
