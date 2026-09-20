# Plan: Corregir la conexión PostgreSQL y hacer visible el fallo de alta

## Diagnóstico confirmado

La captura muestra estos valores reales de Easypanel:

- Usuario: `irai`
- Base de datos: `iraitesoro`
- Host interno: `iraitesoro_postgres`
- Puerto: `5432`

El registro `database "irai" does not exist` demuestra que la `DATABASE_URL` de la aplicación termina actualmente en `/irai`. PostgreSQL interpreta esa parte como el nombre de la base, pero la base existente se llama `iraitesoro`.

## Corrección en Easypanel

1. Abrir el servicio de la aplicación, no el servicio PostgreSQL.
2. Sustituir `DATABASE_URL` por la **URL de conexión interna completa** que aparece en la captura, usando el botón de copiar. Su estructura debe ser:

   ```text
   postgres://irai:CONTRASEÑA@iraitesoro_postgres:5432/iraitesoro
   ```

   No escribir la contraseña manualmente ni compartirla en el chat.
3. Confirmar también:

   ```text
   REQUIRE_DATABASE=1
   SESSION_SECRET=una-clave-estable-de-al-menos-32-caracteres
   PORT=3000
   HOST=0.0.0.0
   ```

4. Guardar las variables y reconstruir únicamente el servicio de la aplicación.
5. Abrir `/api/public/health`; solo continuar cuando responda:

   ```json
   {"ok":true,"database":"connected","persistent":true,"session":"ready"}
   ```

6. Crear el Rey Pirata. La aplicación creará automáticamente `captain_state` y su fila inicial dentro de `iraitesoro`; no se necesita SQL manual.

## Mejora de la aplicación

- Hacer que el alta capture cualquier fallo inesperado y siempre salga del estado «Guardando…».
- Mostrar en la propia pantalla una explicación específica cuando PostgreSQL rechace la conexión, sin exponer contraseñas ni la URL completa.
- Añadir a la comprobación de salud un diagnóstico seguro que diferencie base inexistente, credenciales incorrectas y host inaccesible.
- Actualizar la guía de Easypanel para indicar explícitamente que usuario y nombre de base pueden ser distintos y que debe copiarse la URL interna completa.

## Verificación

- Probar el alta del Rey Pirata con una base disponible.
- Probar una conexión deliberadamente incorrecta y comprobar que el botón deja de cargar y muestra un aviso útil.
- Confirmar que una reconstrucción posterior conserva el Rey Pirata y los datos existentes.
