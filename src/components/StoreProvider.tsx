"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { analyzeWeek, type WeekAnalysis } from "@/lib/analysis";
import { EMPTY_BOOTSTRAP } from "@/lib/defaults";
import type { BlockInfo, BootstrapData, DayClassInfo, PartnerInfo, PlanInfo, SettingsInfo } from "@/lib/types";

interface Toast {
  id: number;
  text: string;
  tone: "ok" | "warn" | "err";
}

export interface SessionUser {
  userId: number;
  coupleId: number;
  login: string;
  displayName: string;
  role: "me" | "her";
  coupleName: string;
  joinCode: string;
}

interface SchedulePayload {
  partner?: "me" | "her" | "all";
  dayClasses: DayClassInfo[];
  timeBlocks: BlockInfo[];
}

interface Store {
  data: BootstrapData;
  analysis: WeekAnalysis;
  loading: boolean;
  error: string | null;
  imageVersion: number;
  plans: PlanInfo[];
  refresh: () => Promise<void>;
  saveSchedule: (p: SchedulePayload) => Promise<boolean>;
  saveSettings: (patch: Partial<SettingsInfo>) => Promise<boolean>;
  savePartner: (key: "me" | "her", patch: { name?: string; title?: string }) => Promise<boolean>;
  uploadImage: (partner: "me" | "her", kind: "classes" | "calls", file: File, ocrText?: string) => Promise<boolean>;
  deleteUpload: (partner: "me" | "her", kind: "classes" | "calls") => Promise<boolean>;
  addPlan: (p: Omit<PlanInfo, "id">) => Promise<boolean>;
  updatePlanStatus: (id: number, status: "planned" | "done") => Promise<boolean>;
  deletePlan: (id: number) => Promise<boolean>;
  toast: (text: string, tone?: Toast["tone"]) => void;
  user: SessionUser | null;
  logout: () => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore должен вызываться внутри StoreProvider");
  return ctx;
}

async function json<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => ({}))) as T & { ok?: boolean; error?: string };
  if (!res.ok || body.ok === false) throw new Error(body.error || `Ошибка ${res.status}`);
  return body;
}

