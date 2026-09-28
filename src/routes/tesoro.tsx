import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Coins, Gamepad2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PirateShell } from "@/components/PirateShell";
import { KidGuard } from "@/components/KidGuard";
import { useCaptain, chestAvailable } from "@/lib/captain-store";

export const Route = createFileRoute("/tesoro")({
  head: () => ({
    meta: [
      { title: "El Tesoro — El Diario del Capitán" },
      {
        name: "description",
        content:
          "Consulta tu cofre de Doblones y canjea minutos de videojuegos con el tope de 1 hora al día.",
      },
      { property: "og:title", content: "El Tesoro — El Diario del Capitán" },
      {
        property: "og:description",
        content: "Cofre de Doblones, progreso semanal y canje de tiempo de consola.",
      },
    ],
  }),
  component: () => (
    <KidGuard>
      <Tesoro />
    </KidGuard>
  ),
});

function Tesoro() {
  const { progress, redeem, transferToChest, dailyRedeemRemaining, settings } = useCaptain();
  const WEEKLY_LIMIT = settings.weeklyLimit;
  const step = settings.redeemStep;
  const maxRedeem = Math.min(chestAvailable(progress), dailyRedeemRemaining);
  const [amount, setAmount] = useState(15);
  const [transferAmount, setTransferAmount] = useState(15);
  const [transferBusy, setTransferBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [transferFeedback, setTransferFeedback] = useState<string | null>(null);

  const pct = Math.min(100, (progress.weeklyEarned / WEEKLY_LIMIT) * 100);

  async function canjear() {
    const result = await redeem(amount);
    setFeedback(
      result.ok
        ? `¡Cedidos ${amount} Doblones! Tienes ${amount} minutos de consola. 🎮`
        : (result.reason ?? "No se ha podido canjear."),
    );
    if (result.ok) setAmount(15);
    setTimeout(() => setFeedback(null), 3500);
  }

  async function rellenarCofre() {
    const requested = Math.floor(transferAmount);
    if (requested <= 0 || requested > progress.booty) {
      setTransferFeedback("Elige una cantidad disponible de tu botín.");
      return;
    }
    setTransferBusy(true);
    try {
      const result = await transferToChest(requested);
      setTransferFeedback(
        result.ok
          ? `¡${requested} Doblones han vuelto a tu cofre! 🪙`
          : (result.reason ?? "No se ha podido rellenar el cofre."),
      );
      if (result.ok) setTransferAmount(15);
    } finally {
      setTransferBusy(false);
      setTimeout(() => setTransferFeedback(null), 3500);
    }
  }

  return (
    <PirateShell title="El Tesoro" subtitle="1 Doblón = 1 minuto (máx. 1 hora al día)">
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="parchment-bg rounded-3xl border-4 border-ink/20 p-6 text-center float-card">
          <p className="font-display text-xl font-extrabold text-parchment-foreground">
            Tu cofre del tesoro
          </p>
          <p className="text-sm font-bold text-parchment-foreground/70">
            Los Doblones de esta semana (se resetea cada lunes)
          </p>
          <div className="animate-bob my-4 text-[90px] leading-none">🧰</div>
          <p className="gold-bg mx-auto w-fit rounded-3xl border-4 border-ink/20 px-8 py-3 font-display text-6xl font-extrabold text-gold-foreground">
            {chestAvailable(progress)}
          </p>
          <p className="mt-3 font-display text-2xl font-extrabold text-parchment-foreground">
            Doblones = {chestAvailable(progress)} minutos
          </p>
          <div className="mx-auto mt-5 w-fit rounded-3xl border-4 border-ink/20 bg-card/90 px-6 py-3">
            <p className="font-display text-lg font-extrabold text-muted-foreground">
              🏴‍☠️ Tu botín
            </p>
            <p className="font-display text-4xl font-extrabold text-primary">
              {progress.booty}
            </p>
            <p className="text-xs font-bold text-muted-foreground">
              Lo que has ido ahorrando semana a semana: nunca se pierde
            </p>
          </div>
        </section>

        <div className="space-y-5">
          <section className="rounded-3xl border-4 border-ink/15 bg-card/95 p-6 float-card">
            <h2 className="font-display text-2xl font-extrabold">Botín de esta semana</h2>
            <p className="text-sm font-bold text-muted-foreground">
              Máximo {WEEKLY_LIMIT} Doblones por semana
            </p>
            <div className="mt-4 h-8 overflow-hidden rounded-full border-4 border-ink/15 bg-muted">
              <div
                className="gold-bg flex h-full items-center justify-end rounded-full pr-3 font-display text-sm font-extrabold text-gold-foreground transition-all duration-700"
                style={{ width: `${Math.max(pct, 8)}%` }}
              >
                {progress.weeklyEarned}
              </div>
            </div>
            <p className="mt-3 font-display text-lg font-extrabold">
              Te quedan {Math.max(0, WEEKLY_LIMIT - progress.weeklyEarned)} Doblones por ganar
            </p>
          </section>

          <section className="rounded-3xl border-4 border-ink/15 bg-card/95 p-6 float-card">
            <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold">
              <Coins className="size-7 text-primary" /> Rellenar el cofre
            </h2>
            <p className="text-sm font-bold text-muted-foreground">
              Recupera cuando quieras Doblones de tu botín. Tienes {progress.booty} guardados.
            </p>

            <div className="mt-4 flex items-center justify-center gap-4">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                aria-label="Quitar 5 Doblones del traslado"
                onClick={() => setTransferAmount((value) => Math.max(0, value - 5))}
                disabled={progress.booty === 0 || transferBusy}
                className="chunky size-14 rounded-2xl border-4 border-ink/15"
              >
                <Minus className="size-7" strokeWidth={3} />
              </Button>
              <input
                type="number"
                min={0}
                max={progress.booty}
                step={1}
                aria-label="Doblones del botín para pasar al cofre"
                value={transferAmount}
                onChange={(event) =>
                  setTransferAmount(Math.min(progress.booty, Math.max(0, Number(event.target.value) || 0)))
                }
                disabled={progress.booty === 0 || transferBusy}
                className="w-36 rounded-2xl border-4 border-ink/15 bg-background py-3 text-center font-display text-4xl font-extrabold disabled:opacity-50"
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                aria-label="Añadir 5 Doblones al traslado"
                onClick={() =>
                  setTransferAmount((value) => Math.min(progress.booty, value + 5))
                }
                disabled={progress.booty === 0 || transferBusy}
                className="chunky size-14 rounded-2xl border-4 border-ink/15"
              >
                <Plus className="size-7" strokeWidth={3} />
              </Button>
            </div>

            <Button
              type="button"
              size="lg"
              onClick={() => void rellenarCofre()}
              disabled={progress.booty === 0 || transferAmount <= 0 || transferBusy}
              className="chunky mt-5 h-auto w-full rounded-2xl border-4 border-ink/20 py-4 font-display text-xl font-extrabold"
            >
              {progress.booty === 0 ? "Tu botín está vacío" : "Pasar al cofre"}
            </Button>

            {transferFeedback && (
              <p className="mt-3 rounded-2xl bg-secondary p-3 text-center font-display text-lg font-extrabold">
                {transferFeedback}
              </p>
            )}
          </section>

          <section className="rounded-3xl border-4 border-ink/15 bg-card/95 p-6 float-card">
            <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold">
              <Gamepad2 className="size-7 text-primary" /> Ceder Doblones a la Marina
            </h2>
            <p className="text-sm font-bold text-muted-foreground">
              {settings.dailyRedeemLimit > 0
                ? `Hoy te quedan ${dailyRedeemRemaining} de los ${settings.dailyRedeemLimit} minutos diarios`
                : "Puedes canjear los Doblones que tengas en el cofre"}
            </p>

            <div className="mt-4 flex items-center justify-center gap-4">
              <button
                type="button"
                aria-label={`Quitar ${step} Doblones`}
                onClick={() => setAmount((a) => Math.max(0, a - step))}
                className="chunky flex size-14 items-center justify-center rounded-2xl border-4 border-ink/15 bg-secondary"
              >
                <Minus className="size-7" strokeWidth={3} />
              </button>
              <input
                type="number"
                min={0}
                max={maxRedeem}
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                className="w-36 rounded-2xl border-4 border-ink/15 bg-background py-3 text-center font-display text-4xl font-extrabold"
              />
              <button
                type="button"
                aria-label={`Añadir ${step} Doblones`}
                onClick={() => setAmount((a) => Math.min(maxRedeem, a + step))}
                className="chunky flex size-14 items-center justify-center rounded-2xl border-4 border-ink/15 bg-secondary"
              >
                <Plus className="size-7" strokeWidth={3} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => void canjear()}
              className="chunky mt-5 w-full rounded-2xl border-4 border-ink/20 bg-primary py-4 font-display text-2xl font-extrabold text-primary-foreground"
            >
              Canjear Tiempo
            </button>

            <p className="mt-3 text-center font-display text-lg font-extrabold text-muted-foreground">
              Te quedarían {Math.max(0, chestAvailable(progress) - amount)} Doblones en el cofre
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
