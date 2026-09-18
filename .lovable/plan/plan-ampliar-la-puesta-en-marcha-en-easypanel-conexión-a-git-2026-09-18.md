# Plan: Ampliar la puesta en marcha en Easypanel + conexión a GitHub

## Situación actual

- **GitHub: NO conectado.** El repositorio vive en el almacenamiento git privado de Lovable (`git.private.lovable-gcp.code.storage`), no en GitHub. Easypanel necesita un repo de GitHub (o un push por Git) para construir la app.
- La guía actual (`DESPLIEGUE.md`) tiene solo 5 pasos genéricos para Easypanel.
- La app ya está lista para desplegar: `Dockerfile` multi-stage (bun build → node runtime, puerto 3000), `docker-compose.yml` con Postgres, y el código gestiona SSL de Postgres con `DATABASE_SSL=true` cuando proceda.

## Cambio 1 — Conectar el proyecto a GitHub (lo haces tú, fuera del chat)

No puedo conectar GitHub por chat. Pasos para ti:

1. En Lovable, ve a **Project Settings → GitHub** y conecta tu cuenta.
2. Elige **Sync to GitHub** (crear repo nuevo o usar uno existente, rama `main`).
3. Cada cambio que hagas en Lovable se commitea a ese repo de GitHub automáticamente.
4. Easypanel leerá desde ese repo.

> Alternativa sin GitHub: en Easypanel puedes usar **Git push** directo, pero la sincronización con Lovable es por GitHub, así que lo recomendado es conectar GitHub.

## Cambio 2 — Reescribir `DESPLIEGUE.md` con detalle real de Easypanel

Expandir la sección "Opción A — Easypanel" con pasos concretos y captura-level de detalle:

1. **Requisitos previos** — VPS con Easypanel instalado, dominio (o subdominio de Easypanel), y el repo ya en GitHub.
2. **Crear el proyecto** en Easypanel (`+ Project` → `diario-capitan`).
3. **Añadir Postgres** — paso a paso:
   - `+ Service` → **Postgres**.
   - Nombre `db`; usuario y contraseña anótalos.
   - Esperar a que arranque (estado verde).
   - Dónde copiar la **Connection URL interna** (pestaña *Variables* / *Connection Strings*). Formato típico: `postgres://usuario:clave@db:5432/capitan`.
   - Crear la base de datos `capitan` (o usar la por defecto) — nota: la tabla `captain_state` se crea sola al arrancar la app.
4. **Añadir la app** — paso a paso:
   - `+ Service` → **App**.
   - **Source**: tu repo de GitHub, rama `main`.
   - **Build method**: **Dockerfile** (ya está en la raíz).
   - **Environment variables** (tabla completa con explicación de cada una):
     ```
     DATABASE_URL=postgres://usuario:clave@db:5432/capitan
     SESSION_SECRET=frase-larga-y-secreta-de-32-caracteres-minimo
     PORT=3000
     HOST=0.0.0.0
     ```
   - Cuándo añadir `DATABASE_SSL=true` (Postgres externo con SSL; en Easypanel interno no hace falta).
   - **Port**: exponer el **3000**.
5. **Dominio y HTTPS**:
   - Pestaña `Domains` → añade tu dominio o el subdominio gratuito de Easypanel.
   - Activa **HTTPS (Let's Encrypt)** — obligatorio: sin HTTPS, Android no ofrece instalar la app.
6. **Deploy** y cómo leer los logs si falla el build (pestaña *Logs*; el build usa `bun install --frozen-lockfile` + `bun run build` con `SELF_HOST=1`).
7. **Comprobación**: visitar la URL HTTPS; verás el alta del Rey Pirata.

## Cambio 3 — Ampliar "Primer arranque" y "Instalar en Android"

- Notas sobre el primer arranque: si no hay `DATABASE_URL` la app arranca en memoria (solo pruebas; se pierde al reiniciar). En Easypanel con Postgres, los datos persisten.
- Detalle de instalación en Android: cuándo aparece el botón "Instalar" (Chrome, visita repetida / engagement), menú ⋮ como alternativa, y aviso de que en iOS/iPadOS es Safari → Compartir → Añadir a pantalla de inicio.

## Cambio 4 — Mantener Opción B (Docker Compose) y Copias de seguridad

Sin cambios funcionales; solo alinear el texto con el resto (mismo formato de variables, nota de `DATABASE_SSL`).

## Notas técnicas

- El `Dockerfile` fija `SELF_HOST=1` internamente, así que el build produce el servidor Node en `.output/server/index.mjs` — no hay que tocar nada en Easypanel.
- Puerto interno: 3000 (definido en Dockerfile y `PORT`).
- `SESSION_SECRET` se usa para firmar la cookie de sesión; mínimo 32 caracteres, debe ser secreta y estable (si cambia, las sesiones caducan).
- Tabla `captain_state` (jsonb, id=1) se auto-crea al primer arranque; no hace falta migración manual.

## Entregable

Un único archivo reescrito: `DESPLIEGUE.md` con la guía ampliada. Sin cambios de código ni de configuración de build.

## Cosas que no haré

- No conectaré GitHub (no puedo desde el chat; lo haces tú en Project Settings).
- No tocaré el Dockerfile, docker-compose.yml ni el código de la app.
