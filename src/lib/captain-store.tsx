import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import * as api from "./captain.functions";
import {
  DAILY_REDEEM_LIMIT,
  WEEKLY_LIMIT,
  emptyData,
  newProgress,
  refreshProgress,
  type Kid,
  type KidProgress,
  type PublicData,
  type Session,
  type Task,
} from "./captain-shared";

export {
  WEEKLY_LIMIT,
  DAILY_REDEEM_LIMIT,
  BLOCK_LABELS,
  chestAvailable,
  DEFAULT_TASKS,
  type DayBlock,
  type Kid,
  type KidProgress,
  type Session,
  type Task,
} from "./captain-shared";

type Ctx = {
  ready: boolean;
  loadError: string | null;
  retryLoad: () => void;
  data: PublicData;
  session: Session;
  admin: { user: string } | null;
  kids: Kid[];
  tasks: Task[];
  activeKid: Kid | null;
  progress: KidProgress;
  weeklyRemaining: number;
  dailyRedeemRemaining: number;
  // auth
  createAdmin: (
    user: string,
    password: string,
  ) => Promise<{
    ok: boolean;
    created?: boolean;
    existing?: boolean;
    reason?: string | undefined;
  }>;
  loginAdmin: (user: string, password: string) => Promise<boolean>;
  enterKid: (kidId: string) => Promise<void>;
  logout: () => Promise<void>;
  // admin crud
  addKid: (kid: Omit<Kid, "id">) => Promise<void>;
  updateKid: (id: string, patch: Partial<Omit<Kid, "id">>) => Promise<void>;
  removeKid: (id: string) => Promise<void>;
  resetKidProgress: (kidId: string, confirmation: string) => Promise<void>;
  addTask: (task: Omit<Task, "id">) => Promise<void>;
  updateTask: (id: string, patch: Partial<Omit<Task, "id">>) => Promise<void>;
  moveTask: (id: string, direction: "up" | "down") => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  // kid actions
  toggleTask: (taskId: string) => Promise<"earned" | "undone" | "limit">;
  redeem: (amount: number) => Promise<{ ok: boolean; reason?: string | undefined }>;
  // admin: mapa del tesoro
  setWeekApproval: (
    kidId: string,
    weekKey: string,
    extraTasks: string | null,
  ) => Promise<void>;
  // admin: estadísticas
  setDayTask: (
    kidId: string,
    day: string,
    taskId: string,
    done: boolean,
  ) => Promise<void>;
};

// El contexto se guarda en globalThis para que, si Vite recarga en caliente
// el módulo (HMR) y crea una copia duplicada, proveedor y consumidores sigan
// compartiendo el mismo contexto.
const globalStore = globalThis as unknown as {
  __captainContext?: React.Context<Ctx | null>;
};
const CaptainContext: React.Context<Ctx | null> =
  globalStore.__captainContext ?? createContext<Ctx | null>(null);
globalStore.__captainContext = CaptainContext;

