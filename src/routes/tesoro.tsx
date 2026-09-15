import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Gamepad2, Minus, Plus } from "lucide-react";
import { PirateShell } from "@/components/PirateShell";
import { useCaptain, WEEKLY_LIMIT } from "@/lib/captain-store";

export const Route = createFileRoute("/tesoro")({
  head: () => ({
    meta: [
      { title: "El Tesoro — El Diario del Capitán" },
      {
        name: "description",
        content:
          "Consulta tu cofre de Berries y canjea minutos de videojuegos con el límite semanal de 240.",
      },
      { property: "og:title", content: "El Tesoro — El Diario del Capitán" },
      {
        property: "og:description",
        content: "Cofre de Berries, progreso semanal y canje de tiempo de consola.",
      },
    ],
  }),
  component: Tesoro,
});

function Tesoro() {
  const { state, spend } = useCaptain();
  const [amount, setAmount] = useState(15);
  const [feedback, setFeedback] = useState<string | null>(null);

  const pct = Math.min(100, (state.weeklyEarned / WEEKLY_LIMIT) * 100);

  function canjear() {
    if (amount <= 0) {
      setFeedback("Escribe cuántos Berries quieres gastar.");
      return;
    }
    if (spend(amount)) {
      setFeedback(`¡Cedidos ${amount} Berries! Tienes ${amount} minutos de consola. 🎮`);
      setAmount(15);
    } else {
      setFeedback("No tienes suficientes Berries en el cofre. ¡A por más tareas!");
    }
    setTimeout(() => setFeedback(null), 3500);
  }

  return (
    <PirateShell title="El Tesoro" subtitle="1 Berry = 1 minuto de videojuegos">
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="parchment-bg rounded-3xl border-4 border-ink/20 p-6 text-center float-card">
          <p className="font-display text-xl font-extrabold text-parchment-foreground">
            Tu cofre del tesoro
          </p>
          <div className="animate-bob my-4 text-[90px] leading-none">🧰</div>
          <p className="gold-bg mx-auto w-fit rounded-3xl border-4 border-ink/20 px-8 py-3 font-display text-6xl font-extrabold text-gold-foreground">
            {state.balance}
          </p>
          <p className="mt-3 font-display text-2xl font-extrabold text-parchment-foreground">
            Berries = {state.balance} minutos
          </p>
        </section>

        <div className="space-y-5">
          <section className="rounded-3xl border-4 border-ink/15 bg-card/95 p-6 float-card">
            <h2 className="font-display text-2xl font-extrabold">Botín de esta semana</h2>
            <p className="text-sm font-bold text-muted-foreground">
              Máximo {WEEKLY_LIMIT} Berries por semana
            </p>
            <div className="mt-4 h-8 overflow-hidden rounded-full border-4 border-ink/15 bg-muted">
              <div
                className="gold-bg flex h-full items-center justify-end rounded-full pr-3 font-display text-sm font-extrabold text-gold-foreground transition-all duration-700"
                style={{ width: `${Math.max(pct, 8)}%` }}
              >
                {state.weeklyEarned}
              </div>
            </div>
            <p className="mt-3 font-display text-lg font-extrabold">
              Te quedan {Math.max(0, WEEKLY_LIMIT - state.weeklyEarned)} Berries por ganar
            </p>
          </section>

          <section className="rounded-3xl border-4 border-ink/15 bg-card/95 p-6 float-card">
            <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold">
              <Gamepad2 className="size-7 text-primary" /> Ceder Berries a la Marina
            </h2>
            <p className="text-sm font-bold text-muted-foreground">
              ¿Cuántos minutos quieres jugar hoy?
            </p>

            <div className="mt-4 flex items-center justify-center gap-4">
              <button
                type="button"
                aria-label="Quitar 5 Berries"
                onClick={() => setAmount((a) => Math.max(0, a - 5))}
                className="chunky flex size-14 items-center justify-center rounded-2xl border-4 border-ink/15 bg-secondary"
              >
                <Minus className="size-7" strokeWidth={3} />
              </button>
              <input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                className="w-36 rounded-2xl border-4 border-ink/15 bg-background py-3 text-center font-display text-4xl font-extrabold"
              />
              <button
                type="button"
                aria-label="Añadir 5 Berries"
                onClick={() => setAmount((a) => a + 5)}
                className="chunky flex size-14 items-center justify-center rounded-2xl border-4 border-ink/15 bg-secondary"
              >
                <Plus className="size-7" strokeWidth={3} />
              </button>
            </div>

            <button
              type="button"
              onClick={canjear}
              className="chunky mt-5 w-full rounded-2xl border-4 border-ink/20 bg-primary py-4 font-display text-2xl font-extrabold text-primary-foreground"
            >
              Canjear Tiempo
            </button>

            <p className="mt-3 text-center font-display text-lg font-extrabold text-muted-foreground">
              Te quedarían {Math.max(0, state.balance - amount)} Berries
            </p>

            {feedback && (
              <p className="mt-3 rounded-2xl bg-secondary p-3 text-center font-display text-lg font-extrabold">
                {feedback}
              </p>
            )}
          </section>
        </div>
      </div>
    </PirateShell>
  );
}
