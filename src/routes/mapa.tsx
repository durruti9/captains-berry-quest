import { createFileRoute } from "@tanstack/react-router";
import { Ship } from "lucide-react";
import { PirateShell } from "@/components/PirateShell";
import { KidGuard } from "@/components/KidGuard";
import { Confetti } from "@/components/Confetti";
import { MapDayBars } from "@/components/MapDayBars";
import { useCaptain } from "@/lib/captain-store";
import {
  WEEKLY_GOAL_PCT,
  mapWeekStats,
  monthMapWeeks,
  weekFulfilled,
} from "@/lib/captain-shared";

export const Route = createFileRoute("/mapa")({
  head: () => ({
    meta: [
      { title: "El Gran Mapa — El Diario del Capitán" },
      {
        name: "description",
        content:
          "Mapa del tesoro mensual: llena los cofres de las 4 semanas con tus tareas y encuentra el tesoro legendario.",
      },
      { property: "og:title", content: "El Gran Mapa — El Diario del Capitán" },
      {
        property: "og:description",
        content: "Llena los cofres de las 4 semanas del mes y reclama el tesoro legendario.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <KidGuard>
      <GranMapa />
    </KidGuard>
  ),
});

const GOAL_LABEL = `Cumple al menos el ${WEEKLY_GOAL_PCT}% de lunes a viernes; el fin de semana es festivo`;

function GranMapa() {
  const { progress, tasks } = useCaptain();
  const now = new Date();
  const weeks = monthMapWeeks(now.getFullYear(), now.getMonth());
  const today = now.toISOString().slice(0, 10);
  const stats = weeks.map((w) => mapWeekStats(progress, tasks, w, today));
  const fulfilled = weeks.map((w, i) => weekFulfilled(progress, stats[i]!, w.key));
  const complete = fulfilled.every(Boolean);

  return (
    <PirateShell
      title="El Gran Mapa"
      subtitle="Llena los cofres de las 4 semanas = tesoro legendario"
    >
      {complete && <Confetti />}

      <div className="parchment-bg rounded-[2rem] border-8 border-ink/25 p-6 float-card">
        <h2 className="text-center font-display text-3xl font-extrabold text-parchment-foreground">
          Mapa del Tesoro Mensual
        </h2>
        <p className="mt-2 text-center font-bold text-parchment-foreground/70">{GOAL_LABEL}</p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {weeks.map((w, i) => {
            const st = stats[i]!;
            const ok = fulfilled[i]!;
            const extra = progress.mapApprovals[w.key];
            return (
              <div
                key={w.key}
                className={`relative rounded-3xl border-4 border-dashed border-ink/40 p-5 ${
                  ok ? "border-solid bg-gold/40" : "bg-card/40"
                }`}
              >
                <span className="absolute top-3 left-4 font-display text-lg font-extrabold text-parchment-foreground">
                  Semana {i + 1}
                </span>
                <MapDayBars days={st.days} />
                {ok ? (
                  <div className="animate-stamp mt-4 flex justify-center">
                    <span className="rounded-xl border-4 border-primary px-4 py-1 font-display text-xl font-extrabold text-primary">
                      OBJETIVO CUMPLIDO
                    </span>
                  </div>
                ) : extra ? (
                  <div className="mt-4 rounded-2xl border-4 border-ink/15 bg-card/95 p-3">
                    <p className="font-display text-sm font-extrabold">
                      Tareas extra indicadas por el Rey Pirata:
                    </p>
                    <p className="mt-1 text-sm font-bold whitespace-pre-line">{extra}</p>
                  </div>
                ) : (
                  <p className="mt-4 text-center font-display text-sm font-extrabold text-muted-foreground">
                    {st.expected === 0 ? "Aún sin tareas" : `Te faltan tareas esta semana`}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {complete && (
        <div className="mt-6 rounded-3xl border-4 border-ink/20 bg-card/95 p-8 text-center float-card">
          <p className="animate-wobble font-display text-4xl font-extrabold text-primary lg:text-5xl">
            ¡HAS ENCONTRADO EL TESORO LEGENDARIO!
          </p>
          <p className="mt-4 font-display text-2xl font-extrabold">
            Reclama tu figura al Capitán (Papi) 🏴‍☠️
          </p>
        </div>
      )}

      {!complete && (
        <div className="mt-6 flex items-center justify-center gap-3 text-center">
          <Ship className="size-6 text-primary" />
          <p className="font-display text-lg font-extrabold text-muted-foreground">
            Si una semana se te resiste, el Rey Pirata puede aprobarla con tareas extra desde su
            Zona.
          </p>
        </div>
      )}
    </PirateShell>
  );
}
