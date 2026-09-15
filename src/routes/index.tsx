import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Sunrise, Sun, Moon, Sparkles } from "lucide-react";
import { PirateShell } from "@/components/PirateShell";
import { useCaptain, TASK_REWARD } from "@/lib/captain-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mi Barco — El Diario del Capitán" },
      {
        name: "description",
        content:
          "Rutinas diarias de mañana, tarde y noche para jóvenes piratas. Completa tareas y gana Berries.",
      },
      { property: "og:title", content: "Mi Barco — El Diario del Capitán" },
      {
        property: "og:description",
        content: "Completa tus tareas de pirata y gana Berries para tu tiempo de juego.",
      },
    ],
  }),
  component: MiBarco,
});

const BLOCKS = [
  {
    id: "manana",
    title: "Mañana",
    icon: Sunrise,
    tone: "bg-gold text-gold-foreground",
    tasks: [
      { id: "cama", label: "Hacer la cama", emoji: "🛏️" },
      { id: "dientes-m", label: "Lavarse los dientes", emoji: "🪥" },
      { id: "vestir", label: "Vestirse solo", emoji: "👕" },
      { id: "mochila", label: "Mochila lista", emoji: "🎒" },
    ],
  },
  {
    id: "tarde",
    title: "Tarde",
    icon: Sun,
    tone: "bg-coral text-coral-foreground",
    tasks: [
      { id: "deberes", label: "Hacer los deberes", emoji: "📚" },
      { id: "merienda", label: "Recoger la merienda", emoji: "🍎" },
      { id: "juguetes", label: "Ordenar los juguetes", emoji: "🧸" },
    ],
  },
  {
    id: "noche",
    title: "Noche",
    icon: Moon,
    tone: "bg-sea text-sea-foreground",
    tasks: [
      { id: "ducha", label: "Ducha de marinero", emoji: "🚿" },
      { id: "dientes-n", label: "Lavarse los dientes", emoji: "🦷" },
      { id: "ropa", label: "Ropa de mañana preparada", emoji: "🧺" },
      { id: "lectura", label: "Leer un poquito", emoji: "📖" },
    ],
  },
] as const;

function MiBarco() {
  const { state, toggleTask } = useCaptain();
  const [celebrating, setCelebrating] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const total = BLOCKS.reduce((n, b) => n + b.tasks.length, 0);
  const done = state.tasksDone.length;

  function handle(id: string) {
    const result = toggleTask(id);
    if (result === "earned") {
      setCelebrating(id);
      setMessage(`¡+${TASK_REWARD} Berries, grumete!`);
      setTimeout(() => setCelebrating(null), 900);
      setTimeout(() => setMessage(null), 1600);
    } else if (result === "limit") {
      setMessage("¡Ya llegaste al límite de la semana! 🏴‍☠️");
      setTimeout(() => setMessage(null), 2200);
    }
  }

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
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {BLOCKS.map((block) => {
          const Icon = block.icon;
          return (
            <section
              key={block.id}
              className="rounded-3xl border-4 border-ink/15 bg-card/95 p-4 float-card"
            >
              <header
                className={`mb-4 flex items-center gap-3 rounded-2xl px-4 py-3 ${block.tone}`}
              >
                <Icon className="size-8" />
                <h2 className="font-display text-2xl font-extrabold">{block.title}</h2>
              </header>

              <ul className="space-y-3">
                {block.tasks.map((task) => {
                  const checked = state.tasksDone.includes(task.id);
                  return (
                    <li key={task.id} className="relative">
                      <button
                        type="button"
                        onClick={() => handle(task.id)}
                        aria-pressed={checked}
                        className={`chunky flex w-full items-center gap-4 rounded-2xl border-4 px-4 py-4 text-left transition-colors ${
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
                        <span className="text-2xl">{task.emoji}</span>
                        <span
                          className={`font-display text-xl font-extrabold ${
                            checked ? "text-muted-foreground line-through" : ""
                          }`}
                        >
                          {task.label}
                        </span>
                      </button>

                      {celebrating === task.id && (
                        <span className="animate-celebrate pointer-events-none absolute -top-2 right-4 flex items-center gap-1 rounded-full bg-gold px-3 py-1 font-display text-lg font-extrabold text-gold-foreground">
                          <Sparkles className="size-5" /> +{TASK_REWARD}
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
