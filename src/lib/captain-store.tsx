import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const WEEKLY_LIMIT = 240;
export const DAILY_REDEEM_LIMIT = 60;

export type DayBlock = "manana" | "tarde" | "noche";

export type Task = {
  id: string;
  label: string;
  value: number;
  icon: string;
  block: DayBlock;
};

export type Kid = {
  id: string;
  name: string;
  avatar: string; // emoji or data URL
};

export type Admin = {
  user: string;
  password: string;
};

export type KidProgress = {
  balance: number;
  weeklyEarned: number;
  weekKey: string;
  dayKey: string;
  tasksDone: string[];
  redeemedToday: number;
  mapStamps: number;
};

export type Session = { kind: "admin" } | { kind: "kid"; kidId: string } | null;

type Data = {
  admin: Admin | null;
  kids: Kid[];
  tasks: Task[];
  progress: Record<string, KidProgress>;
};

const STORAGE_KEY = "diario-del-capitan-v2";
const SESSION_KEY = "diario-del-capitan-session";

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function weekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function newProgress(): KidProgress {
  return {
    balance: 0,
    weeklyEarned: 0,
    weekKey: weekKey(),
    dayKey: todayKey(),
    tasksDone: [],
    redeemedToday: 0,
    mapStamps: 0,
  };
}

function refresh(p: KidProgress): KidProgress {
  let next = p;
  if (next.weekKey !== weekKey()) next = { ...next, weekKey: weekKey(), weeklyEarned: 0 };
  if (next.dayKey !== todayKey())
    next = { ...next, dayKey: todayKey(), tasksDone: [], redeemedToday: 0 };
  return next;
}

export const DEFAULT_TASKS: Task[] = [
  { id: "t-cama", label: "Hacer la cama", value: 10, icon: "Bed", block: "manana" },
  { id: "t-dientes-m", label: "Lavarse los dientes", value: 10, icon: "Brush", block: "manana" },
  { id: "t-vestir", label: "Vestirse solo", value: 10, icon: "Shirt", block: "manana" },
  { id: "t-mochila", label: "Mochila lista", value: 10, icon: "Backpack", block: "manana" },
  { id: "t-deberes", label: "Hacer los deberes", value: 15, icon: "BookOpen", block: "tarde" },
  { id: "t-merienda", label: "Recoger la merienda", value: 10, icon: "Apple", block: "tarde" },
  { id: "t-juguetes", label: "Ordenar los juguetes", value: 10, icon: "ToyBrick", block: "tarde" },
  { id: "t-ducha", label: "Ducha de marinero", value: 10, icon: "ShowerHead", block: "noche" },
  { id: "t-dientes-n", label: "Lavarse los dientes", value: 10, icon: "Smile", block: "noche" },
  {
    id: "t-ropa",
    label: "Ropa de mañana preparada",
    value: 10,
    icon: "WashingMachine",
    block: "noche",
  },
  { id: "t-lectura", label: "Leer un poquito", value: 15, icon: "BookOpen", block: "noche" },
];

export const BLOCK_LABELS: Record<DayBlock, string> = {
  manana: "Mañana",
  tarde: "Tarde",
  noche: "Noche",
};

