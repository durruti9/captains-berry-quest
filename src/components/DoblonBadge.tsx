import { Coins } from "lucide-react";
import { useCaptain, WEEKLY_LIMIT, chestAvailable } from "@/lib/captain-store";

export function DoblonBadge() {
  const { progress, activeKid } = useCaptain();
  return (
    <div className="gold-bg flex items-center gap-3 rounded-2xl border-4 border-ink/20 px-4 py-2 float-card">
      <span className="text-3xl">{activeKid?.avatar ?? "🏴‍☠️"}</span>
      <Coins className="size-7 text-gold-foreground" />
      <div className="leading-none">
        <p className="font-display text-2xl font-extrabold text-gold-foreground">
          {chestAvailable(progress)}
        </p>
        <p className="text-[11px] font-bold text-gold-foreground/80">
          Doblones · semana {progress.weeklyEarned}/{WEEKLY_LIMIT}
        </p>
      </div>
    </div>
  );
}
