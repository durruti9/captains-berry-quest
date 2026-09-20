# Que el alta del Rey Pirata no dependa de una configuración perfecta

## Qué está pasando (hipótesis principal, sin confirmar)

Con las variables vacías, la app guarda todo en la carpeta `/data` del contenedor. Si Easypanel no tiene un volumen montado ahí, o la carpeta no permite escritura, ocurren dos cosas a la vez:

1. El guardado del Rey Pirata falla.
2. La comprobación de salud interna devuelve error, Easypanel cree que la app está rota y la reinicia una y otra vez. Justo por eso al pulsar el botón "no ocurre nada": la petición se corta con el reinicio y nunca vuelve una respuesta.

Esto es coherente con lo que describes, pero todavía no está confirmado: necesito ver qué responde la app.

## Paso 1 — Confirmar antes de tocar nada

Abre en el navegador:

```text
https://TU-DOMINIO/api/public/health
```

y dime exactamente qué texto aparece (o si no carga). Con eso sabremos si es la carpeta de datos, la sesión, o un reinicio en bucle.

## Paso 2 — Hacer que la app nunca se quede muda

Independientemente del resultado, haré estos cambios para que esto no vuelva a bloquearte:

- **Carpeta de datos con alternativas**: la app intentará `/data`; si no puede escribir, usará una carpeta interna de la propia app y, en último caso, una temporal. Nunca se quedará sin poder guardar; simplemente avisará en pantalla si el guardado no es permanente.
- **Aviso claro en pantalla**: si el guardado permanente no está disponible, aparecerá un mensaje que lo explica y un botón para continuar igualmente (los datos se conservarán mientras la app no se reconstruya).
- **Sin reinicios en bucle**: la comprobación de salud dejará de marcar la app como rota cuando solo sea un problema de carpeta. Devolverá el detalle, pero sin tirar el contenedor.
- **Errores visibles al registrar**: cualquier fallo al crear el Rey Pirata se mostrará con su motivo concreto en vez de dejar el botón en "Guardando…".

## Paso 3 — Instrucciones finales

Actualizaré `DESPLIEGUE.md` con el paso exacto en Easypanel para montar el volumen en `/data` (Service → Mounts → Volume → ruta `/data`), que es lo que garantiza que los datos sobrevivan a cada reconstrucción.

## Detalle técnico

- `src/lib/captain-db.server.ts`: `resolveDataDir()` prueba en orden `CAPTAIN_DATA_DIR`, `/data`, `/app/data`, `/tmp/diario-del-capitan`, validando escritura real (fichero de prueba) antes de fijar la ruta; `storageMode()` pasa a derivarse de la ruta finalmente elegida y se expone el motivo del descarte.
- `src/routes/api/public/health.ts`: responde siempre 200 salvo fallo total de escritura; incluye `dataDir`, `persistent` y `fallbackReason`.
- `src/lib/captain.functions.ts`: `toPublic()` usa el modo real resuelto en lugar de `NODE_ENV`; `createAdmin` ya devuelve el motivo, se propaga también el de sesión.
- `src/routes/index.tsx`: banner de aviso no bloqueante cuando el guardado no es permanente, en vez de la pantalla de bloqueo actual.