export default function StoreProvider({
  children,
  initialData,
  initialPlans,
  user: initialUser,
}: {
  children: ReactNode;
  initialData?: BootstrapData;
  initialPlans?: PlanInfo[];
  user?: SessionUser | null;
}) {
  const router = useRouter();
  const [data, setData] = useState<BootstrapData>(initialData ?? EMPTY_BOOTSTRAP);
  const [plans, setPlans] = useState<PlanInfo[]>(initialPlans ?? []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [imageVersion, setImageVersion] = useState(1);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const toast = useCallback((text: string, tone: Toast["tone"] = "ok") => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/bootstrap", { cache: "no-store" });
      const body = await json<{ data: BootstrapData }>(res);
      setData(body.data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    void (async () => {
      try {
        const res = await fetch("/api/plans", { cache: "no-store" });
        const body = await json<{ plans: PlanInfo[] }>(res);
        setPlans(body.plans);
      } catch {
        /* планы не критичны */
      }
    })();
  }, [refresh]);

  const analysis = useMemo<WeekAnalysis>(
    () =>
      analyzeWeek({
        settings: data.settings,
        partners: data.partners,
        dayClasses: data.dayClasses,
        timeBlocks: data.timeBlocks,
        uploadsKnown: (key) =>
          data.uploads.some((u) => u.partnerKey === key) ||
          data.dayClasses.some((c) => c.partnerKey === key) ||
          data.timeBlocks.some((b) => b.partnerKey === key),
      }),
    [data],
  );

  const saveSchedule = useCallback(
    async (p: SchedulePayload) => {
      try {
        const res = await fetch("/api/schedule", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(p),
        });
        const body = await json<{ data: BootstrapData }>(res);
        setData(body.data);
        toast("Расписание сохранено 🌸");
        return true;
      } catch (e) {
        toast(e instanceof Error ? e.message : "Не удалось сохранить", "err");
        return false;
      }
    },
    [toast],
  );

  const saveSettings = useCallback(
    async (patch: Partial<SettingsInfo>) => {
      try {
        const res = await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const body = await json<{ settings: SettingsInfo }>(res);
        setData((d) => ({ ...d, settings: body.settings }));
        toast("Настройки обновлены");
        return true;
      } catch (e) {
        toast(e instanceof Error ? e.message : "Не удалось сохранить", "err");
        return false;
      }
    },
    [toast],
  );

  const savePartner = useCallback(
    async (key: "me" | "her", patch: { name?: string; title?: string }) => {
      try {
        const res = await fetch("/api/partners", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, ...patch }),
        });
        const body = await json<{ partners: PartnerInfo[] }>(res);
        setData((d) => ({ ...d, partners: body.partners }));
        toast("Имя сохранено");
        return true;
      } catch (e) {
        toast(e instanceof Error ? e.message : "Не удалось сохранить", "err");
        return false;
      }
    },
    [toast],
  );

  const uploadImage = useCallback(
    async (partner: "me" | "her", kind: "classes" | "calls", file: File, ocrText?: string) => {
      try {
        const fd = new FormData();
        fd.set("partner", partner);
        fd.set("kind", kind);
        fd.set("file", file);
        if (ocrText) fd.set("ocrText", ocrText);
        const res = await fetch("/api/uploads", { method: "POST", body: fd });
        const body = await json<{ uploads: BootstrapData["uploads"] }>(res);
        setData((d) => ({ ...d, uploads: body.uploads, hasAnyData: true }));
        setImageVersion((v) => v + 1);
        toast("Скриншот сохранён — он не сбросится до следующей замены");
        return true;
      } catch (e) {
        toast(e instanceof Error ? e.message : "Не удалось загрузить", "err");
        return false;
      }
    },
    [toast],
  );

  const deleteUpload = useCallback(
    async (partner: "me" | "her", kind: "classes" | "calls") => {
      try {
        const res = await fetch(`/api/uploads?partner=${partner}&kind=${kind}`, { method: "DELETE" });
        const body = await json<{ uploads: BootstrapData["uploads"] }>(res);
        setData((d) => ({ ...d, uploads: body.uploads }));
        setImageVersion((v) => v + 1);
        toast("Скриншот удалён", "warn");
        return true;
      } catch (e) {
        toast(e instanceof Error ? e.message : "Не удалось удалить", "err");
        return false;
      }
    },
    [toast],
  );

  const addPlan = useCallback(
    async (p: Omit<PlanInfo, "id">) => {
      try {
        const res = await fetch("/api/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(p),
        });
        const body = await json<{ plans: PlanInfo[] }>(res);
        setPlans(body.plans);
        toast("Свидание добавлено в план 🏮");
        return true;
      } catch (e) {
        toast(e instanceof Error ? e.message : "Не удалось добавить", "err");
        return false;
      }
    },
    [toast],
  );

  const updatePlanStatus = useCallback(
    async (id: number, status: "planned" | "done") => {
      try {
        const res = await fetch("/api/plans", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status }),
        });
        const body = await json<{ plans: PlanInfo[] }>(res);
        setPlans(body.plans);
        return true;
      } catch (e) {
        toast(e instanceof Error ? e.message : "Ошибка", "err");
        return false;
      }
    },
    [toast],
  );

  const deletePlan = useCallback(
    async (id: number) => {
      try {
        const res = await fetch(`/api/plans?id=${id}`, { method: "DELETE" });
        const body = await json<{ plans: PlanInfo[] }>(res);
        setPlans(body.plans);
        toast("План удалён", "warn");
        return true;
      } catch (e) {
        toast(e instanceof Error ? e.message : "Ошибка", "err");
        return false;
      }
    },
    [toast],
  );

  const value: Store = {
    data,
    analysis,
    loading,
    error,
    imageVersion,
    plans,
    refresh,
    saveSchedule,
    saveSettings,
    savePartner,
    uploadImage,
    deleteUpload,
    addPlan,
    updatePlanStatus,
    deletePlan,
    toast,
    user: initialUser ?? null,
    logout: async () => {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch {
        /* даже если сеть упала — уходим на страницу входа */
      }
      router.push("/login");
      router.refresh();
    },
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-fade-up pointer-events-auto max-w-md rounded-full border px-4 py-2 text-sm font-semibold shadow-lg backdrop-blur ${
              t.tone === "err"
                ? "border-vermilion/40 bg-white/95 text-vermilion"
                : t.tone === "warn"
                  ? "border-gold/40 bg-white/95 text-sakura-900"
                  : "border-sakura-300 bg-white/95 text-sakura-800"
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
