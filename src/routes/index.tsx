import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Anchor, Crown, Lock } from "lucide-react";
import { useCaptain } from "@/lib/captain-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Perfiles — El Diario del Capitán" },
      {
        name: "description",
        content:
          "Elige tu perfil pirata: entra como Grumete a tus tareas o como Rey Pirata al panel de control.",
      },
      { property: "og:title", content: "Perfiles — El Diario del Capitán" },
      {
        property: "og:description",
        content: "Selección de perfiles de la tripulación y acceso del Rey Pirata.",
      },
    ],
  }),
  component: Inicio,
});

function Inicio() {
  const { ready, admin, kids, createAdmin, loginAdmin, enterKid } = useCaptain();
  const navigate = useNavigate();
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [askingAdmin, setAskingAdmin] = useState(false);

  if (!ready) return <div className="sea-bg min-h-screen" />;

  async function registrar() {
    if (user.trim().length < 3) return setError("El usuario necesita al menos 3 letras.");
    if (password.length < 4) return setError("La contraseña necesita al menos 4 caracteres.");
    if (password !== password2) return setError("Las contraseñas no coinciden.");
    const res = await createAdmin(user, password);
    if (!res.ok) return setError(res.reason ?? "No se ha podido crear el Rey Pirata.");
    setError(null);
    setPassword("");
    setPassword2("");
    navigate({ to: "/rey" });
  }

  async function entrarAdmin() {
    if (await loginAdmin(user, password)) {
      setError(null);
      setPassword("");
      navigate({ to: "/rey" });
    } else {
      setError("Contraseña incorrecta, impostor.");
    }
  }

  return (
    <div className="sea-bg flex min-h-screen flex-col items-center justify-center p-6">
      <div className="mb-8 flex items-center gap-3">
        <Anchor className="size-12 text-gold" />
        <h1 className="font-display text-4xl font-extrabold text-sea-foreground drop-shadow-md lg:text-5xl">
          El Diario del Capitán
        </h1>
      </div>

      {!admin ? (
        <section className="w-full max-w-md rounded-3xl border-4 border-ink/20 bg-card/95 p-6 float-card">
          <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold">
            <Crown className="size-8 text-gold" /> Da de alta al Rey Pirata
          </h2>
          <p className="font-bold text-muted-foreground">
            Crea el usuario y la contraseña del administrador.
          </p>
          <input
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="Usuario"
            className="mt-4 w-full rounded-2xl border-4 border-ink/15 bg-background px-4 py-3 font-display text-xl font-extrabold"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="mt-3 w-full rounded-2xl border-4 border-ink/15 bg-background px-4 py-3 font-display text-xl font-extrabold"
          />
          <input
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            placeholder="Repite la contraseña"
            className="mt-3 w-full rounded-2xl border-4 border-ink/15 bg-background px-4 py-3 font-display text-xl font-extrabold"
          />
          {error && <p className="mt-3 font-bold text-destructive">{error}</p>}
          <button
            type="button"
            onClick={() => void registrar()}
            className="chunky mt-5 w-full rounded-2xl border-4 border-ink/20 bg-primary py-4 font-display text-2xl font-extrabold text-primary-foreground"
          >
            Crear Rey Pirata
          </button>
        </section>
      ) : (
        <>
          <p className="mb-6 font-display text-2xl font-extrabold text-sea-foreground">
            ¿Quién navega hoy?
          </p>
          <div className="flex flex-wrap items-start justify-center gap-6">
            {kids.map((kid) => (
              <button
                key={kid.id}
                type="button"
                onClick={() => {
                  void enterKid(kid.id).then(() => navigate({ to: "/barco" }));
                }}
                className="chunky flex w-40 flex-col items-center gap-3 rounded-3xl border-4 border-ink/20 bg-card/95 p-5 float-card"
              >
                <Avatar avatar={kid.avatar} />
                <span className="font-display text-xl font-extrabold">{kid.name}</span>
              </button>
            ))}

            <button
              type="button"
              onClick={() => setAskingAdmin(true)}
              className="chunky flex w-40 flex-col items-center gap-3 rounded-3xl border-4 border-ink/20 bg-gold p-5 float-card"
            >
              <span className="flex size-24 items-center justify-center rounded-full border-4 border-ink/20 bg-card text-5xl">
                👑
              </span>
              <span className="font-display text-xl font-extrabold text-gold-foreground">
                Rey Pirata
              </span>
            </button>
          </div>

          {kids.length === 0 && (
            <p className="mt-6 max-w-md text-center font-bold text-sea-foreground/90">
              Todavía no hay grumetes. Entra como Rey Pirata para dar de alta a la tripulación.
            </p>
          )}

          {askingAdmin && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-6">
              <div className="w-full max-w-sm rounded-3xl border-4 border-ink/20 bg-card p-6">
                <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold">
                  <Lock className="size-7" /> Acceso del Rey Pirata
                </h2>
                <input
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  placeholder="Usuario"
                  className="mt-4 w-full rounded-2xl border-4 border-ink/15 bg-background px-4 py-3 font-display text-xl font-extrabold"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  className="mt-3 w-full rounded-2xl border-4 border-ink/15 bg-background px-4 py-3 font-display text-xl font-extrabold"
                />
                {error && <p className="mt-3 font-bold text-destructive">{error}</p>}
                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAskingAdmin(false);
                      setError(null);
                      setPassword("");
                    }}
                    className="chunky flex-1 rounded-2xl border-4 border-ink/15 bg-secondary py-3 font-display text-lg font-extrabold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => void entrarAdmin()}
                    className="chunky flex-1 rounded-2xl border-4 border-ink/20 bg-primary py-3 font-display text-lg font-extrabold text-primary-foreground"
                  >
                    Entrar
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Avatar({ avatar }: { avatar: string }) {
  const isImage = avatar.startsWith("data:") || avatar.startsWith("http");
  return (
    <span className="flex size-24 items-center justify-center overflow-hidden rounded-full border-4 border-ink/20 bg-secondary text-5xl">
      {isImage ? (
        <img src={avatar} alt="" className="size-full object-cover" />
      ) : (
        (avatar || "🧒")
      )}
    </span>
  );
}
