import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Calculator, Languages, Sparkles } from "lucide-react";
import { PirateShell } from "@/components/PirateShell";
import { useCaptain, TRAINING_REWARD } from "@/lib/captain-store";

export const Route = createFileRoute("/entrenamiento")({
  head: () => ({
    meta: [
      { title: "Entrenamiento — El Diario del Capitán" },
      {
        name: "description",
        content:
          "Minijuegos de matemáticas, inglés y comprensión lectora para ganar Berries extra.",
      },
      { property: "og:title", content: "Entrenamiento — El Diario del Capitán" },
      {
        property: "og:description",
        content: "Matemáticas del Cocinero, flashcards de inglés y lectura de bitácora.",
      },
    ],
  }),
  component: Entrenamiento,
});

type Zone = "menu" | "mates" | "ingles" | "lectura";

function Entrenamiento() {
  const [zone, setZone] = useState<Zone>("menu");
  const [toast, setToast] = useState<string | null>(null);
  const { earn } = useCaptain();

  function reward() {
    const granted = earn(TRAINING_REWARD);
    setToast(
      granted > 0
        ? `¡+${granted} Berries de entrenamiento!`
        : "¡Límite semanal alcanzado, capitán!",
    );
    setTimeout(() => setToast(null), 2200);
  }

  return (
    <PirateShell title="Entrenamiento" subtitle="Gana Berries extra superando retos">
      {zone === "menu" ? (
        <div className="grid gap-5 md:grid-cols-3">
          <ZoneCard
            title="Matemáticas del Cocinero"
            emoji="🍳"
            icon={Calculator}
            tone="bg-coral text-coral-foreground"
            desc="Sumas y restas para repartir el rancho"
            onClick={() => setZone("mates")}
          />
          <ZoneCard
            title="Inglés de Navegación"
            emoji="🗺️"
            icon={Languages}
            tone="bg-sea text-sea-foreground"
            desc="Voltea tarjetas y aprende vocabulario"
            onClick={() => setZone("ingles")}
          />
          <ZoneCard
            title="Lectura de Bitácora"
            emoji="📜"
            icon={BookOpen}
            tone="bg-leaf text-leaf-foreground"
            desc="Lee la aventura y responde"
            onClick={() => setZone("lectura")}
          />
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => setZone("menu")}
            className="chunky mb-4 flex items-center gap-2 rounded-2xl border-4 border-ink/15 bg-card px-4 py-2 font-display text-lg font-extrabold"
          >
            <ArrowLeft className="size-6" /> Volver
          </button>
          {zone === "mates" && <MathGame onWin={reward} />}
          {zone === "ingles" && <Flashcards onWin={reward} />}
          {zone === "lectura" && <Reading onWin={reward} />}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full border-4 border-ink/20 bg-gold px-6 py-3 font-display text-xl font-extrabold text-gold-foreground float-card lg:bottom-8">
          {toast}
        </div>
      )}
    </PirateShell>
  );
}

function ZoneCard({
  title,
  desc,
  emoji,
  tone,
  icon: Icon,
  onClick,
}: {
  title: string;
  desc: string;
  emoji: string;
  tone: string;
  icon: typeof Calculator;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="chunky rounded-3xl border-4 border-ink/15 bg-card/95 p-6 text-left float-card"
    >
      <div className={`mb-4 flex items-center gap-3 rounded-2xl px-4 py-3 ${tone}`}>
        <Icon className="size-8" />
        <span className="text-3xl">{emoji}</span>
      </div>
      <h2 className="font-display text-2xl font-extrabold">{title}</h2>
      <p className="font-bold text-muted-foreground">{desc}</p>
      <p className="mt-3 font-display text-lg font-extrabold text-primary">
        +{TRAINING_REWARD} Berries
      </p>
    </button>
  );
}

