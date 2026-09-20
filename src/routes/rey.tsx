import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Crown, LogOut, Plus, Trash2, Pencil, Save, X, Users, ListChecks } from "lucide-react";
import { useCaptain, BLOCK_LABELS, type DayBlock, type Task } from "@/lib/captain-store";
import { TASK_ICON_NAMES, getTaskIcon } from "@/lib/task-icons";

export const Route = createFileRoute("/rey")({
  head: () => ({
    meta: [
      { title: "Rey Pirata — El Diario del Capitán" },
      {
        name: "description",
        content:
          "Panel de administración: gestiona los grumetes de la tripulación y las tareas del barco con su valor en Doblones.",
      },
      { property: "og:title", content: "Rey Pirata — El Diario del Capitán" },
      {
        property: "og:description",
        content: "Alta de grumetes y CRUD de tareas con iconos y valor en Doblones.",
      },
    ],
  }),
  component: ReyPirata,
});

const AVATARS = ["🧒", "👦", "👧", "🦜", "🐙", "🦈", "🐵", "🐯", "🦁", "🐼", "🦊", "🐸"];

function ReyPirata() {
  const { ready, session, logout } = useCaptain();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"grumetes" | "tareas">("grumetes");

  if (!ready) return <div className="sea-bg min-h-screen" />;

  if (session?.kind !== "admin") {
    return (
      <div className="sea-bg flex min-h-screen items-center justify-center p-6">
        <div className="rounded-3xl border-4 border-ink/20 bg-card/95 p-8 text-center float-card">
          <p className="font-display text-2xl font-extrabold">Zona solo para el Rey Pirata</p>
          <Link
            to="/"
            className="chunky mt-5 inline-block rounded-2xl border-4 border-ink/20 bg-primary px-6 py-3 font-display text-xl font-extrabold text-primary-foreground"
          >
            Volver a los perfiles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="sea-bg min-h-screen p-5 lg:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Crown className="size-10 text-gold" />
          <div>
            <h1 className="font-display text-3xl font-extrabold text-sea-foreground drop-shadow-md lg:text-4xl">
              Zona del Rey Pirata
            </h1>
            <p className="font-bold text-sea-foreground/85">Gestiona la tripulación y las tareas</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate({ to: "/" });
          }}
          className="chunky flex items-center gap-2 rounded-2xl border-4 border-ink/20 bg-card px-5 py-3 font-display text-lg font-extrabold"
        >
          <LogOut className="size-6" /> Salir
        </button>
      </header>

      <div className="mb-6 flex gap-3">
        {(
          [
            ["grumetes", "Grumetes", Users],
            ["tareas", "Tareas", ListChecks],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`chunky flex items-center gap-2 rounded-2xl border-4 border-ink/20 px-5 py-3 font-display text-lg font-extrabold ${
              tab === key ? "bg-primary text-primary-foreground" : "bg-card"
            }`}
          >
            <Icon className="size-6" /> {label}
          </button>
        ))}
      </div>

      {tab === "grumetes" ? <Grumetes /> : <Tareas />}
    </div>
  );
}

