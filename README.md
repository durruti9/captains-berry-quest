# Capitán's Treasure Map

Actúa como un desarrollador web experto en React, Tailwind CSS y diseño UI/UX para niños. Quiero que crees una Web App responsiva, optimizada principalmente para uso en Tablet (en formato horizontal).

**CONCEPTO DE LA APP:** Se llama "El Diario del Capitán". Es una app de productividad y recompensas para un niño de 7 años con una temática de aventuras piratas (estilo anime/cartoon, colores vivos, iconos grandes y amigables).

**LÓGICA DE NEGOCIO Y ESTADO (Usa LocalStorage por ahora):** 1. La moneda del juego son los "Berries". 1 Berry = 1 minuto de videojuegos. 2. Límite estricto: Se pueden conseguir un máximo de 240 Berries a la semana. 3. El estado debe guardar: Saldo actual de Berries, Berries ganados esta semana, tareas diarias completadas y fragmentos de mapa conseguidos.

**ESTRUCTURA DE NAVEGACIÓN (Barra lateral o inferior con iconos de Lucide-react):** Debe tener 4 pestañas: 1. Mi Barco (Tareas), 2. El Tesoro (Canje), 3. Entrenamiento (Estudio), 4. Gran Mapa (Progreso Mensual).

**PANTALLA 1: MI BARCO (Rutinas y Autonomía)** - Muestra una lista de tareas diarias divididas en "Mañana", "Tarde" y "Noche". - Cada tarea tiene un Checkbox simple y grande. (Ej: "Hacer la cama", "Lavarse los dientes", "Mochila lista"). - Al marcar el Checkbox, debe saltar una pequeña animación de celebración y sumar automáticamente +10 Berries al saldo total.

**PANTALLA 2: EL TESORO (Gestión del Tiempo - Matemáticas reales)** - Muestra de forma muy visual y grande el Saldo Actual de Berries en un cofre del tesoro. - Muestra una barra de progreso que indique cuántos Berries lleva esta semana sobre el límite de 240. - Un formulario interactivo: "Ceder Berries a la Marina". El niño introduce cuántos Berries quiere gastar hoy para jugar a la consola. Al darle al botón "Canjear Tiempo", ese número se resta de su Saldo Actual.

Crea la estructura base, la navegación y las Pantallas 1 y 2 con un diseño espectacular, inmersivo y fácil de usar para un niño de 7 años.

Paso 2: Ampliar el Módulo Académico

Una vez que Lovable haya generado la estructura base de la aplicación y veas que la suma y resta de Berries funciona, introduce este segundo prompt para crear la zona de estudio.

Copia y pega lo siguiente:

¡Perfecto! Ahora vamos a desarrollar la PANTALLA 3: ENTRENAMIENTO (Refuerzo escolar). Esta sección permite ganar Berries extra si el niño los necesita, superando pequeños minijuegos.

Crea un diseño de tarjetas de selección para 3 áreas de entrenamiento: 1. **Matemáticas del Cocinero:** Genera un minijuego donde aparezca una operación sencilla de suma o resta (ej: 15 + 7). El niño debe elegir la respuesta correcta entre 3 opciones. Si acierta, gana 5 Berries. 2. **Inglés de Navegación (Flashcards):** Crea un sistema de tarjetas interactivas (flashcards) que se volteen al tocarlas. Diseña las tarjetas utilizando códigos de colores para el fondo dependiendo de la categoría de la palabra (por ejemplo, rojo para verbos, azul para objetos), e incluye un pequeño texto con reglas mnemotécnicas visuales debajo del vocabulario para facilitar la memorización. Si voltea 5 tarjetas, gana 5 Berries. 3. **Lectura de Bitácora:** Muestra un pequeño texto de 3 líneas sobre una aventura pirata. Debajo, pon una pregunta de comprensión lectora con dos botones (Verdadero/Falso). Si acierta, gana 5 Berries.

Añade la lógica para que los Berries ganados aquí también se sumen al Saldo Actual, respetando siempre el límite de 240 semanales.

Paso 3: El Gran Mapa (El Premio Físico)

Cuando lo anterior funcione, lanza el último bloque para gestionar la recompensa del muñeco físico.

Copia y pega lo siguiente:

Genial. Para terminar, desarrolla la PANTALLA 4: EL GRAN MAPA. Esta pantalla es estática pero muy visual y motivadora, destinada a un premio físico mensual.

- Diseña un pergamino grande que represente un mapa del tesoro dividido en 4 casillas gigantes (representando las 4 semanas del mes). - Debe haber un botón maestro protegido (que idealmente pulsa el padre) que diga "Completar Semana". - Al pulsarlo, se estampa un sello de "CONSEGUIDO" o aparece un trozo del mapa en una de las casillas en blanco. - Cuando las 4 casillas están llenas, la pantalla debe lanzar una lluvia de confeti y mostrar un mensaje gigante: "¡HAS ENCONTRADO EL TESORO LEGENDARIO! Reclama tu figura al Capitán (Papi)".

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/12e4edda-2e43-4107-aaca-3547a5394316).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