function newOperation() {
  const isSum = Math.random() > 0.45;
  let a = Math.floor(Math.random() * 20) + 5;
  let b = Math.floor(Math.random() * 12) + 2;
  if (!isSum && b > a) [a, b] = [b, a];
  const answer = isSum ? a + b : a - b;
  const options = new Set<number>([answer]);
  while (options.size < 3) {
    const delta = Math.floor(Math.random() * 7) - 3;
    const candidate = answer + (delta === 0 ? 4 : delta);
    if (candidate >= 0) options.add(candidate);
  }
  return {
    text: `${a} ${isSum ? "+" : "−"} ${b}`,
    answer,
    options: [...options].sort(() => Math.random() - 0.5),
  };
}

function MathGame({ onWin }: { onWin: () => void }) {
  const [op, setOp] = useState(newOperation);
  const [status, setStatus] = useState<"idle" | "ok" | "fail">("idle");

  function choose(value: number) {
    if (status !== "idle") return;
    if (value === op.answer) {
      setStatus("ok");
      onWin();
    } else {
      setStatus("fail");
    }
    setTimeout(() => {
      setOp(newOperation());
      setStatus("idle");
    }, 1400);
  }

  return (
    <section className="rounded-3xl border-4 border-ink/15 bg-card/95 p-6 text-center float-card">
      <h2 className="font-display text-2xl font-extrabold">Matemáticas del Cocinero 🍳</h2>
      <p className="font-bold text-muted-foreground">¿Cuántas raciones salen?</p>
      <p className="parchment-bg mx-auto my-6 w-fit rounded-3xl border-4 border-ink/20 px-10 py-5 font-display text-6xl font-extrabold text-parchment-foreground">
        {op.text} = ?
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        {op.options.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => choose(value)}
            className={`chunky rounded-3xl border-4 py-8 font-display text-4xl font-extrabold ${
              status !== "idle" && value === op.answer
                ? "border-leaf bg-leaf text-leaf-foreground"
                : "border-ink/15 bg-secondary"
            }`}
          >
            {value}
          </button>
        ))}
      </div>
      {status === "ok" && (
        <p className="mt-5 flex items-center justify-center gap-2 font-display text-2xl font-extrabold text-leaf">
          <Sparkles className="size-7" /> ¡Correcto, cocinero!
        </p>
      )}
      {status === "fail" && (
        <p className="mt-5 font-display text-2xl font-extrabold text-primary">
          ¡Casi! Prueba con la siguiente 💪
        </p>
      )}
    </section>
  );
}

const CARDS = [
  {
    en: "to sail",
    es: "navegar",
    cat: "Verbo",
    tone: "bg-primary text-primary-foreground",
    tip: "Suena como 'seil'... ¡la vela (sail) del barco!",
  },
  {
    en: "map",
    es: "mapa",
    cat: "Objeto",
    tone: "bg-sea text-sea-foreground",
    tip: "Map y mapa son casi gemelos.",
  },
  {
    en: "to find",
    es: "encontrar",
    cat: "Verbo",
    tone: "bg-primary text-primary-foreground",
    tip: "Find = fin de la búsqueda.",
  },
  {
    en: "treasure",
    es: "tesoro",
    cat: "Objeto",
    tone: "bg-sea text-sea-foreground",
    tip: "Trea-SURE: ¡seguro que hay oro!",
  },
  {
    en: "brave",
    es: "valiente",
    cat: "Adjetivo",
    tone: "bg-leaf text-leaf-foreground",
    tip: "Un BRAVO pirata es brave.",
  },
  {
    en: "island",
    es: "isla",
    cat: "Lugar",
    tone: "bg-gold text-gold-foreground",
    tip: "IS-LAND: es tierra en medio del mar.",
  },
];

