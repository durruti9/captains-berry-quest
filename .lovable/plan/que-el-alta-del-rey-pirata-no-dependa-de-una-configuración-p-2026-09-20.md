# Que el alta del Rey Pirata no dependa de una configuración perfecta

## Diagnóstico confirmado

He comprobado directamente tu dominio. La dirección devuelve **HTTP 404** y una página HTML, aunque la dirección de diagnóstico sí existe en el código actual y está incluida en el árbol de la aplicación.

Esto confirma que Easypanel **no está ejecutando la versión actual del servidor** (o está sirviendo una imagen anterior). Vaciar las variables no puede corregirlo porque el código nuevo todavía no está activo en ese dominio. También explica por qué el botón sigue comportándose exactamente igual.

## Paso 1 — Hacer que la app nunca se quede muda

Independientemente del resultado, haré estos cambios para que esto no vuelva a bloquearte:

- **Carpeta de datos con alternativas**: la app intentará `/data`; si no puede escribir, usará una carpeta interna de la propia app y, en último caso, una temporal. Nunca se quedará sin poder guardar; simplemente avisará en pantalla si el guardado no es permanente.
- **Aviso claro en pantalla**: si el guardado permanente no está disponible, aparecerá un mensaje que lo explica y un botón para continuar igualmente (los datos se conservarán mientras la app no se reconstruya).
- **Sin reinicios en bucle**: la comprobación de salud dejará de marcar la app como rota cuando solo sea un problema de carpeta. Devolverá el detalle, pero sin tirar el contenedor.
- **Errores visibles al registrar**: cualquier fallo al crear el Rey Pirata se mostrará con su motivo concreto en vez de dejar el botón en "Guardando…".

## Paso 2 — Asegurar que Easypanel despliega esta versión

- Añadiré un identificador visible de versión a la dirección de diagnóstico para confirmar sin dudas qué revisión está ejecutándose.
- Revisaré el empaquetado para que la dirección `/api/public/health` quede incluida en la imagen final.
- Actualizaré las instrucciones para forzar en Easypanel una reconstrucción **sin caché** desde la rama y revisión correctas.

## Paso 3 — Guardado permanente e instrucciones finales

Actualizaré `DESPLIEGUE.md` con el paso exacto en Easypanel para montar un volumen en `/data` (Service → Mounts → Volume → ruta `/data`). Las variables pueden quedar vacías; el volumen, no las variables, es lo que conserva los datos entre reconstrucciones.

## Detalle técnico

- `src/lib/captain-db.server.ts`: `resolveDataDir()` prueba en orden `CAPTAIN_DATA_DIR`, `/data`, `/app/data`, `/tmp/diario-del-capitan`, validando escritura real (fichero de prueba) antes de fijar la ruta; `storageMode()` pasa a derivarse de la ruta finalmente elegida y se expone el motivo del descarte.
- `src/routes/api/public/health.ts`: responde siempre 200 salvo fallo total de escritura; incluye versión, `dataDir`, `persistent` y `fallbackReason`.
- `src/lib/captain.functions.ts`: `toPublic()` usa el modo real resuelto en lugar de `NODE_ENV`; `createAdmin` ya devuelve el motivo, se propaga también el de sesión.
- `src/routes/index.tsx`: banner de aviso no bloqueante cuando el guardado no es permanente, en vez de la pantalla de bloqueo actual.
