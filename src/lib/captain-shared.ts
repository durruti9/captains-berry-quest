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
  booty: number; // botín acumulado (no se resetea)
  weeklyEarned: number; // Doblones ganados esta semana (lunes a domingo)
  redeemedWeek: number; // Doblones canjeados esta semana
  weekKey: string;
  dayKey: string;
  tasksDone: string[];
  redeemedToday: number;
  mapStamps: number;
};

/** Doblones disponibles esta semana en el cofre. */
export function chestAvailable(p: KidProgress) {
  return Math.max(0, p.weeklyEarned - p.redeemedWeek);
}

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
    booty: 0,
    weeklyEarned: 0,
    redeemedWeek: 0,
    weekKey: weekKey(),
    dayKey: todayKey(),
    tasksDone: [],
    redeemedToday: 0,
    mapStamps: 0,
  };
}

/** Applies the weekly (Mon–Sun) / daily resets and migrates old saves. */
export function refreshProgress(p: KidProgress & { balance?: number }): KidProgress {
  // Migración de partidas antiguas: el saldo acumulado pasa al botín.
  let next: KidProgress = {
    ...p,
    booty: p.booty ?? p.balance ?? 0,
    redeemedWeek: p.redeemedWeek ?? 0,
  };
  delete (next as { balance?: number }).balance;
  if (next.weekKey !== weekKey()) {
    // Al empezar la semana, el sobrante no canjeado pasa al botín.
    next = {
      ...next,
      weekKey: weekKey(),
      booty: next.booty + chestAvailable(next),
      weeklyEarned: 0,
      redeemedWeek: 0,
    };
  }
  if (next.dayKey !== todayKey())
    next = { ...next, dayKey: todayKey(), tasksDone: [], redeemedToday: 0 };
  return next;
}

export function emptyData(): PublicData {
  return { admin: null, kids: [], tasks: DEFAULT_TASKS, progress: {} };
}
