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

/** Data shape sent to the browser (never contains credentials). */
export type PublicData = {
  admin: { user: string } | null;
  kids: Kid[];
  tasks: Task[];
  progress: Record<string, KidProgress>;
};

export const BLOCK_LABELS: Record<DayBlock, string> = {
  manana: "Mañana",
  tarde: "Tarde",
  noche: "Noche",
};

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

export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function weekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function newProgress(): KidProgress {
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

/** Applies the weekly / daily resets. */
export function refreshProgress(p: KidProgress): KidProgress {
  let next = p;
  if (next.weekKey !== weekKey()) next = { ...next, weekKey: weekKey(), weeklyEarned: 0 };
  if (next.dayKey !== todayKey())
    next = { ...next, dayKey: todayKey(), tasksDone: [], redeemedToday: 0 };
  return next;
}

export function emptyData(): PublicData {
  return { admin: null, kids: [], tasks: DEFAULT_TASKS, progress: {} };
}
