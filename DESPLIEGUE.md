# El Diario del Capitán — puesta en marcha en tu VPS (Easypanel)

La app guarda todo en **PostgreSQL** y se puede **instalar en Android** como app
(icono en la pantalla de inicio y pantalla completa).

> **¿Está el proyecto en GitHub?** No por defecto. Lovable guarda el código en
> su repositorio interno. Para que Easypanel pueda leerlo, primero hay que
> conectarlo a GitHub (ver el paso 0 más abajo).

---

## 0. Conectar el proyecto a GitHub (necesario para Easypanel)

Easypanel construye la app leyendo un repositorio de GitHub, así que lo primero
es subir el código ahí. Esto se hace desde Lovable (no puedo hacerlo por chat):

1. En Lovable, abre el menú **+** (abajo a la izquierda) → **GitHub** →
   **Connect project**.
2. Autoriza la **Lovable GitHub App** en tu cuenta de GitHub.
3. Elige la cuenta/organización de GitHub y pulsa **Create Repository**.
4. Lovable crea el repo y, a partir de ahí, **cada cambio que hagas en Lovable
   se sube solo a GitHub** (rama `main`).

> Alternativa sin GitHub: en Easypanel puedes subir el código con un `git push`
> directo, pero entonces perderás la sincronización automática con Lovable. Lo
> recomendado es conectar GitHub.

---

## Variables de entorno

| Variable         | Obligatoria | Ejemplo                                              |
| ---------------- | ----------- | ---------------------------------------------------- |
| `DATABASE_URL`   | sí          | `postgres://capitan:clave@db:5432/capitan`           |
| `SESSION_SECRET` | sí          | una frase larga y secreta (mínimo 32 caracteres)      |
| `PORT`           | no          | `3000` (por defecto)                                 |
| `HOST`           | no          | `0.0.0.0` (por defecto)                              |
| `DATABASE_SSL`   | no          | `true` **solo** si usas un Postgres externo con SSL   |

- La tabla que necesita (`captain_state`) **se crea sola** al arrancar la app.
  No hace falta ninguna migración manual.
- `SESSION_SECRET` firma la cookie de sesión. Usa una frase larga, secreta y
  **estable** (si la cambias, todas las sesiones caducan y hay que volver a
  entrar).
- `DATABASE_SSL=true` solo si tu Postgres exige cifrado (típico en proveedores
  externos tipo Supabase, Neon, etc.). Con el Postgres **interno de Easypanel**
  no hace falta.

> Si no defines `DATABASE_URL`, la app arranca en **memoria** (solo para
> pruebas: se pierde todo al reiniciar). En producción siempre usa Postgres.

---

## Opción A — Easypanel (recomendada)

### Requisitos previos

- Un VPS con **Easypanel** instalado y funcionando.
- El repositorio ya subido a **GitHub** (paso 0).
- Un dominio propio, o el subdominio gratuito que te da Easypanel.

### Paso 1 — Crear el proyecto

1. Entra en Easypanel → **+ Project**.
2. Nombre: `diario-capitan` → **Create**.

### Paso 2 — Añadir la base de datos Postgres

1. Dentro del proyecto `diario-capitan`, pulsa **+ Service** → **Postgres**.
2. Rellena:
   - **Name**: `db`
   - **User**: anota el usuario (ej. `capitan`)
   - **Password**: anota la contraseña
   - **Database name**: `capitan` (o usa la que viene por defecto)
3. Pulsa **Deploy** y espera a que el estado quede en **verde** (Running).
4. Ve a la pestaña **Variables** del servicio Postgres y copia la
   **Connection URL interna**. Tendrá este formato:
   ```
   postgres://capitan:CLAVE-QUE-PUSISTE@db:5432/capitan
   ```
   > En Easypanel los servicios del mismo proyecto se ven entre sí por su nombre
   > interno (`db`), así que la URL usa ese nombre, no `localhost`.

### Paso 3 — Añadir la app

1. Dentro del proyecto, **+ Service** → **App**.
2. **Source**: tu repositorio de **GitHub**, rama `main`.
   > Si aún no conectaste GitHub (paso 0), hazlo primero o usa *Git push*.
