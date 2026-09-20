import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  Crown,
  LogOut,
  Plus,
  Trash2,
  Pencil,
  Save,
  X,
  Users,
  ListChecks,
  CalendarDays,
  Map,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { useCaptain, BLOCK_LABELS, type DayBlock, type Task } from "@/lib/captain-store";
import {
  WEEKLY_GOAL_PCT,
  doneOnDay,
  mapWeekStats,
  monthMapWeeks,
  weekFulfilled,
  weekKeyOfDay,
} from "@/lib/captain-shared";
import { TASK_ICON_NAMES, getTaskIcon } from "@/lib/task-icons";
import { MapDayBars } from "@/components/MapDayBars";

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
  const [tab, setTab] = useState<"grumetes" | "tareas" | "estadisticas" | "mapa">("grumetes");

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

      <div className="mb-6 flex flex-wrap gap-3">
        {(
          [
            ["grumetes", "Grumetes", Users],
            ["tareas", "Tareas", ListChecks],
            ["estadisticas", "Estadísticas", CalendarDays],
            ["mapa", "Mapa del Tesoro", Map],
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

      {tab === "grumetes" ? (
        <Grumetes />
      ) : tab === "tareas" ? (
        <Tareas />
      ) : tab === "estadisticas" ? (
        <Estadisticas />
      ) : (
        <MapaTesoro />
      )}
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

const WEEK_DAYS = ["L", "M", "X", "J", "V", "S", "D"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function dayNumberOf(key: string) {
  return Number(key.slice(8, 10));
}

function dayValue(done: string[], tasks: Task[]) {
  return done.reduce((sum, id) => sum + (tasks.find((t) => t.id === id)?.value ?? 0), 0);
}

function Estadisticas() {
  const { kids, tasks, data, setDayTask } = useCaptain();
  const now = new Date();
  const [kidId, setKidId] = useState<string | null>(null);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [day, setDay] = useState<string | null>(null);

  const kid = kids.find((k) => k.id === kidId) ?? kids[0];
  const p = kid ? data.progress[kid.id] : undefined;

  // Días del mes en rejilla de semanas (la semana empieza el lunes).
  const firstOffset = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: firstOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${year}-${pad(month + 1)}-${pad(i + 1)}`),
  ];
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const today = new Date().toISOString().slice(0, 10);
  const thisWeek = weekKeyOfDay(today);
  const selectedWeek = day ? weekKeyOfDay(day) : null;
  const done = kid && day && p ? doneOnDay(p, day) : [];
  const weekTotal = day && p ? dayValue(doneOnDay(p, day), tasks) : 0;

  function moveMonth(delta: number) {
    const d = new Date(Date.UTC(year, month + delta, 1));
    setYear(d.getUTCFullYear());
    setMonth(d.getUTCMonth());
    setDay(null);
  }

  if (!kid || !p) {
    return (
      <section className="rounded-3xl border-4 border-ink/20 bg-card/95 p-6 float-card">
        <h2 className="font-display text-2xl font-extrabold">Estadísticas</h2>
        <p className="mt-3 font-bold text-muted-foreground">
          Da de alta un grumete para ver su calendario de tareas.
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <section className="rounded-3xl border-4 border-ink/20 bg-card/95 p-6 float-card">
        <div className="flex flex-wrap items-center gap-2">
          {kids.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => {
                setKidId(k.id);
                setDay(null);
              }}
              className={`chunky flex items-center gap-2 rounded-2xl border-4 px-4 py-2 font-display text-lg font-extrabold ${
                kid.id === k.id ? "border-primary bg-primary/15" : "border-ink/15 bg-secondary"
              }`}
            >
              <span className="text-2xl">
                {k.avatar.startsWith("data:") ? (
                  <img src={k.avatar} alt="" className="size-7 rounded-full object-cover" />
                ) : (
                  k.avatar
                )}
              </span>
              {k.name}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            aria-label="Mes anterior"
            onClick={() => moveMonth(-1)}
            className="chunky rounded-xl border-4 border-ink/15 bg-secondary p-2"
          >
            <ChevronLeft className="size-6" />
          </button>
          <h2 className="font-display text-2xl font-extrabold capitalize">
            {new Date(Date.UTC(year, month, 1)).toLocaleDateString("es-ES", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <button
            type="button"
            aria-label="Mes siguiente"
            onClick={() => moveMonth(1)}
            className="chunky rounded-xl border-4 border-ink/15 bg-secondary p-2"
          >
            <ChevronRight className="size-6" />
          </button>
        </div>

        <table className="mt-4 w-full border-separate border-spacing-1">
          <thead>
            <tr>
              {WEEK_DAYS.map((d) => (
                <th key={d} className="font-display text-sm font-extrabold text-muted-foreground">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, wi) => (
              <tr key={wi}>
                {week.map((key, di) => {
                  if (!key) return <td key={di} />;
                  const doneList = doneOnDay(p, key);
                  const total = dayValue(doneList, tasks);
                  return (
                    <td key={di}>
                      <button
                        type="button"
                        onClick={() => setDay(key)}
                        className={`flex h-14 w-full flex-col items-center justify-center rounded-xl border-4 font-display font-extrabold ${
                          day === key
                            ? "border-primary bg-primary/15"
                            : doneList.length > 0
                              ? "border-leaf/50 bg-leaf/15"
                              : "border-ink/10 bg-secondary"
                        } ${key === today ? "ring-4 ring-gold/50" : ""}`}
                      >
                        <span className="text-base leading-none">{dayNumberOf(key)}</span>
                        {doneList.length > 0 && (
                          <span className="mt-0.5 text-[11px] leading-none text-foreground/70">
                            {doneList.length} · {total}🕯
                          </span>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-sm font-bold text-muted-foreground">
          Verde: día con tareas hechas · Borde dorado: hoy · Toca un día para revisarlo.
        </p>
      </section>

      <section className="rounded-3xl border-4 border-ink/20 bg-card/95 p-6 float-card">
        {!day ? (
          <div>
            <h2 className="font-display text-2xl font-extrabold">Revisar un día</h2>
            <p className="mt-3 font-bold text-muted-foreground">
              Toca un día del calendario para marcar o desmarcar sus tareas y corregir los
              Doblones de {kid.name}.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-extrabold capitalize">
                {new Date(`${day}T12:00:00`).toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </h2>
              <button
                type="button"
                onClick={() => setDay(null)}
                className="chunky rounded-xl border-4 border-ink/15 bg-card p-2"
                aria-label="Cerrar día"
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="mt-1 font-display text-lg font-extrabold text-muted-foreground">
              {done.length} tareas · {weekTotal} Doblones{" "}
              {selectedWeek !== thisWeek && "(va a tu botín)"}
            </p>

            {BLOCKS.map((block) => {
              const blockTasks = tasks.filter((t) => t.block === block);
              if (blockTasks.length === 0) return null;
              return (
                <div key={block} className="mt-4">
                  <h3 className="font-display text-lg font-extrabold text-muted-foreground">
                    {BLOCK_LABELS[block]}
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {blockTasks.map((task) => {
                      const isDone = done.includes(task.id);
                      const Icon = getTaskIcon(task.icon);
                      return (
                        <li
                          key={task.id}
                          className={`flex items-center gap-3 rounded-2xl border-4 p-3 ${
                            isDone ? "border-leaf/60 bg-leaf/10" : "border-ink/10 bg-secondary"
                          }`}
                        >
                          <Icon className="size-7 shrink-0 text-primary" />
                          <div className="flex-1">
                            <p className="font-display text-lg font-extrabold">{task.label}</p>
                            <p className="font-display text-sm font-extrabold text-muted-foreground">
                              {task.value} Doblones
                            </p>
                          </div>
                          <button
                            type="button"
                            aria-label={
                              isDone
                                ? `Desmarcar ${task.label} el ${day}`
                                : `Marcar ${task.label} el ${day}`
                            }
                            onClick={() => void setDayTask(kid.id, day, task.id, !isDone)}
                            className={`chunky flex items-center gap-1 rounded-xl border-4 border-ink/15 px-3 py-2 font-display text-sm font-extrabold ${
                              isDone ? "bg-leaf text-leaf-foreground" : "bg-card"
                            }`}
                          >
                            <Check className="size-5" /> {isDone ? "Hecha" : "No hecha"}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
            <p className="mt-4 text-sm font-bold text-muted-foreground">
              Al marcar o desmarcar, los Doblones se ajustan solos: en esta semana tocan al cofre
              y en semanas pasadas al botín de {kid.name}.
            </p>
          </>
        )}
      </section>
    </div>
  );
}

function MapaTesoro() {
  const { kids, tasks, data, setWeekApproval } = useCaptain();
  const now = new Date();
  const [kidId, setKidId] = useState<string | null>(null);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [extraDraft, setExtraDraft] = useState<Record<string, string>>({});

  const kid = kids.find((k) => k.id === kidId) ?? kids[0];
  const p = kid ? data.progress[kid.id] : undefined;
  const weeks = monthMapWeeks(year, month);
  const today = new Date().toISOString().slice(0, 10);

  function moveMonth(delta: number) {
    const d = new Date(Date.UTC(year, month + delta, 1));
    setYear(d.getUTCFullYear());
    setMonth(d.getUTCMonth());
  }

  if (!kid || !p) {
    return (
      <section className="rounded-3xl border-4 border-ink/20 bg-card/95 p-6 float-card">
        <h2 className="font-display text-2xl font-extrabold">Mapa del Tesoro</h2>
        <p className="mt-3 font-bold text-muted-foreground">
          Da de alta un grumete para revisar su mapa del tesoro mensual.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border-4 border-ink/20 bg-card/95 p-6 float-card">
        <div className="flex flex-wrap items-center gap-2">
          {kids.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setKidId(k.id)}
              className={`chunky flex items-center gap-2 rounded-2xl border-4 px-4 py-2 font-display text-lg font-extrabold ${
                kid.id === k.id ? "border-primary bg-primary/15" : "border-ink/15 bg-secondary"
              }`}
            >
              <span className="text-2xl">
                {k.avatar.startsWith("data:") ? (
                  <img src={k.avatar} alt="" className="size-7 rounded-full object-cover" />
                ) : (
                  k.avatar
                )}
              </span>
              {k.name}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            aria-label="Mes anterior"
            onClick={() => moveMonth(-1)}
            className="chunky rounded-xl border-4 border-ink/15 bg-secondary p-2"
          >
            <ChevronLeft className="size-6" />
          </button>
          <h2 className="font-display text-2xl font-extrabold capitalize">
            {new Date(Date.UTC(year, month, 1)).toLocaleDateString("es-ES", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <button
            type="button"
            aria-label="Mes siguiente"
            onClick={() => moveMonth(1)}
            className="chunky rounded-xl border-4 border-ink/15 bg-secondary p-2"
          >
            <ChevronRight className="size-6" />
          </button>
        </div>
        <p className="mt-2 text-sm font-bold text-muted-foreground">
          Cada semana se cumple al alcanzar el {WEEKLY_GOAL_PCT}% de lunes a viernes. Sábados y
          domingos son festivos, siempre cumplen y no afectan a la media.
        </p>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        {weeks.map((w) => {
          const st = mapWeekStats(p, tasks.length, w, today);
          const ok = weekFulfilled(p, st, w.key);
          const approved = p.mapApprovals[w.key];
          const draft = extraDraft[w.key] ?? "";
          const rango = `${w.days[0]!.slice(8)}–${w.days[6]!.slice(8)} ${new Date(
            `${w.days[0]!}T12:00:00`,
          ).toLocaleDateString("es-ES", { month: "short" })}`;
          return (
            <section
              key={w.key}
              className={`rounded-3xl border-4 p-6 float-card ${
                ok ? "border-leaf/60 bg-leaf/10" : "border-ink/20 bg-card/95"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-xl font-extrabold">
                  Semana {w.index + 1}
                  <span className="ml-2 text-sm font-extrabold text-muted-foreground">{rango}</span>
                </h3>
                <span
                  className={`rounded-xl border-4 px-3 py-1 font-display text-sm font-extrabold ${
                    ok ? "border-leaf bg-leaf text-leaf-foreground" : "border-ink/15 bg-secondary"
                  }`}
                >
                  {st.pct >= WEEKLY_GOAL_PCT
                    ? "Objetivo cumplido"
                    : approved
                      ? "Aprobada por el Rey"
                      : "Pendiente"}
                </span>
              </div>
              <MapDayBars days={st.days} />

              {approved && (
                <div className="mt-3 rounded-2xl border-4 border-ink/15 bg-secondary p-3">
                  <p className="font-display text-sm font-extrabold">Tareas extra indicadas:</p>
                  <p className="mt-1 text-sm font-bold whitespace-pre-line">{approved}</p>
                </div>
              )}

              {!ok && (
                <div className="mt-4">
                  <textarea
                    value={draft}
                    onChange={(e) =>
                      setExtraDraft((prev) => ({ ...prev, [w.key]: e.target.value }))
                    }
                    placeholder="Tareas extra para aprobar la semana (ej: ayudar en el garaje, leer 3 días…)"
                    rows={2}
                    className="w-full rounded-2xl border-4 border-ink/15 bg-background p-3 font-bold"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      void setWeekApproval(kid.id, w.key, draft.trim() || null).then(() =>
                        setExtraDraft((prev) => ({ ...prev, [w.key]: "" })),
                      )
                    }
                    className="chunky mt-2 rounded-2xl border-4 border-ink/20 bg-primary px-4 py-2 font-display font-extrabold text-primary-foreground"
                  >
                    <Check className="mr-1 inline size-5" /> Aprobar objetivo
                  </button>
                </div>
              )}
              {approved && (
                <button
                  type="button"
                  onClick={() => void setWeekApproval(kid.id, w.key, null)}
                  className="chunky mt-3 rounded-2xl border-4 border-ink/15 bg-secondary px-4 py-2 font-display text-sm font-extrabold"
                >
                  Retirar aprobación
                </button>
              )}
            </section>
          );
        })}
      </div>
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