function Flashcards({ onWin }: { onWin: () => void }) {
  const [flipped, setFlipped] = useState<string[]>([]);
  const [rewarded, setRewarded] = useState(false);

  function flip(en: string) {
    if (flipped.includes(en)) {
      setFlipped(flipped.filter((f) => f !== en));
      return;
    }
    const next = [...flipped, en];
    setFlipped(next);
    if (!rewarded && next.length >= 5) {
      setRewarded(true);
      onWin();
    }
  }

  return (
    <section className="rounded-3xl border-4 border-ink/15 bg-card/95 p-6 float-card">
      <h2 className="font-display text-2xl font-extrabold">Inglés de Navegación 🗺️</h2>
      <p className="font-bold text-muted-foreground">
        Voltea 5 tarjetas para ganar {TRAINING_REWARD} Berries ({flipped.length}/5)
      </p>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {CARDS.map((card) => {
          const isFlipped = flipped.includes(card.en);
          return (
            <button
              key={card.en}
              type="button"
              onClick={() => flip(card.en)}
              className="flip-scene h-52 w-full"
            >
              <div className={`flip-inner relative h-full w-full ${isFlipped ? "flipped" : ""}`}>
                <div
                  className={`flip-face absolute inset-0 flex flex-col items-center justify-center rounded-3xl border-4 border-ink/20 p-4 ${card.tone}`}
                >
                  <span className="rounded-full bg-black/15 px-3 py-1 text-xs font-extrabold uppercase">
                    {card.cat}
                  </span>
                  <p className="mt-3 font-display text-4xl font-extrabold">{card.en}</p>
                  <p className="mt-2 text-sm font-bold opacity-90">¡Tócame!</p>
                </div>
                <div
                  className={`flip-face flip-back absolute inset-0 flex flex-col items-center justify-center rounded-3xl border-4 border-ink/20 p-4 ${card.tone}`}
                >
                  <p className="font-display text-4xl font-extrabold">{card.es}</p>
                  <p className="mt-3 rounded-2xl bg-black/15 px-3 py-2 text-center text-sm font-bold">
                    💡 {card.tip}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

const STORIES = [
  {
    text: "El capitán Luffy zarpó al amanecer con tres barriles de manzanas. Una tormenta rompió el mástil pequeño, pero la tripulación lo arregló con cuerdas. Al anochecer llegaron a la Isla de las Palmeras.",
    question: "La tripulación arregló el mástil con cuerdas.",
    answer: true,
  },
  {
    text: "Nami dibujó un mapa nuevo con tinta azul de calamar. Guardó el mapa dentro de una botella de cristal. El loro Zoro se la llevó volando hasta el nido del acantilado.",
    question: "Nami dibujó el mapa con tinta roja.",
    answer: false,
  },
];

function Reading({ onWin }: { onWin: () => void }) {
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<"idle" | "ok" | "fail">("idle");
  const story = useMemo(() => STORIES[index % STORIES.length]!, [index]);

  function respond(value: boolean) {
    if (status !== "idle") return;
    if (value === story.answer) {
      setStatus("ok");
      onWin();
    } else {
      setStatus("fail");
    }
    setTimeout(() => {
      setStatus("idle");
      setIndex((i) => i + 1);
    }, 1800);
  }

  return (
    <section className="rounded-3xl border-4 border-ink/15 bg-card/95 p-6 float-card">
      <h2 className="font-display text-2xl font-extrabold">Lectura de Bitácora 📜</h2>
      <p className="parchment-bg mt-4 rounded-3xl border-4 border-ink/20 p-6 font-display text-2xl leading-relaxed font-bold text-parchment-foreground">
        {story.text}
      </p>
      <p className="mt-5 font-display text-2xl font-extrabold">{story.question}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => respond(true)}
          className="chunky rounded-3xl border-4 border-ink/15 bg-leaf py-6 font-display text-3xl font-extrabold text-leaf-foreground"
        >
          Verdadero
        </button>
        <button
          type="button"
          onClick={() => respond(false)}
          className="chunky rounded-3xl border-4 border-ink/15 bg-primary py-6 font-display text-3xl font-extrabold text-primary-foreground"
        >
          Falso
        </button>
      </div>
      {status === "ok" && (
        <p className="mt-5 font-display text-2xl font-extrabold text-leaf">
          ¡Muy bien leído, capitán!
        </p>
      )}
      {status === "fail" && (
        <p className="mt-5 font-display text-2xl font-extrabold text-primary">
          Casi… lee otra vez con calma 🧐
        </p>
      )}
    </section>
  );
}
