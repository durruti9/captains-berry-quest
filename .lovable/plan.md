# Reparar el alta y reforzar la motivación diaria

## Objetivo
Dejar el primer acceso del Rey Pirata fiable, con errores comprensibles y sin estados bloqueados, y añadir una mejora de gamificación que premie la constancia sin alterar los límites actuales de Doblones.

## Cambios
1. **Alta y acceso del Rey Pirata**
   - Endurecer la creación inicial para que un fallo al abrir la sesión no deje la cuenta creada pero la pantalla atrapada en el formulario.
   - Diferenciar errores de conexión, configuración y credenciales, y permitir reintentar sin duplicar la cuenta.
   - Evitar envíos repetidos, permitir enviar con Enter y mostrar claramente cuándo se está guardando.

2. **Persistencia y reconstrucciones**
   - Normalizar los datos antiguos al leerlos para que una versión previa no rompa el arranque tras actualizar.
   - Mantener PostgreSQL como almacenamiento obligatorio en Easypanel y conservar la inicialización automática de tabla y fila.
   - Mejorar la comprobación de salud para señalar por separado base de datos y configuración de sesión.

3. **Gamificación: racha de navegación**
   - Mostrar una racha diaria basada en días laborables con al menos el 85% de tareas completadas.
   - Los fines de semana no romperán la racha, coherente con el Gran Mapa.
   - Añadir una celebración especial al completar todas las tareas del día, sin regalar Doblones extra ni cambiar los topes existentes.

4. **Validación completa**
   - Probar desde cero: crear Rey Pirata, entrar al panel, crear grumete, completar tareas y recargar.
   - Simular datos guardados de una versión anterior y comprobar su recuperación.
   - Revisar la experiencia en tamaño tablet y móvil, además de los mensajes de error.

## Detalles técnicos
- Se mantendrá el almacenamiento actual en PostgreSQL y la sesión protegida del servidor.
- La migración será compatible hacia atrás y no borrará perfiles, tareas, progreso ni estadísticas.
- No se crearán tablas ni filas manualmente: la aplicación seguirá inicializándolas automáticamente.
