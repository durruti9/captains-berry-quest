import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

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
  locationPromise: Promise<StorageLocation> | null;
  location: StorageLocation | null;
};

type StorageLocation = {
  dataDir: string;
  mode: "persistent" | "temporary";
  fallbackReason: string | null;
};

const runtimeGlobal = globalThis as unknown as { __captainFileStorageV2?: RuntimeStorage };
const runtimeStorage = (runtimeGlobal.__captainFileStorageV2 ??= {
  readyPromise: null,
  queue: Promise.resolve(),
  locationPromise: null,
  location: null,
});

async function resolveStorageLocation(): Promise<StorageLocation> {
  if (!runtimeStorage.locationPromise) {
    runtimeStorage.locationPromise = (async () => {
      const configured = process.env["CAPTAIN_DATA_DIR"]?.trim();
      const candidates = [
        configured,
        "/data",
        "/app/data",
        process.env["NODE_ENV"] === "production"
          ? "/tmp/diario-del-capitan"
          : "/tmp/diario-del-capitan-dev",
      ].filter((value, index, values): value is string => Boolean(value) && values.indexOf(value) === index);
      let firstFailure: string | null = null;

      for (const candidate of candidates) {
        try {
          await mkdir(candidate, { recursive: true });
          const probe = join(candidate, `.write-test-${crypto.randomUUID()}`);
          await writeFile(probe, "ok", { encoding: "utf8", mode: 0o600 });
          await unlink(probe);
          const persistent = candidate === configured || candidate === "/data";
          const location: StorageLocation = {
            dataDir: candidate,
            mode: persistent ? "persistent" : "temporary",
            fallbackReason: persistent ? null : firstFailure ?? "El volumen /data no está disponible.",
          };
          runtimeStorage.location = location;
          return location;
        } catch (error) {
          firstFailure ??= error instanceof Error ? error.message : "No se puede escribir en /data.";
        }
      }
      throw new Error("No existe ninguna carpeta disponible para guardar los datos.");
    })();
  }
  return runtimeStorage.locationPromise;
}

export function storageMode(): "persistent" | "temporary" {
  return runtimeStorage.location?.mode ?? "temporary";
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
      const { dataDir } = await resolveStorageLocation();
      const statePath = join(dataDir, "captain-state.json");
      const secretPath = join(dataDir, "session-secret.txt");
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
    const { dataDir } = await resolveStorageLocation();
    const statePath = join(dataDir, "captain-state.json");
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
      const { dataDir } = await resolveStorageLocation();
      const statePath = join(dataDir, "captain-state.json");
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
    const { dataDir } = await resolveStorageLocation();
    const secretPath = join(dataDir, "session-secret.txt");
    const secret = (await readFile(secretPath, "utf8")).trim();
    if (secret.length < 32) throw new Error("La clave de sesión guardada no es válida.");
    return secret;
  } catch (error) {
    throw storageError(error);
  }
}

export async function checkStorage() {
  const state = await readState();
  const location = await resolveStorageLocation();
  const probePath = join(location.dataDir, `.health-${crypto.randomUUID()}`);
  try {
    await writeFile(probePath, "ok", "utf8");
    await rename(probePath, `${probePath}.done`);
    await unlink(`${probePath}.done`);
  } catch (error) {
    throw storageError(error);
  }
  return { ...location, initialized: Boolean(state.admin) };
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