function Grumetes() {
  const { kids, addKid, removeKid, updateKid } = useCaptain();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]!);
  const fileRef = useRef<HTMLInputElement>(null);

  function pickFile(file: File | undefined, apply: (value: string) => void) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => apply(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="rounded-3xl border-4 border-ink/20 bg-card/95 p-6 float-card">
        <h2 className="font-display text-2xl font-extrabold">Dar de alta un grumete</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del grumete"
          className="mt-4 w-full rounded-2xl border-4 border-ink/15 bg-background px-4 py-3 font-display text-xl font-extrabold"
        />
        <p className="mt-4 font-display text-lg font-extrabold">Avatar</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {AVATARS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAvatar(a)}
              className={`flex size-14 items-center justify-center rounded-2xl border-4 text-3xl ${
                avatar === a ? "border-primary bg-primary/15" : "border-ink/15 bg-secondary"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0], setAvatar)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="chunky mt-3 rounded-2xl border-4 border-ink/15 bg-secondary px-4 py-2 font-display text-lg font-extrabold"
        >
          Subir foto
        </button>
        {avatar.startsWith("data:") && (
          <img
            src={avatar}
            alt="Vista previa del avatar"
            className="mt-3 size-20 rounded-full border-4 border-ink/20 object-cover"
          />
        )}
        <button
          type="button"
          disabled={!name.trim()}
          onClick={() => {
            void addKid({ name: name.trim(), avatar });
            setName("");
            setAvatar(AVATARS[0]!);
          }}
          className="chunky mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border-4 border-ink/20 bg-primary py-4 font-display text-2xl font-extrabold text-primary-foreground disabled:opacity-50"
        >
          <Plus className="size-7" /> Añadir grumete
        </button>
      </section>

      <section className="rounded-3xl border-4 border-ink/20 bg-card/95 p-6 float-card">
        <h2 className="font-display text-2xl font-extrabold">Tripulación ({kids.length})</h2>
        <ul className="mt-4 space-y-3">
          {kids.map((kid) => (
            <li
              key={kid.id}
              className="flex items-center gap-4 rounded-2xl border-4 border-ink/10 bg-secondary p-3"
            >
              <span className="flex size-16 items-center justify-center overflow-hidden rounded-full border-4 border-ink/20 bg-card text-3xl">
                {kid.avatar.startsWith("data:") ? (
                  <img src={kid.avatar} alt="" className="size-full object-cover" />
                ) : (
                  kid.avatar
                )}
              </span>
              <input
                value={kid.name}
                onChange={(e) => void updateKid(kid.id, { name: e.target.value })}
                className="flex-1 rounded-xl border-4 border-transparent bg-transparent px-2 py-1 font-display text-xl font-extrabold focus:border-ink/15 focus:bg-card"
              />
              <button
                type="button"
                aria-label={`Borrar a ${kid.name}`}
                onClick={() => void removeKid(kid.id)}
                className="chunky rounded-xl border-4 border-ink/15 bg-card p-2 text-destructive"
              >
                <Trash2 className="size-6" />
              </button>
            </li>
          ))}
          {kids.length === 0 && (
            <p className="font-bold text-muted-foreground">Todavía no hay grumetes a bordo.</p>
          )}
        </ul>
      </section>
    </div>
  );
}

const BLOCKS: DayBlock[] = ["manana", "tarde", "noche"];

function Tareas() {
  const { tasks, addTask, updateTask, removeTask } = useCaptain();
  const [label, setLabel] = useState("");
  const [value, setValue] = useState(10);
  const [icon, setIcon] = useState(TASK_ICON_NAMES[0]!);
  const [block, setBlock] = useState<DayBlock>("manana");
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="rounded-3xl border-4 border-ink/20 bg-card/95 p-6 float-card">
        <h2 className="font-display text-2xl font-extrabold">Nueva tarea del barco</h2>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Nombre de la tarea"
          className="mt-4 w-full rounded-2xl border-4 border-ink/15 bg-background px-4 py-3 font-display text-xl font-extrabold"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="font-display text-lg font-extrabold">Doblones</label>
          <input
            type="number"
            min={1}
            max={120}
            value={value}
            onChange={(e) => setValue(Math.max(1, Number(e.target.value) || 1))}
            className="w-28 rounded-2xl border-4 border-ink/15 bg-background px-3 py-2 text-center font-display text-2xl font-extrabold"
          />
          <select
            value={block}
            onChange={(e) => setBlock(e.target.value as DayBlock)}
            className="rounded-2xl border-4 border-ink/15 bg-background px-3 py-2 font-display text-lg font-extrabold"
          >
            {BLOCKS.map((b) => (
              <option key={b} value={b}>
                {BLOCK_LABELS[b]}
              </option>
            ))}
          </select>
        </div>

        <p className="mt-4 font-display text-lg font-extrabold">Icono</p>
        <IconPicker selected={icon} onSelect={setIcon} />

        <button
          type="button"
          disabled={!label.trim()}
          onClick={() => {
            void addTask({ label: label.trim(), value, icon, block });
            setLabel("");
            setValue(10);
          }}
          className="chunky mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border-4 border-ink/20 bg-primary py-4 font-display text-2xl font-extrabold text-primary-foreground disabled:opacity-50"
        >
          <Plus className="size-7" /> Añadir tarea
        </button>
      </section>

      <section className="rounded-3xl border-4 border-ink/20 bg-card/95 p-6 float-card">
        <h2 className="font-display text-2xl font-extrabold">Tareas actuales ({tasks.length})</h2>
        {tasks.length === 0 && (
          <p className="mt-4 font-bold text-muted-foreground">No hay tareas configuradas.</p>
        )}
        {BLOCKS.map((block) => {
          const blockTasks = tasks.filter((t) => t.block === block);
          if (blockTasks.length === 0) return null;
          return (
            <section key={block} className="mt-5">
              <h3 className="font-display text-lg font-extrabold text-muted-foreground">
                {BLOCK_LABELS[block]} ({blockTasks.length})
              </h3>
              <ul className="mt-2 space-y-3">
                {blockTasks.map((task) =>
                  editing === task.id ? (
                    <TaskEditor
                      key={task.id}
                      task={task}
                      onCancel={() => setEditing(null)}
                      onSave={(patch) => {
                        void updateTask(task.id, patch);
                        setEditing(null);
                      }}
                    />
                  ) : (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onEdit={() => setEditing(task.id)}
                      onDelete={() => void removeTask(task.id)}
                    />
                  ),
                )}
              </ul>
            </section>
          );
        })}
      </section>
    </div>
  );
}

function IconPicker({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (name: string) => void;
}) {
  return (
    <div className="mt-2 grid max-h-52 grid-cols-6 gap-2 overflow-y-auto sm:grid-cols-8">
      {TASK_ICON_NAMES.map((name) => {
        const Icon = getTaskIcon(name);
        return (
          <button
            key={name}
            type="button"
            aria-label={name}
            onClick={() => onSelect(name)}
            className={`flex size-12 items-center justify-center rounded-xl border-4 ${
              selected === name ? "border-primary bg-primary/15" : "border-ink/15 bg-secondary"
            }`}
          >
            <Icon className="size-6" />
          </button>
        );
      })}
    </div>
  );
}

function TaskRow({
  task,
  onEdit,
  onDelete,
}: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = getTaskIcon(task.icon);
  return (
    <li className="flex items-center gap-3 rounded-2xl border-4 border-ink/10 bg-secondary p-3">
      <Icon className="size-8 shrink-0 text-primary" />
      <div className="flex-1">
        <p className="font-display text-xl font-extrabold">{task.label}</p>
        <p className="font-display text-sm font-extrabold text-muted-foreground">
          {BLOCK_LABELS[task.block]} · {task.value} Doblones
        </p>
      </div>
      <button
        type="button"
        aria-label={`Editar ${task.label}`}
        onClick={onEdit}
        className="chunky rounded-xl border-4 border-ink/15 bg-card p-2"
      >
        <Pencil className="size-6" />
      </button>
      <button
        type="button"
        aria-label={`Borrar ${task.label}`}
        onClick={onDelete}
        className="chunky rounded-xl border-4 border-ink/15 bg-card p-2 text-destructive"
      >
        <Trash2 className="size-6" />
      </button>
    </li>
  );
}

function TaskEditor({
  task,
  onSave,
  onCancel,
}: {
  task: Task;
  onSave: (patch: Partial<Omit<Task, "id">>) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(task.label);
  const [value, setValue] = useState(task.value);
  const [icon, setIcon] = useState(task.icon);
  const [block, setBlock] = useState<DayBlock>(task.block);

  return (
    <li className="rounded-2xl border-4 border-primary bg-card p-3">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="w-full rounded-2xl border-4 border-ink/15 bg-background px-3 py-2 font-display text-xl font-extrabold"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          type="number"
          min={1}
          max={120}
          value={value}
          onChange={(e) => setValue(Math.max(1, Number(e.target.value) || 1))}
          className="w-24 rounded-2xl border-4 border-ink/15 bg-background px-3 py-2 text-center font-display text-xl font-extrabold"
        />
        <select
          value={block}
          onChange={(e) => setBlock(e.target.value as DayBlock)}
          className="rounded-2xl border-4 border-ink/15 bg-background px-3 py-2 font-display text-lg font-extrabold"
        >
          {BLOCKS.map((b) => (
            <option key={b} value={b}>
              {BLOCK_LABELS[b]}
            </option>
          ))}
        </select>
      </div>
      <IconPicker selected={icon} onSelect={setIcon} />
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="chunky flex flex-1 items-center justify-center gap-2 rounded-2xl border-4 border-ink/15 bg-secondary py-2 font-display text-lg font-extrabold"
        >
          <X className="size-5" /> Cancelar
        </button>
        <button
          type="button"
          onClick={() => onSave({ label: label.trim() || task.label, value, icon, block })}
          className="chunky flex flex-1 items-center justify-center gap-2 rounded-2xl border-4 border-ink/20 bg-primary py-2 font-display text-lg font-extrabold text-primary-foreground"
        >
          <Save className="size-5" /> Guardar
        </button>
      </div>
    </li>
  );
}
