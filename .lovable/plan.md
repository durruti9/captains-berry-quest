# Orden manual de actividades

## Objetivo
Permitir que el Rey Pirata coloque cada actividad en la posición correcta dentro de Mañana, Tarde o Noche, y conservar ese orden tras reconstrucciones y actualizaciones.

## Cambios
- Añadir controles de subir y bajar en cada actividad de “Tareas actuales”.
- Reordenar únicamente dentro del bloque correspondiente, sin mezclar Mañana, Tarde y Noche.
- Guardar el nuevo orden inmediatamente en PostgreSQL.
- Al crear una actividad, mantenerla inicialmente al final de su bloque; después podrá moverse a cualquier posición.
- Si una actividad cambia de franja al editarla, colocarla al final de la nueva franja para que pueda ordenarse allí.
- Mostrar el mismo orden en “Mi Barco”, Estadísticas y el resto de vistas que usan las actividades.

## Compatibilidad y seguridad
- Mantener compatibles los datos ya guardados: las tareas existentes conservarán su orden actual.
- Validar en el servidor que solo el Rey Pirata puede reordenar y que solo se aceptan identificadores existentes.
- Verificar el flujo completo y que el orden sobreviva a una recarga.

## Detalles técnicos
- El orden se representará mediante la posición del array de tareas ya persistido en `captain_state`; no requiere crear tablas ni filas nuevas.
- Se añadirá una operación de servidor para mover una tarea una posición arriba o abajo dentro de su bloque.