export function CaptainProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PublicData>(emptyData);
  const [session, setSession] = useState<Session>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const applySnapshot = useCallback(
    (snap: { data: PublicData | null; session: Session }) => {
      if (snap.data) setData(snap.data);
      setSession(snap.session);
    },
    [],
  );

  useEffect(() => {
    let alive = true;
    setReady(false);
    setLoadError(null);
    api
      .fetchSnapshot()
      .then((snap) => {
        if (!alive) return;
        applySnapshot(snap);
      })
      .catch((error: unknown) => {
        if (!alive) return;
        console.error(error);
        setLoadError(
          "No se puede abrir el almacenamiento. Comprueba que el volumen de Easypanel está montado en /data.",
        );
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, [applySnapshot, loadAttempt]);

  const retryLoad = useCallback(() => setLoadAttempt((attempt) => attempt + 1), []);

  const activeKidId = session?.kind === "kid" ? session.kidId : null;
  const activeKid = useMemo(
    () => data.kids.find((k) => k.id === activeKidId) ?? null,
    [data.kids, activeKidId],
  );

  const progress = useMemo(() => {
    if (!activeKidId) return newProgress();
    return refreshProgress(data.progress[activeKidId] ?? newProgress());
  }, [data.progress, activeKidId]);

  const createAdmin = useCallback(
    async (user: string, password: string) => {
      try {
        const res = await api.createAdmin({ data: { user, password } });
        applySnapshot(res);
        return {
          ok: res.ok,
          created: "created" in res ? res.created : false,
          existing: "existing" in res ? res.existing : false,
          reason: res.reason,
        };
      } catch (error) {
        console.error(error);
        return {
          ok: false,
          reason: "No se ha podido guardar. Comprueba el volumen permanente de Easypanel e inténtalo de nuevo.",
        };
      }
    },
    [applySnapshot],
  );

  const loginAdmin = useCallback(
    async (user: string, password: string) => {
      try {
        const res = await api.loginAdmin({ data: { user, password } });
        if (res.ok) applySnapshot(res);
        return res.ok;
      } catch (error) {
        console.error(error);
        return false;
      }
    },
    [applySnapshot],
  );

  const enterKid = useCallback(
    async (kidId: string) => {
      const res = await api.enterKid({ data: { kidId } });
      if (res.ok) applySnapshot(res);
    },
    [applySnapshot],
  );

  const logout = useCallback(async () => {
    applySnapshot(await api.logout());
  }, [applySnapshot]);

  const addKid = useCallback(
    async (kid: Omit<Kid, "id">) => {
      applySnapshot({ ...(await api.addKid({ data: kid })), session });
    },
    [applySnapshot, session],
  );

  const updateKid = useCallback(
    async (id: string, patch: Partial<Omit<Kid, "id">>) => {
      applySnapshot({ ...(await api.updateKid({ data: { id, patch } })), session });
    },
    [applySnapshot, session],
  );

  const removeKid = useCallback(
    async (id: string) => {
      applySnapshot({ ...(await api.removeKid({ data: { id } })), session });
    },
    [applySnapshot, session],
  );

  const resetKidProgress = useCallback(
    async (kidId: string, confirmation: string) => {
      applySnapshot({
        ...(await api.resetKidProgress({ data: { kidId, confirmation } })),
        session,
      });
    },
    [applySnapshot, session],
  );

  const addTask = useCallback(
    async (task: Omit<Task, "id">) => {
      applySnapshot({ ...(await api.addTask({ data: task })), session });
    },
    [applySnapshot, session],
  );

  const updateTask = useCallback(
    async (id: string, patch: Partial<Omit<Task, "id">>) => {
      applySnapshot({ ...(await api.updateTask({ data: { id, patch } })), session });
    },
    [applySnapshot, session],
  );

  const moveTask = useCallback(
    async (id: string, direction: "up" | "down") => {
      applySnapshot(await api.moveTask({ data: { id, direction } }));
    },
    [applySnapshot],
  );

  const removeTask = useCallback(
    async (id: string) => {
      applySnapshot({ ...(await api.removeTask({ data: { id } })), session });
    },
    [applySnapshot, session],
  );

  const toggleTask = useCallback(
    async (taskId: string) => {
      const res = await api.toggleTask({ data: { taskId } });
      applySnapshot(res);
      return res.result;
    },
    [applySnapshot],
  );

  const redeem = useCallback(
    async (amount: number) => {
      const res = await api.redeem({ data: { amount } });
      applySnapshot(res);
      return { ok: res.ok, reason: res.reason };
    },
    [applySnapshot],
  );

  const setWeekApproval = useCallback(
    async (kidId: string, weekKey: string, extraTasks: string | null) => {
      applySnapshot(await api.setWeekApproval({ data: { kidId, weekKey, extraTasks } }));
    },
    [applySnapshot],
  );

  const setDayTask = useCallback(
    async (kidId: string, day: string, taskId: string, done: boolean) => {
      applySnapshot(await api.setDayTask({ data: { kidId, day, taskId, done } }));
    },
    [applySnapshot],
  );

  const value = useMemo<Ctx>(
    () => ({
      ready,
      loadError,
      retryLoad,
      data,
      session,
      admin: data.admin,
      kids: data.kids,
      tasks: data.tasks,
      activeKid,
      progress,
      weeklyRemaining: Math.max(0, WEEKLY_LIMIT - progress.weeklyEarned),
      dailyRedeemRemaining: Math.max(0, DAILY_REDEEM_LIMIT - progress.redeemedToday),
      createAdmin,
      loginAdmin,
      enterKid,
      logout,
      addKid,
      updateKid,
      removeKid,
      resetKidProgress,
      addTask,
      updateTask,
      moveTask,
      removeTask,
      toggleTask,
      redeem,
      setDayTask,
      setWeekApproval,
    }),
    [
      ready,
      loadError,
      retryLoad,
      data,
      session,
      activeKid,
      progress,
      createAdmin,
      loginAdmin,
      enterKid,
      logout,
      addKid,
      updateKid,
      removeKid,
      resetKidProgress,
      addTask,
      updateTask,
      moveTask,
      removeTask,
      toggleTask,
      redeem,
      setDayTask,
      setWeekApproval,
    ],
  );

  return <CaptainContext.Provider value={value}>{children}</CaptainContext.Provider>;
}

export function useCaptain() {
  const ctx = useContext(CaptainContext);
  if (!ctx) throw new Error("useCaptain debe usarse dentro de CaptainProvider");
  return ctx;
}
