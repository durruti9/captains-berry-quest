# Persistencia segura y reinicio voluntario

## Objetivo
Evitar pérdidas silenciosas de datos en el despliegue de Easypanel y permitir que el Rey Pirata reinicie únicamente el progreso de un grumete cuando lo decida.

## Situación confirmada
- La aplicación guarda en PostgreSQL únicamente cuando está definida `DATABASE_URL`.
- Sin esa variable usa memoria temporal; por eso los datos de la vista de Lovable desaparecen al reconstruir o reiniciar.
- En Easypanel, la tabla `captain_state` y su fila se crean automáticamente; no hay que crear filas manualmente.
- Una reconstrucción de la aplicación no borra PostgreSQL si la base de datos mantiene su volumen y la misma `DATABASE_URL`.

## Cambios
1. **Impedir el borrado accidental en producción**
   - Mantener la memoria temporal solo para desarrollo local.
   - Si la aplicación desplegada arranca sin `DATABASE_URL`, mostrar un error claro y no permitir que funcione con datos desechables.
   - Registrar de forma segura si el almacenamiento está conectado, sin mostrar contraseñas ni la dirección de la base de datos.

2. **Estado del almacenamiento en la zona del Rey Pirata**
   - Añadir un indicador sencillo: “Datos guardados en PostgreSQL” o “Almacenamiento temporal”.
   - Incluir una advertencia visible cuando el entorno actual no pueda conservar datos después de una reconstrucción.

3. **Reinicio voluntario de un grumete**
   - Añadir, dentro de la gestión del grumete, la acción “Reiniciar progreso”.
   - Pedir confirmación reforzada antes de ejecutarla.
   - Borrar solo su progreso: tareas realizadas, historial, Doblones semanales, botín acumulado y aprobaciones del mapa.
   - Conservar el perfil del grumete, las tareas configuradas y los demás grumetes.
   - Ejecutar el reinicio en el servidor y exigir una sesión válida del Rey Pirata.

4. **Guía de Easypanel y copias de seguridad**
   - Añadir una comprobación paso a paso de `DATABASE_URL`, la fila `id=1` y el volumen persistente de PostgreSQL.
   - Documentar cómo reconstruir solo la app sin recrear el servicio PostgreSQL.
   - Añadir copia y restauración antes de cambios importantes.

5. **Verificación**
   - Crear datos, reiniciar el proceso de la app y confirmar que permanecen con PostgreSQL.
   - Comprobar el reinicio de un solo grumete y que no afecta a tareas, perfiles ni otros progresos.
   - Verificar permisos, mensajes de confirmación y funcionamiento en tablet.

## Nota sobre la vista de Lovable
La reconstrucción de la vista de Lovable seguirá perdiendo datos mientras no tenga una base persistente conectada. Este plan hará visible esa situación y protegerá el despliegue real de Easypanel; los datos definitivos deben introducirse y conservarse allí.
