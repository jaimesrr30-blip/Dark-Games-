# Piloto Cúbico

Prototipo jugable en 2D: un coche cúbico recorre etapas temáticas resolviendo
misiones, negociando llaves con guardianes, recogiendo y vendiendo mascotas de
distintas rarezas, y jugando partidos de "fútbol con coches" estilo
Pong/Pacman contra jefes. Construido con TypeScript + Canvas 2D + Vite (sin
motor 3D).

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
- **E**: interactuar (hablar con NPC, abrir cofres, recoger objetos, entrar
  al campo de entrenamiento, a una puerta secreta o a la puerta del jefe)
- Botones en pantalla: **Mapa**, **Misiones**, **Inventario**, **Garaje**

## Qué incluye este prototipo

- **Historia introductoria** al empezar una partida nueva, y una **escena
  final** al completar el cohete del Reino Celestial que deja abierta la
  puerta a una futura expansión (el sistema solar).
- **9 etapas** (Plaza Central + 8 zonas temáticas: ciudad futurista, desierto,
  bosque mágico, volcán, reino helado, islas flotantes, laboratorio, reino
  celestial), cada una un área 2D abierta con su propia ambientación,
  decoración temática y **puntos de referencia únicos** (una fuente en la
  Plaza Central, una fogata junto al Druida Finn, estatuas en las grandes
  plazas).
- **Sistema de llaves de guardianes**: 3 guardianes por etapa, cada uno con
  su propia llave. Al hablarles puedes negociar: pagar monedas, jugar un
  partido contra ellos y ganarlo, o irte y volver más tarde. Reunir las 3
  llaves de una etapa abre la puerta de su jefe. El Desierto Solar tiene
  además un guardián especial: hay que encontrar 3 botones de piedra
  escondidos por el mapa y llevarlos a una pirámide para conseguir su llave.
- **Dos NPCs esenciales por etapa**: un vendedor con un catálogo de objetos
  exclusivo y temático (cada tienda vende cosas distintas), y un comprador
  de mascotas que paga más cuanto mayor sea la rareza de la mascota que le
  vendas.
- **Decenas de misiones por etapa** (principales, secundarias, especiales y
  ocultas): hablar con NPCs, ganar partidos, recolectar cofres/mascotas,
  conseguir llaves, vender mascotas y descubrir secretos. El registro de
  misiones permite filtrar por etapa concreta.
- **Puertas secretas**: una por etapa, escondidas en el mapa. Al entrar
  apareces en un pequeño interior con un cofre que da un objeto exclusivo de
  garaje/inventario y monedas.
- Coche y NPCs representados como cuadrados/cubos de colores, sin ruedas ni
  detalle 3D.
- Cofres y mascotas coleccionables por etapa, con **sistema de rarezas de 9
  niveles**: Común, Poco Común, Raro, Épico, Legendario, Dios, Secreto,
  Divino y Prohibido.
- **Sistema de mascotas con poderes en partido**: cada mascota da un poder
  distinto (recarga de turbo, golpe más fuerte, efecto de curva en el balón,
  escudo defensivo o imán de balón); cuanto mejor la rareza, más fuerte el
  efecto.
- **Partidos normales** ("campo de entrenamiento"): campo 2D con línea
  central discontinua y porterías tipo corchete a los lados, balón flotante,
  marcador, contador de toques y barra de turbo.
- **Partidos de jefe**: mismo objetivo de marcar goles, pero en una arena
  mucho más grande tipo laberinto (paredes simétricas al estilo Pacman) con
  monedas repartidas para recoger durante el partido.
- **Explosión de gol animada** al marcar, usando el color del objeto de
  "explosión de gol" que tengas equipado.
- **Dificultad progresiva**: los rivales de entrenamiento, guardianes y
  jefes son más rápidos y agresivos cuanto más avanzada esté la etapa.
- **Piezas de cohete**: 4 piezas escondidas por el Reino Celestial más el
  motor que suelta el Campeón Eterno al ser derrotado completan el final.
- Economía con monedas y diamantes, niveles/XP, tienda de cosméticos y
  garaje con vista previa 2D del coche (con animación de entrada).
- Menús de selección con tarjetas y una flechita roja que rebota sobre el
  elemento elegido (mascota activa, pieza equipada, etapa actual).
- Guardado de partida automático en `localStorage` (botón "Continuar"),
  incluida la etapa y posición donde te quedaste.

## Limitaciones conocidas / lo que NO incluye

- **Música**: no se incluye música con derechos de autor. Se puede añadir
  después con archivos de audio propios.
- **Sistema solar / mundos-planeta**: quedó como gancho narrativo en la
  escena final, pero no está construido todavía (es contenido enorme:
  NPCs, misiones, jefes y partidos nuevos por cada planeta).
- **Partidos**: son 1 contra 1, con física arcade simplificada (sin
  colisiones de coche-coche perfectamente realistas).

## Estructura del proyecto

```
src/
  data/       -> rarezas, etapas, items, tiendas, mascotas, misiones, NPCs/guardianes, cofres/spawns
  state/      -> estado global del juego (economía, inventario, llaves, progreso, guardado)
  core/       -> entrada de teclado, cámara 2D
  entities/   -> coche del jugador y NPCs (dibujo 2D en canvas)
  stage/      -> renderizado de cada etapa (fondo, props, landmarks, interiores secretos)
  match2d/    -> partidos: balón, campo, laberinto de jefe, IA, marcador, explosión de gol
  ui/         -> HUD, menús, mapa de etapas, garaje, tienda, negociación con guardianes, diálogos
  main.ts     -> punto de entrada, conecta todos los sistemas
```
