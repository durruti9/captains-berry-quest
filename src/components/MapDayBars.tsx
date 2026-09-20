import { Check, PartyPopper } from "lucide-react";
import type { MapDayStats } from "@/lib/captain-shared";

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function barColor(day: MapDayStats) {
  if (day.weekend) return "bg-gold";
  if (day.pct >= 85) return "bg-leaf";
  if (day.pct >= 50) return "bg-coral";
  return "bg-destructive";
}

export function MapDayBars({ days }: { days: MapDayStats[] }) {
  return (
    <div className="mt-4 grid grid-cols-7 gap-2" aria-label="Progreso diario de la semana">
      {days.map((day) => {
        const date = new Date(`${day.day}T12:00:00Z`);
        return (
          <div
            key={day.day}
            className={`min-w-0 rounded-xl border-2 p-2 text-center ${
              day.weekend ? "border-gold bg-gold/20" : "border-ink/15 bg-card/70"
            }`}
          >
            <p className="font-display text-xs font-extrabold sm:text-sm">
              {DAY_NAMES[date.getUTCDay()]}
            </p>
            <p className="text-xs font-bold text-muted-foreground">{date.getUTCDate()}</p>
            <div className="mt-2 flex h-20 items-end overflow-hidden rounded-lg border-2 border-ink/15 bg-secondary">
              <div
                className={`w-full transition-all duration-500 ${barColor(day)}`}
                style={{ height: `${day.weekend ? 100 : day.pct}%` }}
              />
            </div>
            {day.weekend ? (
              <p className="mt-2 flex min-h-8 items-center justify-center gap-1 font-display text-xs font-extrabold text-gold-foreground">
                <PartyPopper className="size-3 shrink-0" /> Festivo
              </p>
            ) : (
              <p className="mt-2 min-h-8 font-display text-xs font-extrabold">
                {day.done}/{day.expected}
                {day.fulfilled && <Check className="mx-auto size-4 text-leaf" />}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}