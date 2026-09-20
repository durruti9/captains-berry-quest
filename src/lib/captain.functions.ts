import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";

import {
  DAILY_REDEEM_LIMIT,
  WEEKLY_LIMIT,
  chestAvailable,
  doneOnDay,
  newProgress,
  refreshProgress,
  weekKeyOfDay,
  type DayBlock,
  type Kid,
  type KidProgress,
  type PublicData,
  type Session,
  type Task,
} from "./captain-shared";

type SessionData = { kind?: "admin" | "kid"; kidId?: string };

function sessionConfig() {
  const configured = process.env["SESSION_SECRET"];
  if (process.env["REQUIRE_DATABASE"] === "1" && !configured) {
    throw new Error("SESSION_SECRET es obligatoria en este despliegue.");
  }
  const password = configured ?? "diario-del-capitan-dev-secret-change-me-please-0001";
  if (password.length < 32) {
    throw new Error("SESSION_SECRET debe tener al menos 32 caracteres.");
  }
  return { password, name: "capitan-session", maxAge: 60 * 60 * 24 * 60 };
}

async function readSession(): Promise<Session> {
  const session = await useSession<SessionData>(sessionConfig());
  const data = session.data;
  if (data?.kind === "admin") return { kind: "admin" };
  if (data?.kind === "kid" && data.kidId) return { kind: "kid", kidId: data.kidId };
  return null;
}

async function writeSession(value: Session) {
  const session = await useSession<SessionData>(sessionConfig());
  if (!value) await session.clear();
  else if (value.kind === "admin") await session.update({ kind: "admin" });
  else await session.update({ kind: "kid", kidId: value.kidId });
}

type Snapshot = { data: PublicData; session: Session };

function toPublic(state: import("./captain-db.server").StoredState): PublicData {
  const progress: Record<string, KidProgress> = {};
  for (const [kidId, p] of Object.entries(state.progress)) progress[kidId] = refreshProgress(p);
  return {
    admin: state.admin ? { user: state.admin.user } : null,
    kids: state.kids,
    tasks: state.tasks,
    progress,
    storage: process.env["DATABASE_URL"] ? "postgres" : "memory",
  };
}

async function snapshot(session?: Session): Promise<Snapshot> {
  const { readState } = await import("./captain-db.server");
  const state = await readState();
  return { data: toPublic(state), session: session !== undefined ? session : await readSession() };
}

/* ------------------------------ reads ------------------------------ */

export const fetchSnapshot = createServerFn({ method: "GET" }).handler(async () => snapshot());

/* ------------------------------ auth ------------------------------- */

export const createAdmin = createServerFn({ method: "POST" })
  .inputValidator((data: { user: string; password: string }) => data)
  .handler(async ({ data }) => {
    const { mutateState, hashPassword, newSalt } = await import("./captain-db.server");
    const user = data.user.trim();
    const fail = (reason: string) => ({
      ok: false as const,
      reason,
      data: null,
      session: null as Session,
    });
    if (user.length < 3) return fail("El usuario necesita al menos 3 letras.");
    if (data.password.length < 4) return fail("La contraseña necesita al menos 4 caracteres.");

    const salt = newSalt();
    const hash = await hashPassword(data.password, salt);
    let taken = false;
    const { state } = await mutateState((s) => {
      if (s.admin) {
        taken = true;
        return;
      }
      s.admin = { user, hash, salt };
    });
    if (taken) return fail("El Rey Pirata ya está dado de alta.");
    try {
      await writeSession({ kind: "admin" });
    } catch (error) {
      console.error("[session] El Rey Pirata se guardó, pero no se pudo abrir la sesión.", error);
      return {
        ok: false as const,
        created: true as const,
        reason:
          "El Rey Pirata se ha guardado, pero no se pudo abrir la sesión. Entra ahora con el usuario y la contraseña que acabas de crear.",
        data: toPublic(state),
        session: null as Session,
      };
    }
    return {
      ok: true as const,
      created: true as const,
      reason: undefined,
      data: toPublic(state),
      session: { kind: "admin" } as Session,
    };
  });

export const loginAdmin = createServerFn({ method: "POST" })
  .inputValidator((data: { user: string; password: string }) => data)
  .handler(async ({ data }) => {
    const { readState, hashPassword } = await import("./captain-db.server");
    const state = await readState();
    if (!state.admin) return { ok: false as const };
    const hash = await hashPassword(data.password, state.admin.salt);
    const userOk =
      data.user.trim() === "" ||
      data.user.trim().toLowerCase() === state.admin.user.toLowerCase();
    if (!userOk || hash !== state.admin.hash) return { ok: false as const };
    await writeSession({ kind: "admin" });
    return { ok: true as const, data: toPublic(state), session: { kind: "admin" } as Session };
  });

export const enterKid = createServerFn({ method: "POST" })
  .inputValidator((data: { kidId: string }) => data)
  .handler(async ({ data }) => {
    const { readState } = await import("./captain-db.server");
    const state = await readState();
    if (!state.kids.some((k) => k.id === data.kidId)) return { ok: false as const };
    const session: Session = { kind: "kid", kidId: data.kidId };
    await writeSession(session);
    return { ok: true as const, data: toPublic(state), session };
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  await writeSession(null);
  return snapshot(null);
});

