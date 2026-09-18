# El Diario del Capitán — puesta en marcha en tu VPS (Easypanel)

La app guarda todo en **PostgreSQL** y se puede **instalar en Android** como app
(icono en la pantalla de inicio y pantalla completa).

## Variables de entorno

| Variable         | Obligatoria | Ejemplo                                        |
| ---------------- | ----------- | ---------------------------------------------- |
| `DATABASE_URL`   | sí          | `postgres://capitan:clave@db:5432/capitan`     |
| `SESSION_SECRET` | sí          | una frase larga y secreta (mínimo 32 caracteres) |
| `PORT`           | no          | `3000` (por defecto)                            |
| `HOST`           | no          | `0.0.0.0` (por defecto)                         |

La tabla que necesita (`captain_state`) se crea sola al arrancar.
Si no defines `DATABASE_URL`, la app funciona en memoria (solo para pruebas: se
pierde al reiniciar).

## Opción A — Easypanel (recomendada)

1. **Crea el proyecto**: en Easypanel, `+ Project` → nombre `diario-capitan`.
2. **Añade la base de datos**: dentro del proyecto, `+ Service` → **Postgres**.
   - Nombre: `db`, usuario/contraseña a tu gusto.
   - Copia la **Connection URL interna** que te muestra Easypanel.
3. **Añade la app**: `+ Service` → **App**.
   - Source: tu repositorio de GitHub (rama `main`) o subida por Git.
   - Build: **Dockerfile** (ya está en la raíz del proyecto).
   - Environment:
     ```
     DATABASE_URL=postgres://usuario:clave@db:5432/capitan
     SESSION_SECRET=pon-aqui-una-frase-larga-y-secreta
     PORT=3000
     ```
   - Ports: expón el **3000**.
4. **Dominio y HTTPS**: pestaña `Domains` → añade tu dominio o el subdominio
   gratuito de Easypanel y activa **HTTPS (Let's Encrypt)**.
   > El certificado es obligatorio: sin HTTPS Android no ofrece instalar la app.
5. **Deploy** y espera a que el estado quede en verde.

## Opción B — Docker Compose (VPS a pelo)

```sh
git clone <tu-repo> diario-capitan
cd diario-capitan
# edita SESSION_SECRET y la contraseña de Postgres en docker-compose.yml
docker compose up -d --build
```

La app queda en `http://IP-DEL-VPS:3000`. Ponla detrás de un proxy con HTTPS
(Nginx Proxy Manager, Traefik o Caddy) antes de usarla en el móvil.

## Primer arranque

1. Abre la web: te pedirá dar de alta al **Rey Pirata** (usuario y contraseña).
2. Desde el panel del Rey Pirata, da de alta a los **grumetes** (nombre y foto o
   emoji) y ajusta las **tareas** (nombre, Doblones, icono y momento del día).
3. Cierra sesión y el niño ya podrá entrar tocando su perfil.

## Instalar en Android

1. Abre la web con **Chrome** en el dominio con HTTPS.
2. Aparecerá abajo el botón **"Instalar"**; también puedes usar el menú
   ⋮ → *Instalar aplicación / Añadir a pantalla de inicio*.
3. En iPad/iPhone: Safari → Compartir → *Añadir a pantalla de inicio*.

La app abre a pantalla completa con su icono. Necesita conexión con el VPS.

## Copias de seguridad

Todos los datos viven en la tabla `captain_state` de Postgres:

```sh
docker exec -t <contenedor-postgres> pg_dump -U capitan capitan > copia.sql
```
