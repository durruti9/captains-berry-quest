import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Sunrise, Sun, Moon, Sparkles } from "lucide-react";
import { PirateShell } from "@/components/PirateShell";
import { KidGuard } from "@/components/KidGuard";
import { Confetti } from "@/components/Confetti";
import { getTaskIcon } from "@/lib/task-icons";
import { useCaptain, BLOCK_LABELS, type DayBlock } from "@/lib/captain-store";
import { navigationStreak } from "@/lib/captain-shared";

export const Route = createFileRoute("/barco")({
  head: () => ({
    meta: [
      { title: "Mi Barco — El Diario del Capitán" },
      {
        name: "description",
        content:
          "Rutinas diarias de mañana, tarde y noche. Completa tus guardias y gana Doblones.",
      },
      { property: "og:title", content: "Mi Barco — El Diario del Capitán" },
      {
        property: "og:description",
        content: "Completa tus tareas de pirata y gana Doblones para tu tiempo de juego.",
      },
    ],
  }),
  component: () => (
    <KidGuard>
      <MiBarco />
    </KidGuard>
  ),
});

const BLOCK_META: Record<DayBlock, { icon: typeof Sun; tone: string }> = {
  manana: { icon: Sunrise, tone: "bg-gold text-gold-foreground" },
  tarde: { icon: Sun, tone: "bg-coral text-coral-foreground" },
  noche: { icon: Moon, tone: "bg-sea text-sea-foreground" },
};

function MiBarco() {
  const { progress, tasks, toggleTask } = useCaptain();
  const [celebrating, setCelebrating] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [dayComplete, setDayComplete] = useState(false);

  const total = tasks.length;
  const done = tasks.filter((t) => progress.tasksDone.includes(t.id)).length;
  const streak = navigationStreak(progress, tasks);

  function celebrateCompletedDay() {
    setDayComplete(true);
    setMessage("¡Guardias completas! El barco está listo para zarpar");
    setTimeout(() => {
      setMessage(null);
      setDayComplete(false);
    }, 3200);
  }

  async function handle(id: string, value: number) {
    const result = await toggleTask(id);
    if (result === "earned") {
      setCelebrating(id);
      const completesDay = total > 0 && done + 1 === total;
      if (completesDay) celebrateCompletedDay();
      else setMessage(`¡+${value} Doblones, grumete!`);
      setTimeout(() => setCelebrating(null), 900);
      if (!completesDay) setTimeout(() => setMessage(null), 1600);
    } else if (result === "limit") {
      const completesDay = total > 0 && done + 1 === total;
      if (completesDay) celebrateCompletedDay();
      else {
        setMessage("¡Ya llegaste al límite de la semana! 🏴‍☠️");
        setTimeout(() => setMessage(null), 2200);
      }
    }
  }

  const blocks: DayBlock[] = ["manana", "tarde", "noche"];

  return (
    <PirateShell title="Mi Barco" subtitle="Cumple tus guardias del día y llena el cofre">
      <div className="mb-5 rounded-3xl border-4 border-ink/15 bg-card/95 p-4 float-card">
        <div className="flex items-center justify-between font-display text-lg font-extrabold">
          <span>Guardias completadas hoy</span>
          <span>
            {done}/{total}
          </span>
        </div>
        <div className="mt-2 h-5 overflow-hidden rounded-full bg-muted">
          <div
            className="gold-bg h-full rounded-full transition-all duration-500"
            style={{ width: `${total ? (done / total) * 100 : 0}%` }}
          />
        </div>
        <p className="mt-3 flex items-center gap-2 font-display font-extrabold text-coral">
          <span aria-hidden="true">🔥</span>
          {streak === 0
            ? "Completa el 85% para iniciar tu racha"
            : `${streak} ${streak === 1 ? "día" : "días"} de racha navegando`}
        </p>
      </div>

      {dayComplete && <Confetti pieces={60} />}

      {total === 0 && (
        <p className="rounded-3xl border-4 border-ink/15 bg-card/95 p-6 text-center font-display text-xl font-extrabold">
          El Rey Pirata aún no ha creado tareas para el barco.
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {blocks.map((block) => {
          const blockTasks = tasks.filter((t) => t.block === block);
          if (blockTasks.length === 0) return null;
          const Icon = BLOCK_META[block].icon;
          return (
            <section
              key={block}
              className="rounded-3xl border-4 border-ink/15 bg-card/95 p-4 float-card"
            >
              <header
                className={`mb-4 flex items-center gap-3 rounded-2xl px-4 py-3 ${BLOCK_META[block].tone}`}
              >
                <Icon className="size-8" />
                <h2 className="font-display text-2xl font-extrabold">{BLOCK_LABELS[block]}</h2>
              </header>

              <ul className="space-y-3">
                {blockTasks.map((task) => {
                  const checked = progress.tasksDone.includes(task.id);
                  const TaskIcon = getTaskIcon(task.icon);
                  return (
                    <li key={task.id} className="relative">
                      <button
                        type="button"
                        onClick={() => void handle(task.id, task.value)}
                        aria-pressed={checked}
                        className={`chunky flex w-full items-center gap-3 rounded-2xl border-4 px-4 py-4 text-left transition-colors ${
                          checked
                            ? "border-leaf bg-leaf/15"
                            : "border-ink/10 bg-secondary hover:bg-muted"
                        }`}
                      >
                        <span
                          className={`flex size-12 shrink-0 items-center justify-center rounded-xl border-4 ${
                            checked
                              ? "border-leaf bg-leaf text-leaf-foreground"
                              : "border-ink/20 bg-card"
                          }`}
                        >
                          {checked ? <Check className="size-8" strokeWidth={4} /> : null}
                        </span>
                        <TaskIcon className="size-8 shrink-0 text-primary" />
                        <span className="flex-1">
                          <span
                            className={`block font-display text-xl font-extrabold ${
                              checked ? "text-muted-foreground line-through" : ""
                            }`}
                          >
                            {task.label}
                          </span>
                          <span className="font-display text-sm font-extrabold text-muted-foreground">
                            +{task.value} Doblones
                          </span>
                        </span>
                      </button>

                      {celebrating === task.id && (
                        <span className="animate-celebrate pointer-events-none absolute -top-2 right-4 flex items-center gap-1 rounded-full bg-gold px-3 py-1 font-display text-lg font-extrabold text-gold-foreground">
                          <Sparkles className="size-5" /> +{task.value}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      {message && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full border-4 border-ink/20 bg-card px-6 py-3 font-display text-xl font-extrabold float-card lg:bottom-8"
        >
          {message}
        </div>
      )}
    </PirateShell>
  );
}
