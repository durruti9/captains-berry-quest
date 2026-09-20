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
  createAdmin: (user: string, password: string) => Promise<{ ok: boolean; reason?: string | undefined }>;
  loginAdmin: (user: string, password: string) => Promise<boolean>;
  enterKid: (kidId: string) => Promise<void>;
  logout: () => Promise<void>;
  // admin crud
  addKid: (kid: Omit<Kid, "id">) => Promise<void>;
  updateKid: (id: string, patch: Partial<Omit<Kid, "id">>) => Promise<void>;
  removeKid: (id: string) => Promise<void>;
  addTask: (task: Omit<Task, "id">) => Promise<void>;
  updateTask: (id: string, patch: Partial<Omit<Task, "id">>) => Promise<void>;
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

const CaptainContext = createContext<Ctx | null>(null);

export function CaptainProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PublicData>(emptyData);
  const [session, setSession] = useState<Session>(null);
  const [ready, setReady] = useState(false);

  const applySnapshot = useCallback(
    (snap: { data: PublicData | null; session: Session }) => {
      if (snap.data) setData(snap.data);
      setSession(snap.session);
    },
    [],
  );

  useEffect(() => {
    let alive = true;
    api
      .fetchSnapshot()
      .then((snap) => {
        if (!alive) return;
        applySnapshot(snap);
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, [applySnapshot]);

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
      const res = await api.createAdmin({ data: { user, password } });
      applySnapshot(res);
      return { ok: res.ok, reason: res.reason };
    },
    [applySnapshot],
  );

  const loginAdmin = useCallback(
    async (user: string, password: string) => {
      const res = await api.loginAdmin({ data: { user, password } });
      if (res.ok) applySnapshot(res);
      return res.ok;
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
      addTask,
      updateTask,
      removeTask,
      toggleTask,
      redeem,
      setDayTask,
      setWeekApproval,
    }),
    [
      ready,
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
      addTask,
      updateTask,
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
