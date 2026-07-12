# Piloto Cúbico

Prototipo jugable en 2D: un coche cúbico recorre etapas temáticas resolviendo
misiones, recogiendo mascotas de distintas rarezas y jugando partidos de
"fútbol con coches" estilo Pong/Pacman contra jefes. Construido con
TypeScript + Canvas 2D + Vite (sin motor 3D).

## Cómo ejecutarlo

```bash
npm install
npm run dev
```

Abre la URL que muestre la terminal (normalmente `http://localhost:5173`).

Para compilar una build de producción:

```bash
npm run build
npm run preview
```

## Controles

- **WASD** o **flechas**: moverse en 8 direcciones
- **Espacio**: turbo (consume el medidor de boost)
- **E**: interactuar (hablar con NPC, abrir cofres, recoger mascotas, entrar
  al campo de entrenamiento o a la puerta del jefe)
- Botones en pantalla: **Mapa**, **Misiones**, **Inventario**, **Garaje**

## Qué incluye este prototipo

- **9 etapas** (Plaza Central + 8 zonas temáticas: ciudad futurista, desierto,
  bosque mágico, volcán, reino helado, islas flotantes, laboratorio, reino
  celestial), cada una un área 2D abierta y delimitada con su propia
  ambientación y decoración (árboles, cactus, rocas, farolas, nubes...).
- **Progresión por etapas**: cada etapa pide completar 3 misiones y una
  cantidad de monedas (creciente por etapa) para desbloquear la puerta del
  jefe; al derrotarlo se desbloquea la siguiente etapa. El viaje entre etapas
  desbloqueadas se hace desde el **Mapa de Etapas**.
- Coche y NPCs representados como cuadrados/cubos de colores, sin ruedas ni
  detalle 3D, tal y como se pidió.
- NPCs con diálogo y misiones (principales, secundarias y especiales), con
  seguimiento de objetivos en el HUD.
- Cofres y mascotas coleccionables por etapa, con **sistema de rarezas de 9
  niveles**: Común, Poco Común, Raro, Épico, Legendario, Dios, Secreto,
  Divino y Prohibido.
- **Sistema de mascotas con poderes en partido**: cada mascota da un poder
  distinto (recarga de turbo, golpe más fuerte, efecto de curva en el balón,
  escudo defensivo o imán de balón); cuanto mejor la rareza, más fuerte el
  efecto.
- **Partidos normales** ("campo de entrenamiento"): campo 2D con línea
  central discontinua y porterías tipo corchete a los lados, balón flotante,
  marcador, contador de toques y barra de turbo — inspirado directamente en
  la referencia que se compartió.
- **Partidos de jefe**: mismo objetivo de marcar goles, pero en una arena
  mucho más grande tipo laberinto (paredes simétricas al estilo Pacman) con
  monedas repartidas para recoger durante el partido.
- Economía con monedas y diamantes, niveles/XP, tienda de cosméticos y
  garaje con vista previa 2D del coche.
- Menús de selección con tarjetas y una flechita roja que rebota sobre el
  elemento elegido (mascota activa, pieza equipada, etapa actual), en el
  estilo del vídeo de referencia.
- Guardado de partida automático en `localStorage` (botón "Continuar"),
  incluida la etapa y posición donde te quedaste.

## Limitaciones conocidas / lo que NO incluye

Esto es una **vertical slice** jugable, no un juego con cientos de horas de
contenido. Cosas que se simplificaron a propósito:

- **Música**: no se incluye música con derechos de autor. Se puede añadir
  después con archivos de audio propios.
- **Cantidad de contenido**: hay un puñado de misiones, cofres, mascotas y
  NPCs por etapa (no cientos), pensado como base extensible mediante los
  archivos de datos en `src/data/` (añadir más entradas es sencillo, no
  requiere tocar la lógica del juego).
- **Partidos**: son 1 contra 1, con física arcade simplificada (sin
  colisiones de coche-coche perfectamente realistas).

## Estructura del proyecto

```
src/
  data/       -> rarezas, etapas, items, mascotas, misiones, NPCs, cofres/spawns
  state/      -> estado global del juego (economía, inventario, progreso, guardado)
  core/       -> entrada de teclado, cámara 2D
  entities/   -> coche del jugador y NPCs (dibujo 2D en canvas)
  stage/      -> renderizado de cada etapa (fondo, props, cofres, puerta del jefe)
  match2d/    -> partidos: balón, campo, laberinto de jefe, IA, marcador
  ui/         -> HUD, menús, mapa de etapas, garaje, tienda, diálogos
  main.ts     -> punto de entrada, conecta todos los sistemas
```
