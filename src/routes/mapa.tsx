import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, RotateCcw } from "lucide-react";
import { PirateShell } from "@/components/PirateShell";
import { KidGuard } from "@/components/KidGuard";
import { Confetti } from "@/components/Confetti";
import { useCaptain } from "@/lib/captain-store";

export const Route = createFileRoute("/mapa")({
  head: () => ({
    meta: [
      { title: "El Gran Mapa — El Diario del Capitán" },
      {
        name: "description",
        content:
          "Mapa del tesoro mensual con 4 semanas por sellar para conseguir el premio legendario.",
      },
      { property: "og:title", content: "El Gran Mapa — El Diario del Capitán" },
      {
        property: "og:description",
        content: "Sella las 4 semanas del mes y reclama el tesoro legendario.",
      },
    ],
  }),
  component: () => (
    <KidGuard>
      <GranMapa />
    </KidGuard>
  ),
});

const PIECES = ["🏝️", "⚓", "🧭", "💎"];

function GranMapa() {
  const { progress, stampWeek, resetMap } = useCaptain();
  const [askingPin, setAskingPin] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const complete = progress.mapStamps >= 4;

  function confirm() {
    if (pin.trim() !== "1234") {
      setError("Código incorrecto. Pídeselo al Capitán (Papi).");
      return;
    }
    stampWeek();
    setAskingPin(false);
    setPin("");
    setError(null);
  }

  return (
    <PirateShell title="El Gran Mapa" subtitle="4 semanas selladas = figura de premio">
      {complete && <Confetti />}

      <div className="parchment-bg rounded-[2rem] border-8 border-ink/25 p-6 float-card">
        <h2 className="text-center font-display text-3xl font-extrabold text-parchment-foreground">
          Mapa del Tesoro Mensual
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => {
            const filled = i < progress.mapStamps;
            return (
              <div
                key={i}
                className={`relative flex h-52 items-center justify-center rounded-3xl border-4 border-dashed border-ink/40 ${
                  filled ? "border-solid bg-gold/40" : "bg-card/40"
                }`}
              >
                <span className="absolute top-3 left-4 font-display text-lg font-extrabold text-parchment-foreground">
                  Semana {i + 1}
                </span>
                {filled ? (
                  <div className="animate-stamp flex flex-col items-center">
                    <span className="text-6xl">{PIECES[i]}</span>
                    <span className="mt-2 rounded-xl border-4 border-primary px-4 py-1 font-display text-xl font-extrabold text-primary">
                      CONSEGUIDO
                    </span>
                  </div>
                ) : (
                  <span className="font-display text-xl font-extrabold text-muted-foreground">
                    Casilla vacía
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {complete ? (
        <div className="mt-6 rounded-3xl border-4 border-ink/20 bg-card/95 p-8 text-center float-card">
          <p className="animate-wobble font-display text-4xl font-extrabold text-primary lg:text-5xl">
            ¡HAS ENCONTRADO EL TESORO LEGENDARIO!
          </p>
          <p className="mt-4 font-display text-2xl font-extrabold">
            Reclama tu figura al Capitán (Papi) 🏴‍☠️
          </p>
          <button
            type="button"
            onClick={resetMap}
            className="chunky mt-6 inline-flex items-center gap-2 rounded-2xl border-4 border-ink/15 bg-secondary px-6 py-3 font-display text-lg font-extrabold"
          >
            <RotateCcw className="size-6" /> Empezar un mes nuevo
          </button>
        </div>
      ) : (
        <div className="mt-6 text-center">
          {askingPin ? (
            <div className="mx-auto max-w-md rounded-3xl border-4 border-ink/20 bg-card/95 p-6 float-card">
              <p className="font-display text-xl font-extrabold">
                Código de Papi para sellar la semana
              </p>
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="mt-4 w-full rounded-2xl border-4 border-ink/15 bg-background py-3 text-center font-display text-3xl font-extrabold tracking-[0.5em]"
              />
              {error && <p className="mt-2 font-bold text-destructive">{error}</p>}
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAskingPin(false);
                    setPin("");
                    setError(null);
                  }}
                  className="chunky flex-1 rounded-2xl border-4 border-ink/15 bg-secondary py-3 font-display text-lg font-extrabold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirm}
                  className="chunky flex-1 rounded-2xl border-4 border-ink/20 bg-primary py-3 font-display text-lg font-extrabold text-primary-foreground"
                >
                  Sellar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAskingPin(true)}
              className="chunky inline-flex items-center gap-3 rounded-3xl border-4 border-ink/20 bg-primary px-10 py-5 font-display text-2xl font-extrabold text-primary-foreground"
            >
              <Lock className="size-7" /> Completar Semana
            </button>
          )}
        </div>
      )}
    </PirateShell>
  );
}
