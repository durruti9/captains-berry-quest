import { Link } from "@tanstack/react-router";
import { Ship, Coins, Swords, Map as MapIcon, Anchor } from "lucide-react";
import type { ReactNode } from "react";
import { BerryBadge } from "./BerryBadge";

const TABS = [
  { to: "/", label: "Mi Barco", icon: Ship },
  { to: "/tesoro", label: "El Tesoro", icon: Coins },
  { to: "/entrenamiento", label: "Entrenamiento", icon: Swords },
  { to: "/mapa", label: "Gran Mapa", icon: MapIcon },
] as const;

export function PirateShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="sea-bg min-h-screen">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <nav className="order-2 flex shrink-0 gap-2 border-t-4 border-ink/20 bg-card/90 p-2 backdrop-blur lg:order-1 lg:w-56 lg:flex-col lg:border-t-0 lg:border-r-4 lg:p-4">
          <div className="hidden items-center gap-2 px-2 pb-4 lg:flex">
            <Anchor className="size-8 text-primary" />
            <span className="font-display text-xl leading-5 font-extrabold text-foreground">
              Diario del Capitán
            </span>
          </div>
          {TABS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              activeProps={{
                className: "bg-primary text-primary-foreground border-ink/25",
              }}
              inactiveProps={{
                className: "bg-secondary text-secondary-foreground border-transparent",
              }}
              className="flex flex-1 flex-col items-center gap-1 rounded-2xl border-4 px-3 py-3 text-center font-display text-sm font-extrabold transition-transform hover:scale-[1.03] lg:flex-row lg:gap-3 lg:text-left lg:text-base"
            >
              <Icon className="size-7 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <main className="order-1 flex-1 overflow-x-hidden lg:order-2">
          <header className="flex flex-wrap items-center justify-between gap-4 px-5 pt-5 pb-3 lg:px-8">
            <div>
              <h1 className="font-display text-3xl font-extrabold text-sea-foreground drop-shadow-md lg:text-4xl">
                {title}
              </h1>
              <p className="font-bold text-sea-foreground/85">{subtitle}</p>
            </div>
            <BerryBadge />
          </header>
          <div className="px-5 pb-8 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
