import {
  DEFAULT_TASKS,
  type Kid,
  type KidProgress,
  type Task,
} from "./captain-shared";

export type StoredState = {
  admin: { user: string; hash: string; salt: string } | null;
  kids: Kid[];
  tasks: Task[];
  progress: Record<string, KidProgress>;
};

export function emptyState(): StoredState {
  return { admin: null, kids: [], tasks: DEFAULT_TASKS, progress: {} };
}

export function storageMode(): "postgres" | "memory" {
  return process.env["DATABASE_URL"] ? "postgres" : "memory";
}

/* ------------------------------------------------------------------ */
/* Storage: Postgres when DATABASE_URL is set, memory otherwise.        */
/* ------------------------------------------------------------------ */

type Sql = import("postgres").Sql;

let sqlPromise: Promise<Sql> | null = null;
let memoryState: StoredState | null = null;
let storageLogged = false;

const CONNECT_ATTEMPTS = 6;
const CONNECT_RETRY_MS = 1_000;

function normalizeState(value: unknown): StoredState {
  if (!value || typeof value !== "object") return emptyState();
  const candidate = value as Partial<StoredState>;
  const admin =
    candidate.admin &&
    typeof candidate.admin.user === "string" &&
    typeof candidate.admin.hash === "string" &&
    typeof candidate.admin.salt === "string"
      ? candidate.admin
      : null;
  return {
    admin,
    kids: Array.isArray(candidate.kids) ? candidate.kids : [],
    tasks: Array.isArray(candidate.tasks) ? candidate.tasks : DEFAULT_TASKS,
    progress:
      candidate.progress && typeof candidate.progress === "object" ? candidate.progress : {},
  };
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectPostgres(url: string): Promise<Sql> {
  const { default: postgres } = await import("postgres");
  const useSsl = process.env["DATABASE_SSL"] === "true";
  let lastError: unknown;

  for (let attempt = 1; attempt <= CONNECT_ATTEMPTS; attempt += 1) {
    const sql = postgres(url, {
      max: 3,
      connect_timeout: 10,
      ...(useSsl ? { ssl: "require" as const } : {}),
    });
    try {
      await sql`create table if not exists captain_state (
        id int primary key,
        data jsonb not null,
        updated_at timestamptz not null default now()
      )`;
      await sql`
        insert into captain_state (id, data, updated_at)
        values (1, ${sql.json(emptyState() as never)}, now())
        on conflict (id) do nothing`;
      if (!storageLogged) {
        console.info("[storage] PostgreSQL conectado; persistencia activa.");
        storageLogged = true;
      }
      return sql;
    } catch (error) {
      lastError = error;
      await sql.end({ timeout: 1 }).catch(() => undefined);
      if (attempt < CONNECT_ATTEMPTS) await wait(CONNECT_RETRY_MS);
    }
  }

  console.error("[storage] No se pudo conectar con PostgreSQL.", lastError);
  throw new Error(
    "No se puede conectar con PostgreSQL. Revisa DATABASE_URL y que el servicio de base de datos esté iniciado.",
    { cause: lastError },
  );
}

async function getSql(): Promise<Sql | null> {
  const url = process.env["DATABASE_URL"];
  if (!url) {
    if (process.env["REQUIRE_DATABASE"] === "1") {
      throw new Error(
        "DATABASE_URL es obligatoria en este despliegue. La aplicación no arrancará con almacenamiento temporal.",
      );
    }
    if (!storageLogged) {
      console.warn("[storage] Almacenamiento temporal activo; los datos se perderán al reiniciar.");
      storageLogged = true;
    }
    return null;
  }
  if (!sqlPromise) {
    // Una promesa rechazada no debe quedar memorizada: el siguiente intento
    // vuelve a conectar cuando PostgreSQL ya esté preparado.
    sqlPromise = connectPostgres(url).catch((error) => {
      sqlPromise = null;
      throw error;
    });
  }
  return sqlPromise;
}

export async function readState(): Promise<StoredState> {
  const sql = await getSql();
  if (!sql) return (memoryState ??= emptyState());
  const rows = await sql<{ data: StoredState }[]>`
    select data from captain_state where id = 1`;
  return normalizeState(rows[0]?.data);
}

/** Reads, mutates and persists the state atomically. */
export async function mutateState<T>(
  mutator: (state: StoredState) => T | Promise<T>,
): Promise<{ state: StoredState; result: T }> {
  const sql = await getSql();
  if (!sql) {
    const state = (memoryState ??= emptyState());
    const result = await mutator(state);
    memoryState = state;
    return { state, result };
  }

  return sql.begin(async (tx) => {
    const rows = await tx<{ data: StoredState }[]>`
      select data from captain_state where id = 1 for update`;
    const state = normalizeState(rows[0]?.data);
    const result = await mutator(state);
    await tx`
      insert into captain_state (id, data, updated_at)
      values (1, ${tx.json(state as never)}, now())
      on conflict (id) do update set data = excluded.data, updated_at = now()`;
    return { state, result };
  }) as Promise<{ state: StoredState; result: T }>;
}

/* ------------------------------------------------------------------ */
/* Password hashing (PBKDF2 via WebCrypto)                              */
/* ------------------------------------------------------------------ */

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPassword(password: string, salt: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(salt),
      iterations: 100_000,
      hash: "SHA-256",
    },
    key,
    256,
  );
  return toHex(bits);
}

export function newSalt() {
  return toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
}

export function uid() {
  return toHex(crypto.getRandomValues(new Uint8Array(6)).buffer);
}