function initialData(): Data {
  return { admin: null, kids: [], tasks: DEFAULT_TASKS, progress: {} };
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

type Ctx = {
  ready: boolean;
  data: Data;
  session: Session;
  admin: Admin | null;
  kids: Kid[];
  tasks: Task[];
  activeKid: Kid | null;
  progress: KidProgress;
  weeklyRemaining: number;
  dailyRedeemRemaining: number;
  // auth
  createAdmin: (user: string, password: string) => void;
  loginAdmin: (user: string, password: string) => boolean;
  enterKid: (kidId: string) => void;
  logout: () => void;
  // admin crud
  addKid: (kid: Omit<Kid, "id">) => void;
  updateKid: (id: string, patch: Partial<Omit<Kid, "id">>) => void;
  removeKid: (id: string) => void;
  addTask: (task: Omit<Task, "id">) => void;
  updateTask: (id: string, patch: Partial<Omit<Task, "id">>) => void;
  removeTask: (id: string) => void;
  // kid actions
  toggleTask: (taskId: string) => "earned" | "undone" | "limit";
  redeem: (amount: number) => { ok: boolean; reason?: string };
  stampWeek: () => void;
  resetMap: () => void;
};

const CaptainContext = createContext<Ctx | null>(null);

export function CaptainProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(initialData);
  const [session, setSession] = useState<Session>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setData({ ...initialData(), ...JSON.parse(raw) });
      const rawSession = localStorage.getItem(SESSION_KEY);
      if (rawSession) setSession(JSON.parse(rawSession));
    } catch {
      /* empty */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      /* empty */
    }
  }, [data, session, ready]);

  const activeKidId = session?.kind === "kid" ? session.kidId : null;
  const activeKid = useMemo(
    () => data.kids.find((k) => k.id === activeKidId) ?? null,
    [data.kids, activeKidId],
  );

  const progress = useMemo(() => {
    if (!activeKidId) return newProgress();
    return refresh(data.progress[activeKidId] ?? newProgress());
  }, [data.progress, activeKidId]);

  const patchProgress = useCallback(
    (kidId: string, fn: (p: KidProgress) => KidProgress) => {
      setData((prev) => {
        const current = refresh(prev.progress[kidId] ?? newProgress());
        return { ...prev, progress: { ...prev.progress, [kidId]: fn(current) } };
      });
    },
    [setData],
  );

  const createAdmin = useCallback((user: string, password: string) => {
    setData((prev) => ({ ...prev, admin: { user: user.trim(), password } }));
  }, []);

  const loginAdmin = useCallback(
    (user: string, password: string) => {
      if (!data.admin) return false;
      const ok =
        data.admin.password === password &&
        (user.trim() === "" || user.trim().toLowerCase() === data.admin.user.toLowerCase());
      if (ok) setSession({ kind: "admin" });
      return ok;
    },
    [data.admin],
  );

  const enterKid = useCallback((kidId: string) => setSession({ kind: "kid", kidId }), []);
  const logout = useCallback(() => setSession(null), []);

  const addKid = useCallback((kid: Omit<Kid, "id">) => {
    setData((prev) => ({ ...prev, kids: [...prev.kids, { ...kid, id: uid() }] }));
  }, []);

  const updateKid = useCallback((id: string, patch: Partial<Omit<Kid, "id">>) => {
    setData((prev) => ({
      ...prev,
      kids: prev.kids.map((k) => (k.id === id ? { ...k, ...patch } : k)),
    }));
  }, []);

  const removeKid = useCallback((id: string) => {
    setData((prev) => {
      const progressCopy = { ...prev.progress };
      delete progressCopy[id];
      return { ...prev, kids: prev.kids.filter((k) => k.id !== id), progress: progressCopy };
    });
  }, []);

  const addTask = useCallback((task: Omit<Task, "id">) => {
    setData((prev) => ({ ...prev, tasks: [...prev.tasks, { ...task, id: uid() }] }));
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<Omit<Task, "id">>) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }, []);

  const removeTask = useCallback((id: string) => {
    setData((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) }));
  }, []);

  const toggleTask = useCallback(
    (taskId: string) => {
      if (!activeKidId) return "limit" as const;
      const task = data.tasks.find((t) => t.id === taskId);
      if (!task) return "limit" as const;
      let result: "earned" | "undone" | "limit" = "earned";
      patchProgress(activeKidId, (p) => {
        if (p.tasksDone.includes(taskId)) {
          result = "undone";
          return {
            ...p,
            tasksDone: p.tasksDone.filter((t) => t !== taskId),
            balance: Math.max(0, p.balance - task.value),
            weeklyEarned: Math.max(0, p.weeklyEarned - task.value),
          };
        }
        const granted = Math.min(task.value, WEEKLY_LIMIT - p.weeklyEarned);
        if (granted <= 0) {
          result = "limit";
          return { ...p, tasksDone: [...p.tasksDone, taskId] };
        }
        result = "earned";
        return {
          ...p,
          tasksDone: [...p.tasksDone, taskId],
          balance: p.balance + granted,
          weeklyEarned: p.weeklyEarned + granted,
        };
      });
      return result;
    },
    [activeKidId, data.tasks, patchProgress],
  );

  const redeem = useCallback(
    (amount: number) => {
      if (!activeKidId) return { ok: false, reason: "Elige primero un perfil de grumete." };
      if (amount <= 0) return { ok: false, reason: "Escribe cuántos Doblones quieres gastar." };
      if (amount > progress.balance)
        return { ok: false, reason: "No tienes suficientes Doblones en el cofre. ¡A por más tareas!" };
      const remaining = Math.max(0, DAILY_REDEEM_LIMIT - progress.redeemedToday);
      if (amount > remaining) {
        return {
          ok: false,
          reason:
            remaining === 0
              ? "¡Ya has canjeado tu hora de juego de hoy! Vuelve mañana, grumete. ⏰"
              : `Máximo 1 hora al día: hoy solo te quedan ${remaining} minutos por canjear.`,
        };
      }
      patchProgress(activeKidId, (p) => ({
        ...p,
        balance: p.balance - amount,
        redeemedToday: p.redeemedToday + amount,
      }));
      return { ok: true };
    },
    [activeKidId, progress.balance, progress.redeemedToday, patchProgress],
  );

  const stampWeek = useCallback(() => {
    if (!activeKidId) return;
    patchProgress(activeKidId, (p) => ({ ...p, mapStamps: Math.min(4, p.mapStamps + 1) }));
  }, [activeKidId, patchProgress]);

  const resetMap = useCallback(() => {
    if (!activeKidId) return;
    patchProgress(activeKidId, (p) => ({ ...p, mapStamps: 0 }));
  }, [activeKidId, patchProgress]);

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
      stampWeek,
      resetMap,
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
      stampWeek,
      resetMap,
    ],
  );

  return <CaptainContext.Provider value={value}>{children}</CaptainContext.Provider>;
}

export function useCaptain() {
  const ctx = useContext(CaptainContext);
  if (!ctx) throw new Error("useCaptain debe usarse dentro de CaptainProvider");
  return ctx;
}
