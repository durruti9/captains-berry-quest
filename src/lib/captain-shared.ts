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
  /** Semanas del mapa aprobadas por el Rey Pirata: clave de semana -> tareas extra indicadas. */
  mapApprovals: Record<string, string>;
  /** Historial: día (YYYY-MM-DD) -> ids de tareas completadas. */
  history: Record<string, string[]>;
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
  storage: "postgres" | "memory";
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

/** Clave de semana (lunes-domingo) para un día "YYYY-MM-DD". */
export function weekKeyOfDay(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return weekKey(new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1)));
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
    mapApprovals: {},
    history: {},
  };
}

/** Applies the weekly (Mon–Sun) / daily resets and migrates old saves. */
export function refreshProgress(p: KidProgress & { balance?: number; mapStamps?: number }): KidProgress {
  // Migración de partidas antiguas: el saldo acumulado pasa al botín.
  let next: KidProgress = {
    ...p,
    booty: p.booty ?? p.balance ?? 0,
    redeemedWeek: p.redeemedWeek ?? 0,
    mapApprovals: p.mapApprovals ?? {},
    history: p.history ?? {},
  };
  delete (next as { balance?: number }).balance;
  delete (next as { mapStamps?: number }).mapStamps;
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
  if (next.dayKey !== todayKey()) {
    // Guarda el día que termina en el historial antes de reiniciar.
    const history = { ...next.history };
    if (next.tasksDone.length > 0) history[next.dayKey] = next.tasksDone;
    next = {
      ...next,
      history,
      dayKey: todayKey(),
      tasksDone: history[todayKey()] ?? [],
      redeemedToday: 0,
    };
  }
  return next;
}

/** Tareas completadas en un día concreto. */
export function doneOnDay(p: KidProgress, day: string): string[] {
  if (day === p.dayKey) return p.tasksDone;
  return p.history?.[day] ?? [];
}

/** Objetivo semanal del mapa: porcentaje de tareas hechas para cumplir. */
export const WEEKLY_GOAL_PCT = 85;

export type MapWeek = { index: number; key: string; days: string[] };

export type MapDayStats = {
  day: string;
  done: number;
  expected: number;
  pct: number;
  elapsed: boolean;
  weekend: boolean;
  fulfilled: boolean;
};

/** Las 4 semanas del mes del mapa: días 1-7, 8-14, 15-21 y 22-28. */
export function monthMapWeeks(year: number, month: number): MapWeek[] {
  const mm = String(month + 1).padStart(2, "0");
  return [0, 1, 2, 3].map((i) => ({
    index: i,
    key: `${year}-${mm}-S${i + 1}`,
    days: Array.from(
      { length: 7 },
      (_, d) => `${year}-${mm}-${String(i * 7 + d + 1).padStart(2, "0")}`,
    ),
  }));
}

/** Progreso diario del mapa. Los fines de semana siempre cumplen y no afectan a la media. */
export function mapDayStats(
  p: KidProgress,
  taskIds: ReadonlySet<string>,
  day: string,
  today: string,
): MapDayStats {
  const date = new Date(`${day}T12:00:00Z`);
  const weekday = date.getUTCDay();
  const weekend = weekday === 0 || weekday === 6;
  const elapsed = day <= today;
  const done = new Set(doneOnDay(p, day).filter((id) => taskIds.has(id))).size;
  const expected = taskIds.size;
  const pct = expected > 0 ? Math.min(100, Math.round((done / expected) * 100)) : 0;
  return {
    day,
    done,
    expected,
    pct,
    elapsed,
    weekend,
    fulfilled: weekend || (elapsed && pct >= WEEKLY_GOAL_PCT),
  };
}

/** Progreso semanal usando únicamente los días laborables transcurridos. */
export function mapWeekStats(
  p: KidProgress,
  tasks: readonly Task[],
  week: MapWeek,
  today: string,
) {
  const taskIds = new Set(tasks.map((task) => task.id));
  const days = week.days.map((day) => mapDayStats(p, taskIds, day, today));
  const countedDays = days.filter((day) => day.elapsed && !day.weekend);
  const elapsedDays = countedDays.length;
  const expected = elapsedDays * taskIds.size;
  const done = countedDays.reduce((total, day) => total + day.done, 0);
  const pct = expected > 0 ? Math.round((done / expected) * 100) : 0;
  return { done, expected, pct, elapsedDays, days };
}

/** Una semana del mapa se cumple alcanzando el objetivo o si el Rey Pirata la aprueba. */
export function weekFulfilled(p: KidProgress, stats: { pct: number }, weekKey: string) {
  return stats.pct >= WEEKLY_GOAL_PCT || weekKey in (p.mapApprovals ?? {});
}

export function emptyData(): PublicData {
  return { admin: null, kids: [], tasks: DEFAULT_TASKS, progress: {}, storage: "memory" };
}
