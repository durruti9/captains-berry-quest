# El Diario del Capitán — despliegue en Easypanel

La app guarda todos sus datos en un único archivo dentro de un **volumen permanente**. No necesita PostgreSQL, tablas, filas ni contraseñas de base de datos.

## Antes de empezar

El proyecto debe estar en GitHub para que Easypanel pueda reconstruirlo. En Lovable, conecta el proyecto desde **Project Settings → GitHub** si todavía no lo has hecho.

## Instalación desde cero en Easypanel

### 1. Crear la aplicación

1. En Easypanel, crea un proyecto o abre el que ya tienes.
2. Pulsa **+ Service → App**.
3. Selecciona el repositorio de GitHub y la rama `main`.
4. Elige **Dockerfile** como método de construcción.

### 2. Añadir el volumen permanente

1. Dentro del servicio App, abre **Mounts** o **Volumes**.
2. Añade un volumen persistente.
3. Usa exactamente esta ruta de montaje dentro del contenedor:

   ```text
   /data
   ```

4. Guarda el volumen. No uses una carpeta temporal ni un bind mount que Easypanel elimine al reconstruir.

Este volumen contendrá:

- `/data/captain-state.json`: Rey Pirata, grumetes, tareas, Doblones, estadísticas y mapa.
- `/data/session-secret.txt`: clave privada creada automáticamente para conservar las sesiones.

### 3. Variables y puerto

No configures `DATABASE_URL`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `REQUIRE_DATABASE` ni `SESSION_SECRET`: ya no se utilizan.

El Dockerfile configura automáticamente:

```text
PORT=3000
HOST=0.0.0.0
CAPTAIN_DATA_DIR=/data
```

En **Ports**, expón el puerto interno `3000`.

### 4. Dominio y HTTPS

1. Añade tu dominio o el subdominio de Easypanel al servicio App.
2. Activa HTTPS.

HTTPS es obligatorio para que Android permita instalar la web como aplicación.

### 5. Primer despliegue

1. Pulsa **Deploy/Rebuild** en la App.
2. Espera a que aparezca como activa.
3. Abre:

   ```text
   https://TU-DOMINIO/api/public/health
   ```

4. Antes del alta debe responder de forma similar a:

   ```json
   {"ok":true,"storage":"ready","persistent":true,"initialized":false,"session":"ready"}
   ```

5. Abre la página principal y crea el Rey Pirata.
6. Después del alta, `initialized` pasará a `true`.

Si `persistent` aparece como `false`, no introduzcas datos reales: comprueba que el volumen esté montado exactamente en `/data`.

## Actualizar sin perder datos

1. No borres el volumen montado en `/data`.
2. Reconstruye o vuelve a desplegar **solo la App**.
3. El nuevo contenedor volverá a montar el mismo volumen y leerá automáticamente los datos existentes.
4. Comprueba `/api/public/health` y confirma que `persistent` sigue siendo `true`.

Una reconstrucción no borra el archivo. Los datos solo se eliminan si borras el volumen desde Easypanel o borras manualmente `/data/captain-state.json`.

## Copias de seguridad

Desde la terminal del servicio App:

```sh
cp /data/captain-state.json /data/captain-state.backup.json
```

Para restaurar una copia:

```sh
cp /data/captain-state.backup.json /data/captain-state.json
```

Después, reinicia únicamente la App.

## Reinicio voluntario completo

Si realmente quieres empezar de cero:

1. Guarda antes una copia de seguridad si la necesitas.
2. Borra `/data/captain-state.json` y `/data/session-secret.txt` desde la terminal de la App.
3. Reinicia la App.
4. La app creará archivos nuevos y volverá a mostrar el alta del Rey Pirata.

## Instalar en Android

1. Abre la app con Chrome usando la dirección HTTPS.
2. Usa el botón **Instalar** cuando aparezca o abre el menú de Chrome y pulsa **Instalar aplicación / Añadir a pantalla de inicio**.

## Docker Compose opcional

El archivo `docker-compose.yml` incluido crea la App y un volumen llamado `capitan-data`. Ejecuta:

```sh
docker compose up -d --build
```

La app quedará disponible en `http://IP-DEL-VPS:3000`. Usa un proxy HTTPS antes de instalarla en Android.