async function requireAdmin() {
  const session = await readSession();
  if (session?.kind !== "admin") throw new Error("Solo el Rey Pirata puede hacer esto.");
}

async function requireKid() {
  const session = await readSession();
  if (session?.kind !== "kid") throw new Error("Entra con un perfil de grumete.");
  return session.kidId;
}

/* --------------------------- admin: kids --------------------------- */

export const addKid = createServerFn({ method: "POST" })
  .inputValidator((data: { name: string; avatar: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    const { mutateState, uid } = await import("./captain-db.server");
    const kid: Kid = { id: uid(), name: data.name.trim(), avatar: data.avatar };
    const { state } = await mutateState((s) => {
      s.kids = [...s.kids, kid];
    });
    return snapshotFrom(state, { kind: "admin" });
  });

export const updateKid = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; patch: Partial<Omit<Kid, "id">> }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    const { mutateState } = await import("./captain-db.server");
    const { state } = await mutateState((s) => {
      s.kids = s.kids.map((k) => (k.id === data.id ? { ...k, ...data.patch } : k));
    });
    return snapshotFrom(state, { kind: "admin" });
  });

export const removeKid = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    const { mutateState } = await import("./captain-db.server");
    const { state } = await mutateState((s) => {
      s.kids = s.kids.filter((k) => k.id !== data.id);
      delete s.progress[data.id];
    });
    return snapshotFrom(state, { kind: "admin" });
  });

/** Borra únicamente el progreso de un grumete y conserva su perfil y la configuración. */
export const resetKidProgress = createServerFn({ method: "POST" })
  .inputValidator((data: { kidId: string; confirmation: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    const { mutateState } = await import("./captain-db.server");
    const { state } = await mutateState((s) => {
      const kid = s.kids.find((candidate) => candidate.id === data.kidId);
      if (!kid) throw new Error("No se ha encontrado el grumete.");
      if (data.confirmation.trim() !== kid.name) {
        throw new Error("El nombre de confirmación no coincide.");
      }
      s.progress[data.kidId] = newProgress();
    });
    return snapshotFrom(state, { kind: "admin" });
  });

/* --------------------------- admin: tasks -------------------------- */

type TaskInput = { label: string; value: number; icon: string; block: DayBlock };

export const addTask = createServerFn({ method: "POST" })
  .inputValidator((data: TaskInput) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    const { mutateState, uid } = await import("./captain-db.server");
    const task: Task = { ...data, id: uid() };
    const { state } = await mutateState((s) => {
      s.tasks = [...s.tasks, task];
    });
    return snapshotFrom(state, { kind: "admin" });
  });

export const updateTask = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; patch: Partial<TaskInput> }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    const { mutateState } = await import("./captain-db.server");
    const { state } = await mutateState((s) => {
      const current = s.tasks.find((task) => task.id === data.id);
      if (!current) return;
      const updated = { ...current, ...data.patch };
      if (data.patch.block && data.patch.block !== current.block) {
        // Al cambiar de franja, queda al final de la nueva para poder ordenarla allí.
        s.tasks = [...s.tasks.filter((task) => task.id !== data.id), updated];
      } else {
        s.tasks = s.tasks.map((task) => (task.id === data.id ? updated : task));
      }
    });
    return snapshotFrom(state, { kind: "admin" });
  });

export const moveTask = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; direction: "up" | "down" }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    const { mutateState } = await import("./captain-db.server");
    const { state } = await mutateState((s) => {
      const currentIndex = s.tasks.findIndex((task) => task.id === data.id);
      if (currentIndex < 0) throw new Error("No se ha encontrado la tarea.");
      const current = s.tasks[currentIndex];
      if (!current) return;
      const step = data.direction === "up" ? -1 : 1;
      let swapIndex = currentIndex + step;
      while (swapIndex >= 0 && swapIndex < s.tasks.length) {
        if (s.tasks[swapIndex]?.block === current.block) break;
        swapIndex += step;
      }
      if (swapIndex < 0 || swapIndex >= s.tasks.length) return;
      const sibling = s.tasks[swapIndex];
      if (!sibling) return;
      s.tasks[currentIndex] = sibling;
      s.tasks[swapIndex] = current;
    });
    return snapshotFrom(state, { kind: "admin" });
  });

export const removeTask = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    const { mutateState } = await import("./captain-db.server");
    const { state } = await mutateState((s) => {
      s.tasks = s.tasks.filter((t) => t.id !== data.id);
    });
    return snapshotFrom(state, { kind: "admin" });
  });

/* ----------------------------- kid actions ------------------------- */

function progressOf(s: import("./captain-db.server").StoredState, kidId: string) {
  return refreshProgress(s.progress[kidId] ?? newProgress());
}

function snapshotFrom(state: import("./captain-db.server").StoredState, session?: Session) {
  return { data: toPublic(state), session: session ?? null };
}

