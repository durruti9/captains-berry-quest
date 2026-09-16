import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useCaptain } from "@/lib/captain-store";

export function KidGuard({ children }: { children: ReactNode }) {
  const { ready, activeKid } = useCaptain();

  if (!ready) return <div className="sea-bg min-h-screen" />;

  if (!activeKid) {
    return (
      <div className="sea-bg flex min-h-screen items-center justify-center p-6">
        <div className="rounded-3xl border-4 border-ink/20 bg-card/95 p-8 text-center float-card">
          <p className="font-display text-2xl font-extrabold">Elige primero tu perfil, grumete</p>
          <Link
            to="/"
            className="chunky mt-5 inline-block rounded-2xl border-4 border-ink/20 bg-primary px-6 py-3 font-display text-xl font-extrabold text-primary-foreground"
          >
            Ir a los perfiles
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