3. **Build method**: selecciona **Dockerfile** (ya está en la raíz del repo).
   > No hace falta configurar el comando de build: el Dockerfile fija
   > `SELF_HOST=1` y compila con bun → servidor Node en `.output/server`.
4. **Environment variables** — añade estas:
   ```
   DATABASE_URL=postgres://capitan:CLAVE@db:5432/capitan
   SESSION_SECRET=pon-aqui-una-frase-larga-y-secreta-de-32-caracteres-minimo
   PORT=3000
   HOST=0.0.0.0
   ```
   - Si tu Postgres fuera externo (fuera de Easypanel) y exigiera SSL, añade
     también `DATABASE_SSL=true`. Con el Postgres interno del paso 2, **no lo
     pongas**.
5. **Port**: expón el **3000** (pestaña *Ports* → puerto interno 3000).
6. **Deploy** y espera al estado verde.

### Paso 4 — Dominio y HTTPS (obligatorio para instalar en Android)

1. Pestaña **Domains** del servicio App → **Add domain**.
2. Usa tu dominio propio o el subdominio gratuito de Easypanel
   (tipo `diario-capitan.a.easypanel.app`).
3. Activa **HTTPS (Let's Encrypt)**.

> ⚠️ El certificado HTTPS es **obligatorio**: sin HTTPS, Android no ofrece la
> opción de instalar la app. Easypanel gestiona el certificado automáticamente.

### Paso 5 — Comprobar

1. Abre la URL HTTPS en el navegador. Debes ver la pantalla de **alta del Rey
   Pirata** (usuario y contraseña).
2. Si algo falla, revisa la pestaña **Logs** del servicio App:
   - Build: `bun install --frozen-lockfile` + `bun run build` con `SELF_HOST=1`.
   - Runtime: arranca `node .output/server/index.mjs` en el puerto 3000.

### Paso 6 — Primer arranque (configurar la app)

1. Abre la web: te pedirá dar de alta al **Rey Pirata** (usuario y contraseña).
   > Esto crea el admin; solo se hace una vez. Anota usuario y contraseña.
2. Desde el panel del Rey Pirata, da de alta a los **grumetes** (nombre y foto o
   emoji) y ajusta las **tareas** (nombre, Doblones, icono y momento del día:
   Mañana / Tarde / Noche).
3. Pulsa **Salir**. La pantalla de inicio mostrará los perfiles.
4. El niño entra tocando su perfil; el Rey Pirata entra con su contraseña.

---

## Instalar en Android (PWA)

1. Abre la web con **Chrome** en el dominio con HTTPS.
2. Tras visitarla un par de veces (o tras un poco de uso), aparecerá abajo el
   botón **"Instalar"**. También puedes forzarlo con el menú
   ⋮ → *Instalar aplicación / Añadir a pantalla de inicio*.
3. En **iPad/iPhone**: Safari → botón Compartir → *Añadir a pantalla de inicio*.

La app abre a pantalla completa con su icono propio. Necesita conexión con el
VPS (no funciona sin internet).

---

## Opción B — Docker Compose (VPS a pelo)

Para quien no quiera usar Easypanel:

```sh
git clone <tu-repo-github> diario-capitan
cd diario-capitan
# edita SESSION_SECRET y la contraseña de Postgres en docker-compose.yml
docker compose up -d --build
```

La app queda en `http://IP-DEL-VPS:3000`. Ponla detrás de un proxy con HTTPS
(Nginx Proxy Manager, Traefik o Caddy) antes de usarla en el móvil: sin HTTPS,
Android no ofrece instalar la app.

---

## Copias de seguridad

Todos los datos viven en la tabla `captain_state` de Postgres (un único
registro JSON, `id=1`):

```sh
# Exportar
docker exec -t <contenedor-postgres> pg_dump -U capitan capitan > copia.sql

# Restaurar
docker exec -i <contenedor-postgres> psql -U capitan capitan < copia.sql
```

En Easypanel, el contenedor se llama como el servicio Postgres
(ej. `diario-capitan-db-...`); míralo en la pestaña *Containers*.
