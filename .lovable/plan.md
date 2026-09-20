# Plan: cerrar la conexión app ↔ PostgreSQL en Easypanel

## Objetivo
Que la app conecte con PostgreSQL en Easypanel y el alta del Rey Pirata funcione.

## Valores exactos

### Servicio APP — Variables de entorno
```text
DATABASE_URL=postgres://irai:tesoro@postgres:5432/iraitesoro
SESSION_SECRET=<frase-larga-secreta-de-al-menos-32-caracteres>
REQUIRE_DATABASE=1
PORT=3000
HOST=0.0.0.0
```

### Servicio PostgreSQL — Credenciales
```text
POSTGRES_USER=irai
POSTGRES_PASSWORD=tesoro
POSTGRES_DB=iraitesoro
```

## Pasos
1. Aplicar las variables anteriores en ambos servicios.
2. Reconstruir SOLO el servicio de la app.
3. Abrir `https://TU-DOMINIO/api/public/health` y confirmar:
   `{"ok":true,"database":"connected","persistent":true,"session":"ready"}`
4. Crear el Rey Pirata desde la app.
5. Cambiar la contraseña de la base de datos al final, porque ya quedó expuesta en el chat.

## Notas técnicas
- No crear tablas a mano: la app crea `captain_state` automáticamente.
- Si `/api/public/health` devuelve error, el campo `issue` indica si falla base, usuario/contraseña u host.
