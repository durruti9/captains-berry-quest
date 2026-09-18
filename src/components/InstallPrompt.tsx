import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Muestra un botón "Instalar app" cuando Android/Chrome ofrece la instalación.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    function onPrompt(event: Event) {
      event.preventDefault();
      setDeferred(event as InstallEvent);
    }
    function onInstalled() {
      setDeferred(null);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!deferred || hidden) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[60] mx-auto flex max-w-md items-center gap-3 rounded-3xl border-4 border-ink/20 bg-card/95 p-3 shadow-lg backdrop-blur">
      <span className="text-3xl">🏴‍☠️</span>
      <p className="flex-1 font-display text-base leading-5 font-extrabold">
        Instala el Diario en tu tablet o móvil
      </p>
      <button
        type="button"
        onClick={() => {
          const event = deferred;
          setDeferred(null);
          void event.prompt();
        }}
        className="chunky flex items-center gap-2 rounded-2xl border-4 border-ink/20 bg-primary px-4 py-2 font-display text-base font-extrabold text-primary-foreground"
      >
        <Download className="size-5" /> Instalar
      </button>
      <button
        type="button"
        aria-label="Cerrar"
        onClick={() => setHidden(true)}
        className="rounded-full p-1 text-muted-foreground"
      >
        <X className="size-5" />
      </button>
    </div>
  );
}
