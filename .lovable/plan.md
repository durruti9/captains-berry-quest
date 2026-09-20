# Que el contenedor arranque y se quede arriba en Easypanel

## Qué dice ese mensaje

"Waiting for service ... to start" + "Server closed successfully" significa que el contenedor **sí arranca el servidor y después se apaga**. Easypanel no llega a darlo por activo y lo reintenta. No es un fallo de tus datos ni del registro del Rey Pirata: es el arranque del contenedor.

La causa más probable es la comprobación de salud incluida en la imagen: si esa comprobación no responde a tiempo durante el primer arranque, el contenedor se marca como defectuoso y se reinicia en bucle, mostrando exactamente ese par de líneas.

## Cambios propuestos

1. **Quitar la comprobación de salud interna de la imagen.** Easypanel ya vigila el servicio por su puerto; la comprobación interna solo añade una forma extra de morir. La dirección `/api/public/health` seguirá existiendo para consultarla tú desde el navegador.
2. **Respetar el puerto que asigne el entorno.** El arranque usará el puerto que reciba, con 3000 por defecto, para que no dependa de una coincidencia exacta de configuración.
3. **Mensajes de arranque claros.** Al iniciarse, el servidor escribirá en el registro la versión, el puerto y la carpeta de datos elegida, para que el propio log de Easypanel diga si hay volumen permanente o no.
4. **Nunca morir por la carpeta de datos.** Si `/data` no está disponible, el servidor seguirá en marcha con aviso en pantalla en lugar de terminar.

## Cómo comprobarlo después

1. Reconstruir **solo la App**, sin caché.
2. En los registros debe aparecer una línea de arranque con la versión y `Listening on 0.0.0.0:3000`, y **no** debe repetirse "Server closed successfully".
3. Abrir `https://TU-DOMINIO/api/public/health` y comprobar que responde con `captain-file-storage-v2`.

## Detalle técnico

- `Dockerfile`: eliminar la instrucción `HEALTHCHECK`; mantener `EXPOSE 3000`, `VOLUME ["/data"]` y `CAPTAIN_DATA_DIR=/data`.
- `src/server.ts`: traza de arranque única (versión, `process.env.PORT`, `HOST`, resultado de `resolveStorageLocation()`), envuelta en try/catch para no romper el arranque.
- `DESPLIEGUE.md`: sección de diagnóstico con estas dos líneas de log y qué significan.

## Lo que necesito confirmar de tu parte

Para descartar otra causa (por ejemplo, falta de memoria o un puerto mal expuesto), pega si puedes las **líneas anteriores** del registro de Easypanel, justo antes de "Server closed successfully".