export const toggleTask = createServerFn({ method: "POST" })
  .inputValidator((data: { taskId: string }) => data)
  .handler(async ({ data }) => {
    const kidId = await requireKid();
    const { mutateState } = await import("./captain-db.server");
    let result: "earned" | "undone" | "limit" = "earned";
    const { state } = await mutateState((s) => {
      const task = s.tasks.find((t) => t.id === data.taskId);
      const p = progressOf(s, kidId);
      if (!task) {
        result = "limit";
        s.progress[kidId] = p;
        return;
      }
      if (p.tasksDone.includes(task.id)) {
        result = "undone";
        s.progress[kidId] = {
          ...p,
          tasksDone: p.tasksDone.filter((t) => t !== task.id),
          weeklyEarned: Math.max(p.redeemedWeek, p.weeklyEarned - task.value),
        };
        return;
      }
      const granted = Math.min(task.value, WEEKLY_LIMIT - p.weeklyEarned);
      if (granted <= 0) {
        result = "limit";
        s.progress[kidId] = { ...p, tasksDone: [...p.tasksDone, task.id] };
        return;
      }
      result = "earned";
      s.progress[kidId] = {
        ...p,
        tasksDone: [...p.tasksDone, task.id],
        weeklyEarned: p.weeklyEarned + granted,
      };
    });
    return { result, ...snapshotFrom(state, { kind: "kid", kidId }) };
  });

export const redeem = createServerFn({ method: "POST" })
  .inputValidator((data: { amount: number }) => data)
  .handler(async ({ data }) => {
    const kidId = await requireKid();
    const { mutateState } = await import("./captain-db.server");
    const amount = Math.floor(data.amount);
    let ok = true;
    let reason: string | undefined;
    const { state } = await mutateState((s) => {
      const p = progressOf(s, kidId);
      s.progress[kidId] = p;
      if (amount <= 0) {
        ok = false;
        reason = "Escribe cuántos Doblones quieres gastar.";
        return;
      }
      if (amount > chestAvailable(p)) {
        ok = false;
        reason = "No tienes suficientes Doblones en el cofre de esta semana. ¡A por más tareas!";
        return;
      }
      const remaining = Math.max(0, DAILY_REDEEM_LIMIT - p.redeemedToday);
      if (amount > remaining) {
        ok = false;
        reason =
          remaining === 0
            ? "¡Ya has canjeado tu hora de juego de hoy! Vuelve mañana, grumete. ⏰"
            : `Máximo 1 hora al día: hoy solo te quedan ${remaining} minutos por canjear.`;
        return;
      }
      s.progress[kidId] = {
        ...p,
        redeemedWeek: p.redeemedWeek + amount,
        redeemedToday: p.redeemedToday + amount,
      };
    });
    return { ok, reason, ...snapshotFrom(state, { kind: "kid", kidId }) };
  });

/** El Rey Pirata marca/desmarca una tarea de un día pasado y ajusta los Doblones. */
export const setDayTask = createServerFn({ method: "POST" })
  .inputValidator((data: { kidId: string; day: string; taskId: string; done: boolean }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    const { mutateState } = await import("./captain-db.server");
    const { state } = await mutateState((s) => {
      const task = s.tasks.find((t) => t.id === data.taskId);
      if (!task) return;
      const p = refreshProgress(s.progress[data.kidId] ?? newProgress());
      const cur = doneOnDay(p, data.day);
      if (data.done === cur.includes(task.id)) {
        s.progress[data.kidId] = p;
        return;
      }
      const history = {
        ...p.history,
        [data.day]: data.done ? [...cur, task.id] : cur.filter((t) => t !== task.id),
      };
      // Semana actual: toca al cofre; semanas pasadas: al botín acumulado.
      const sameWeek = weekKeyOfDay(data.day) === p.weekKey;
      const next: KidProgress = { ...p, history };
      if (data.done) {
        if (sameWeek) next.weeklyEarned = Math.min(WEEKLY_LIMIT, p.weeklyEarned + task.value);
        else next.booty = p.booty + task.value;
      } else if (sameWeek) {
        next.weeklyEarned = Math.max(p.redeemedWeek, p.weeklyEarned - task.value);
      } else {
        next.booty = Math.max(0, p.booty - task.value);
      }
      if (data.day === next.dayKey) next.tasksDone = history[data.day] ?? [];
      s.progress[data.kidId] = next;
    });
    return snapshotFrom(state, { kind: "admin" });
  });

/** El Rey Pirata aprueba (o retira) el objetivo de una semana del mapa, indicando tareas extra. */
export const setWeekApproval = createServerFn({ method: "POST" })
  .inputValidator((data: { kidId: string; weekKey: string; extraTasks: string | null }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    const { mutateState } = await import("./captain-db.server");
    const { state } = await mutateState((s) => {
      const p = refreshProgress(s.progress[data.kidId] ?? newProgress());
      const approvals = { ...p.mapApprovals };
      if (data.extraTasks === null) delete approvals[data.weekKey];
      else approvals[data.weekKey] = data.extraTasks;
      s.progress[data.kidId] = { ...p, mapApprovals: approvals };
    });
    return snapshotFrom(state, { kind: "admin" });
  });
