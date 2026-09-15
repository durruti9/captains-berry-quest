const COLORS = [
  "var(--gold)",
  "var(--coral)",
  "var(--sea)",
  "var(--leaf)",
  "var(--primary)",
];

export function Confetti({ pieces = 80 }: { pieces?: number }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from({ length: pieces }).map((_, i) => {
        const left = (i * 97) % 100;
        const delay = (i % 12) * 0.18;
        const duration = 2.6 + ((i * 7) % 20) / 10;
        const size = 8 + (i % 4) * 4;
        return (
          <span
            key={i}
            className="absolute top-0 rounded-[2px]"
            style={{
              left: `${left}%`,
              width: size,
              height: size * 1.6,
              backgroundColor: COLORS[i % COLORS.length],
              animation: `confetti-fall ${duration}s linear ${delay}s infinite`,
            }}
          />
        );
      })}
    </div>
  );
}
