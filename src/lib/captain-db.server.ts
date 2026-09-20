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
  return databaseConfig() ? "postgres" : "memory";
}

type DatabaseConfig =
  | { source: "url"; url: string }
  | {
      source: "variables";
      host: string;
      port: number;
      database: string;
      username: string;
      password: string;
    };

function databaseConfig(): DatabaseConfig | null {
  const url = process.env["DATABASE_URL"]?.trim();
  if (url) return { source: "url", url };

  const host = process.env["DB_HOST"]?.trim();
  const database = process.env["DB_NAME"]?.trim();
  const username = process.env["DB_USER"]?.trim();
  const password = process.env["DB_PASSWORD"];
  if (!host || !database || !username || password === undefined) return null;

  const parsedPort = Number(process.env["DB_PORT"] ?? "5432");
  return {
    source: "variables",
    host,
    port: Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 5432,
    database,
    username,
    password,
  };
}

/* ------------------------------------------------------------------ */
/* Storage: Postgres when DATABASE_URL is set, memory otherwise.        */
/* ------------------------------------------------------------------ */

type Sql = import("postgres").Sql;

type RuntimeStorage = {
  sqlPromise: Promise<Sql> | null;
  memoryState: StoredState | null;
  storageLogged: boolean;
};

const runtimeGlobal = globalThis as unknown as { __captainRuntimeStorage?: RuntimeStorage };
const runtimeStorage = (runtimeGlobal.__captainRuntimeStorage ??= {
  sqlPromise: null,
  memoryState: null,
  storageLogged: false,
});

const CONNECT_ATTEMPTS = 6;
const CONNECT_RETRY_MS = 1_000;

export type DatabaseIssue = "database_missing" | "credentials_rejected" | "host_unreachable" | "unknown";

export function databaseIssue(error: unknown): DatabaseIssue {
  const candidate = error as { code?: unknown; cause?: unknown; message?: unknown };
  const cause = candidate?.cause as { code?: unknown; message?: unknown } | undefined;
  const code = String(cause?.code ?? candidate?.code ?? "");
  const message = String(cause?.message ?? candidate?.message ?? "").toLowerCase();

  if (code === "3D000" || message.includes("database") && message.includes("does not exist")) {
    return "database_missing";
  }
  if (code === "28P01" || message.includes("password authentication failed")) {
    return "credentials_rejected";
  }
  if (
    ["ENOTFOUND", "ECONNREFUSED", "ETIMEDOUT", "EAI_AGAIN"].includes(code) ||
    message.includes("getaddrinfo") ||
    message.includes("connect timeout") ||
    message.includes("connection refused")
  ) {
    return "host_unreachable";
  }
  return "unknown";
}

export function databaseIssueMessage(issue: DatabaseIssue): string {
  if (issue === "database_missing") {
    return "La base indicada en DATABASE_URL no existe. Copia la URL de conexión interna completa de PostgreSQL en Easypanel.";
  }
  if (issue === "credentials_rejected") {
    return "PostgreSQL ha rechazado el usuario o la contraseña de DATABASE_URL. Vuelve a copiar la URL interna desde Easypanel.";
  }
  if (issue === "host_unreachable") {
    return "No se encuentra el servicio PostgreSQL. Comprueba que DATABASE_URL usa el host interno de Easypanel y que PostgreSQL está iniciado.";
  }
  return "No se puede conectar con PostgreSQL. Revisa la URL de conexión interna en Easypanel.";
}

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

async function connectPostgres(config: DatabaseConfig): Promise<Sql> {
  const { default: postgres } = await import("postgres");
  const useSsl = process.env["DATABASE_SSL"] === "true";
  let lastError: unknown;

  for (let attempt = 1; attempt <= CONNECT_ATTEMPTS; attempt += 1) {
    const commonOptions = {
      max: 3,
      connect_timeout: 10,
      ...(useSsl ? { ssl: "require" as const } : {}),
    };
    const sql = config.source === "url"
      ? postgres(config.url, commonOptions)
      : postgres({
          ...commonOptions,
          host: config.host,
          port: config.port,
          database: config.database,
          username: config.username,
          password: config.password,
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
      if (!runtimeStorage.storageLogged) {
        console.info("[storage] PostgreSQL conectado; persistencia activa.");
        runtimeStorage.storageLogged = true;
      }
      return sql;
    } catch (error) {
      lastError = error;
      await sql.end({ timeout: 1 }).catch(() => undefined);
      if (attempt < CONNECT_ATTEMPTS) await wait(CONNECT_RETRY_MS);
    }
  }

  console.error("[storage] No se pudo conectar con PostgreSQL.", lastError);
  throw new Error(databaseIssueMessage(databaseIssue(lastError)), { cause: lastError });
}

async function getSql(): Promise<Sql | null> {
  const config = databaseConfig();
  if (!config) {
    if (process.env["REQUIRE_DATABASE"] === "1") {
      throw new Error(
        "Falta la conexión PostgreSQL en la app. Añade DATABASE_URL o las cinco variables DB_HOST, DB_PORT, DB_NAME, DB_USER y DB_PASSWORD.",
      );
    }
    if (!runtimeStorage.storageLogged) {
      console.warn("[storage] Almacenamiento temporal activo; los datos se perderán al reiniciar.");
      runtimeStorage.storageLogged = true;
    }
    return null;
  }
  if (!runtimeStorage.sqlPromise) {
    // Una promesa rechazada no debe quedar memorizada: el siguiente intento
    // vuelve a conectar cuando PostgreSQL ya esté preparado.
    runtimeStorage.sqlPromise = connectPostgres(config).catch((error) => {
      runtimeStorage.sqlPromise = null;
      throw error;
    });
  }
  return runtimeStorage.sqlPromise;
}

export async function readState(): Promise<StoredState> {
  const sql = await getSql();
  if (!sql) return (runtimeStorage.memoryState ??= emptyState());
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
    const state = (runtimeStorage.memoryState ??= emptyState());
    const result = await mutator(state);
    runtimeStorage.memoryState = state;
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
