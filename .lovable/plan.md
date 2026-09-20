# Sustituir PostgreSQL por almacenamiento permanente en Easypanel

## Objetivo

Eliminar la conexión a PostgreSQL que está bloqueando el alta y guardar toda la información de **El Diario del Capitán** en un volumen permanente de Easypanel. Se empezará desde cero y las futuras reconstrucciones de la app conservarán los datos.

## Cambios

1. **Nuevo almacenamiento persistente por archivo**
   - Guardar Rey Pirata, grumetes, tareas, progreso, estadísticas, cofres y botín en `/data/captain-state.json`.
   - Crear el archivo automáticamente en el primer arranque.
   - Escribir de forma atómica mediante un archivo temporal y renombrado, evitando archivos incompletos si el contenedor se detiene durante un guardado.
   - Mantener las operaciones en cola para que dos acciones simultáneas no sobrescriban datos.

2. **Sesión estable sin variables delicadas**
   - Crear automáticamente una clave de sesión dentro del mismo volumen permanente.
   - Reutilizarla después de cada reconstrucción para que el acceso continúe funcionando.
   - Eliminar la dependencia obligatoria de `SESSION_SECRET`, `DATABASE_URL`, `DB_*` y `REQUIRE_DATABASE`.

3. **Arranque y alta del Rey Pirata**
   - Simplificar el flujo para que el primer acceso siempre permita crear el Rey Pirata cuando el archivo esté vacío.
   - Mostrar un error específico si `/data` no está montado o no permite escritura.
   - Mantener la recuperación segura si una petición se interrumpe justo después de guardar la cuenta.

4. **Comprobación de salud adecuada**
   - Verificar que `/data` existe, es escribible y que el archivo puede leerse.
   - Evitar que una comprobación secundaria provoque reinicios continuos de la app.
   - Informar claramente si el almacenamiento es permanente o temporal.

5. **Despliegue simplificado**
   - Actualizar Docker para declarar `/data` como volumen persistente.
   - Retirar PostgreSQL del ejemplo de despliegue y las variables relacionadas.
   - Actualizar la guía de Easypanel con estos únicos pasos: montar un volumen persistente en `/data`, exponer el puerto 3000 y reconstruir solo la app.
   - Dejar instrucciones para comprobar el estado antes de crear el Rey Pirata.

6. **Validación**
   - Probar desde cero: crear Rey Pirata, crear un grumete, modificar tareas y registrar progreso.
   - Reiniciar el servidor usando el mismo volumen y confirmar que cuenta, sesión y datos siguen disponibles.
   - Verificar la pantalla de alta, acceso del Rey Pirata y comprobación de salud.

## Detalles técnicos

- El archivo JSON sustituirá la tabla única `captain_state`; el modelo de datos actual se conserva para no rehacer las pantallas ni las reglas del juego.
- En desarrollo se usará una ubicación local separada. En Easypanel, producción exigirá un directorio persistente montado en `/data`; no habrá caída silenciosa a memoria.
- El paquete y el código de PostgreSQL dejarán de formar parte del camino de ejecución.

## Puesta en marcha resultante

En Easypanel solo será necesario añadir al servicio App un volumen persistente con ruta de montaje `/data`. No habrá que crear servicio PostgreSQL, tablas, filas ni credenciales de base de datos.
