import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Страницы входа: если уже вошёл — отправляем в приложение. */
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  if (user) redirect("/couple");
  return <>{children}</>;
}
