import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

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

type RuntimeStorage = {
  readyPromise: Promise<void> | null;
  queue: Promise<void>;
};

const runtimeGlobal = globalThis as unknown as { __captainFileStorage?: RuntimeStorage };
const runtimeStorage = (runtimeGlobal.__captainFileStorage ??= {
  readyPromise: null,
  queue: Promise.resolve(),
});

const dataDir = process.env["CAPTAIN_DATA_DIR"]?.trim() ||
  (process.env["NODE_ENV"] === "production" ? "/data" : "/tmp/diario-del-capitan-dev");
const statePath = join(dataDir, "captain-state.json");
const secretPath = join(dataDir, "session-secret.txt");

export function storageMode(): "persistent" | "temporary" {
  return dataDir === "/data" || Boolean(process.env["CAPTAIN_DATA_DIR"])
    ? "persistent"
    : "temporary";
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

function storageError(error: unknown): Error {
  console.error("[storage] No se puede usar el volumen de datos.", error);
  return new Error(
    "No se puede guardar en el volumen permanente. Comprueba que Easypanel monta un volumen con permisos de escritura en /data.",
    { cause: error },
  );
}

async function atomicWrite(path: string, contents: string) {
  const temporaryPath = `${path}.${crypto.randomUUID()}.tmp`;
  await writeFile(temporaryPath, contents, { encoding: "utf8", mode: 0o600 });
  await rename(temporaryPath, path);
}

async function ensureStorage() {
  if (!runtimeStorage.readyPromise) {
    runtimeStorage.readyPromise = (async () => {
      await mkdir(dataDir, { recursive: true });
      try {
        await readFile(statePath, "utf8");
      } catch (error) {
        if ((error as { code?: string }).code !== "ENOENT") throw error;
        await atomicWrite(statePath, JSON.stringify(emptyState(), null, 2));
      }
      try {
        await readFile(secretPath, "utf8");
      } catch (error) {
        if ((error as { code?: string }).code !== "ENOENT") throw error;
        await atomicWrite(secretPath, toHex(crypto.getRandomValues(new Uint8Array(32)).buffer));
      }
      console.info(`[storage] Archivo de datos preparado en ${statePath}.`);
    })().catch((error) => {
      runtimeStorage.readyPromise = null;
      throw storageError(error);
    });
  }
  return runtimeStorage.readyPromise;
}

async function readStateFile(): Promise<StoredState> {
  await ensureStorage();
  try {
    return normalizeState(JSON.parse(await readFile(statePath, "utf8")));
  } catch (error) {
    throw storageError(error);
  }
}

export async function readState(): Promise<StoredState> {
  await runtimeStorage.queue;
  return readStateFile();
}

/** Reads, mutates and persists the state sequentially and atomically. */
export async function mutateState<T>(
  mutator: (state: StoredState) => T | Promise<T>,
): Promise<{ state: StoredState; result: T }> {
  let output: { state: StoredState; result: T } | undefined;
  const operation = runtimeStorage.queue.then(async () => {
    const state = await readStateFile();
    const result = await mutator(state);
    try {
      await atomicWrite(statePath, JSON.stringify(state, null, 2));
    } catch (error) {
      throw storageError(error);
    }
    output = { state, result };
  });
  runtimeStorage.queue = operation.catch(() => undefined);
  await operation;
  if (!output) throw new Error("No se pudo completar el guardado.");
  return output;
}

export async function getSessionSecret() {
  await ensureStorage();
  try {
    const secret = (await readFile(secretPath, "utf8")).trim();
    if (secret.length < 32) throw new Error("La clave de sesión guardada no es válida.");
    return secret;
  } catch (error) {
    throw storageError(error);
  }
}

export async function checkStorage() {
  const state = await readState();
  const probePath = join(dirname(statePath), `.health-${crypto.randomUUID()}`);
  try {
    await writeFile(probePath, "ok", "utf8");
    await rename(probePath, `${probePath}.done`);
    const { unlink } = await import("node:fs/promises");
    await unlink(`${probePath}.done`);
  } catch (error) {
    throw storageError(error);
  }
  return { mode: storageMode(), initialized: Boolean(state.admin) };
}

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
    { name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: 100_000, hash: "SHA-256" },
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