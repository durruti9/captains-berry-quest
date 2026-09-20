# Corregir el Gran Mapa por días

## Resultado
- Cada una de las 4 semanas mostrará sus 7 días por separado, con nombre del día, fecha y una barra de progreso propia.
- Cada barra usará el porcentaje real de tareas completadas ese día, limitado entre 0% y 100% para evitar cifras incoherentes.
- Los días laborables serán verdes con un 85% o más, naranjas desde el 50% y rojos por debajo del 50%.
- Sábados y domingos aparecerán siempre en amarillo y como objetivo cumplido, aunque las tareas realizadas seguirán sumando Doblones.
- El resultado semanal se calculará únicamente con los días laborables transcurridos; los fines de semana no afectarán a la media.

## Pantallas
- Aplicar la nueva visualización tanto en el Gran Mapa del grumete como en “Mapa del Tesoro” del Rey Pirata.
- Mantener la aprobación manual del Rey Pirata y el premio final al completar las cuatro semanas.

## Detalles técnicos
- Añadir un cálculo diario compartido que cuente únicamente tareas actuales y sin duplicados.
- Recalcular el porcentaje semanal a partir del total de tareas válidas de lunes a viernes.
- Mantener intacto el cálculo de Doblones: completar tareas en fin de semana sigue premiando igual.
- Verificar el resultado en pantalla para escritorio/tablet y comprobar que no haya errores.
