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
export const TASK_REWARD = 10;
export const TRAINING_REWARD = 5;

export type CaptainState = {
  balance: number;
  weeklyEarned: number;
  weekKey: string;
  dayKey: string;
  tasksDone: string[];
  mapStamps: number;
  trainingFlips: number;
};

const STORAGE_KEY = "diario-del-capitan-v1";

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

function initialState(): CaptainState {
  return {
    balance: 0,
    weeklyEarned: 0,
    weekKey: weekKey(),
    dayKey: todayKey(),
    tasksDone: [],
    mapStamps: 0,
    trainingFlips: 0,
  };
}

function refresh(state: CaptainState): CaptainState {
  let next = state;
  if (next.weekKey !== weekKey()) {
    next = { ...next, weekKey: weekKey(), weeklyEarned: 0 };
  }
  if (next.dayKey !== todayKey()) {
    next = { ...next, dayKey: todayKey(), tasksDone: [], trainingFlips: 0 };
  }
  return next;
}

type Ctx = {
  state: CaptainState;
  ready: boolean;
  weeklyRemaining: number;
  earn: (amount: number) => number;
  spend: (amount: number) => boolean;
  toggleTask: (id: string) => "earned" | "undone" | "limit";
  stampWeek: () => void;
  resetMap: () => void;
  registerFlip: () => number;
};

const CaptainContext = createContext<Ctx | null>(null);

export function CaptainProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CaptainState>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(refresh({ ...initialState(), ...JSON.parse(raw) }));
    } catch {
      /* empty */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* empty */
    }
  }, [state, ready]);

  const earn = useCallback((amount: number) => {
    let granted = 0;
    setState((prev) => {
      const s = refresh(prev);
      granted = Math.max(0, Math.min(amount, WEEKLY_LIMIT - s.weeklyEarned));
      if (granted === 0) return s;
      return { ...s, balance: s.balance + granted, weeklyEarned: s.weeklyEarned + granted };
    });
    return granted;
  }, []);

  const spend = useCallback(
    (amount: number) => {
      if (amount <= 0 || amount > state.balance) return false;
      setState((prev) => ({ ...refresh(prev), balance: prev.balance - amount }));
      return true;
    },
    [state.balance],
  );

  const toggleTask = useCallback((id: string) => {
    let result: "earned" | "undone" | "limit" = "earned";
    setState((prev) => {
      const s = refresh(prev);
      if (s.tasksDone.includes(id)) {
        result = "undone";
        return {
          ...s,
          tasksDone: s.tasksDone.filter((t) => t !== id),
          balance: Math.max(0, s.balance - TASK_REWARD),
          weeklyEarned: Math.max(0, s.weeklyEarned - TASK_REWARD),
        };
      }
      const granted = Math.min(TASK_REWARD, WEEKLY_LIMIT - s.weeklyEarned);
      if (granted <= 0) {
        result = "limit";
        return { ...s, tasksDone: [...s.tasksDone, id] };
      }
      result = "earned";
      return {
        ...s,
        tasksDone: [...s.tasksDone, id],
        balance: s.balance + granted,
        weeklyEarned: s.weeklyEarned + granted,
      };
    });
    return result;
  }, []);

  const stampWeek = useCallback(() => {
    setState((prev) => ({ ...refresh(prev), mapStamps: Math.min(4, prev.mapStamps + 1) }));
  }, []);

  const resetMap = useCallback(() => {
    setState((prev) => ({ ...refresh(prev), mapStamps: 0 }));
  }, []);

  const registerFlip = useCallback(() => {
    let flips = 0;
    setState((prev) => {
      const s = refresh(prev);
      flips = s.trainingFlips + 1;
      return { ...s, trainingFlips: flips };
    });
    return flips;
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      state,
      ready,
      weeklyRemaining: Math.max(0, WEEKLY_LIMIT - state.weeklyEarned),
      earn,
      spend,
      toggleTask,
      stampWeek,
      resetMap,
      registerFlip,
    }),
    [state, ready, earn, spend, toggleTask, stampWeek, resetMap, registerFlip],
  );

  return <CaptainContext.Provider value={value}>{children}</CaptainContext.Provider>;
}

export function useCaptain() {
  const ctx = useContext(CaptainContext);
  if (!ctx) throw new Error("useCaptain debe usarse dentro de CaptainProvider");
  return ctx;
}
