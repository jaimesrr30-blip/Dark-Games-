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

- **Historia introductoria** al empezar una partida nueva.
- **El cohete y el Sistema Solar**: en el Reino Celestial, el Ingeniero Vex
  pide reunir las 4 piezas de un cohete escondidas por el mapa más el motor
  que suelta el Campeón Eterno al ser derrotado. Al entregárselo con todo
  completo se dispara una escena narrativa, una animación de despegue (el
  cohete sale desde tu posición, cruza la atmósfera y el cielo se llena de
  estrellas) y llegas a una vista del **Sistema Solar**: una pantalla propia
  en 2D con un sol brillante y los 3 planetas orbitando, navegable con A/D y
  una flecha roja rebotante como en el resto del juego. Viajar a un planeta
  dispara una animación de "salto" (líneas de velocidad tipo hiperespacio)
  antes de aterrizar. El Sistema Solar queda accesible en cualquier momento
  con el botón "🚀 Sistema Solar" del HUD.
- **3 planetas** (Planeta Escarlata, Anillos de Kaion, Luna de Cristal),
  cada uno con mapas más grandes que las etapas terrestres y con la misma
  profundidad de contenido que un mundo normal: 3 guardianes con llave, un
  jefe propio, vendedor y comprador de mascotas exclusivos, guarida, puerta
  secreta, mascotas/cofres, decoración temática (chozas/puestos colocados a
  propósito junto a los NPCs, no al azar) y varias misiones secundarias
  propias además de las que genera el resto de sistemas.
- **Las llaves de los planetas no están ahí sin más**: cada guardián vive en
  una zona bloqueada que hay que desbloquear a mano y con una mecánica
  distinta por planeta —
  **Planeta Escarlata**: reúne tablones de piedra escondidos y constrúyele
  un puente; **Anillos de Kaion**: encuentra núcleos de energía y activa un
  generador antigravedad que eleva la plataforma; **Luna de Cristal**:
  encuentra un cristal resonante y actívalo en el altar para abrir el domo.
  Cruzar el puente/subir a la plataforma/entrar al domo te **teletransporta a
  una zona propia y decorada** (una pequeña dimensión aparte, con su propia
  ambientación temática), donde vive el guardián. Allí no pide dinero ni
  partido: pide un favor personal (encontrarle algo que perdió en otra parte
  del planeta —hay que volver a salir a buscarlo—, desde un móvil hasta un
  casco de piloto) y solo entonces da la llave.
- **Naves locales y combustible estelar**: cada planeta esconde 3 piezas de
  una nave propia, muy repartidas por todo el mapa. El mecánico del planeta
  las monta —después de derrotar a su jefe— pero además necesita 5 unidades
  de combustible estelar: se consiguen completando misiones secundarias del
  planeta (dan de sobra si las completas casi todas) o comprando lo que
  falte, caro, directamente al mecánico. Con todo listo reconstruye la nave
  y desbloquea el siguiente planeta, con su propia animación de despegue.
  Derrotar al jefe solo no basta para avanzar: hace falta también la nave.
- **9 etapas** (Plaza Central + 8 zonas temáticas: ciudad futurista, desierto,
  bosque mágico, volcán, reino helado, islas flotantes, laboratorio, reino
  celestial), cada una un área 2D abierta con su propia ambientación,
  decoración temática y **puntos de referencia únicos** (una fuente en la
  Plaza Central, una fogata junto al Druida Finn, estatuas en las grandes
  plazas).
- **Sistema de llaves de guardianes**: 3 guardianes por etapa, cada uno con
  su propia llave. Al hablarles negocias: pagar sus monedas de entrada y
  jugarte la llave en un partido obligatorio (si pierdes, no hay segunda
  oportunidad gratis), o irte y volver más tarde si no tienes suficiente.
  Reunir las 3 llaves de una etapa abre la puerta de su jefe. El Desierto
  Solar tiene además un guardián especial: hay que encontrar 3 botones de
  piedra escondidos por el mapa y llevarlos a una pirámide para conseguir su
  llave. Los partidos contra guardianes se juegan en un campo con los
  colores de una etapa distinta a la que estás, para que se note diferente.
- **Dos NPCs esenciales por etapa**: un vendedor con un catálogo de objetos
  exclusivo y temático (cada tienda vende cosas distintas), y un comprador
  de mascotas que paga más cuanto mayor sea la rareza de la mascota que le
  vendas.
- **Mochila de llaves**: una pestaña "Llaves" dentro del Inventario muestra,
  agrupadas por etapa, las llaves de guardián que ya tienes (p. ej. "Llave
  de Desierto Solar") y las que aún te faltan, junto al nombre del guardián
  que las custodia.
- **Ceremonia de apertura del portal del jefe**: al reunir las 3 llaves de
  una etapa y llegar a la puerta del jefe, la cámara se centra en tu coche
  mientras las 3 llaves vuelan hacia él y un portal se abre antes de entrar
  al duelo.
- **Decenas de misiones por etapa** (principales, secundarias, especiales y
  ocultas): hablar con NPCs, ganar partidos, recolectar cofres/mascotas,
  conseguir llaves, vender mascotas y descubrir secretos. El registro de
  misiones permite filtrar por etapa concreta.
- **Puertas secretas**: una por etapa, escondidas en el mapa. Al entrar
  apareces en un pequeño interior con un cofre que da un objeto exclusivo de
  garaje/inventario y monedas.
- **Guaridas**: una guarida por etapa con un enemigo esperando dentro; es su
  propia misión secundaria ("entra y derrota a alguien"). Al vencerlo en un
  partido consigues monedas y, en algunas guaridas, también un objeto.
- Coche y NPCs representados como cuadrados/cubos de colores, sin ruedas ni
  detalle 3D.
- Cofres y mascotas coleccionables por etapa, con **sistema de rarezas de 9
  niveles**: Común, Poco Común, Raro, Épico, Legendario, Dios, Secreto,
  Divino y Prohibido. Los objetos más "chetos" (Prohibido, Vacío Secreto,
  Sangre de Dios, Borde Celestial) tienen un color animado que pulsa entre
  sus dos tonos en el coche, tanto en el mundo como en el garaje.
- **Sistema de mascotas con poderes en partido**: cada mascota da un poder
  distinto (recarga de turbo, golpe más fuerte, efecto de curva en el balón,
  impulso de velocidad, escudo defensivo o imán de balón); cuanto mejor la
  rareza, más fuerte el efecto. Durante el partido hay una insignia con el
  nombre de tu mascota y su poder, y confirmación visual de que el poder
  está activo: un aro alrededor de tu coche mientras el imán tira del balón,
  un rayo junto al turbo cuando se recarga más rápido, y textos como
  "¡GOLPE FUERTE!" o "¡ESCUDO!" al ocurrir el efecto.
- **Partidos normales** ("campo de entrenamiento"): campo 2D con línea
  central discontinua y porterías tipo corchete a los lados, balón flotante,
  marcador, contador de toques y barra de turbo.
- **Partidos de jefe**: mismo objetivo de marcar goles, pero en una arena
  mucho más grande tipo laberinto (paredes simétricas al estilo Pacman) con
  monedas repartidas para recoger durante el partido.
- **Explosión de gol animada** al marcar, usando el color (o los dos colores,
  en los objetos más nuevos) del objeto de "explosión de gol" equipado; la
  cantidad de partículas y el alcance del destello crecen con la rareza del
  objeto. Hay explosiones exclusivas nuevas por etapa (neón en la ciudad,
  tormenta de arena en el desierto, hojas mágicas en el bosque, ventisca en
  el reino helado, aurora en las islas, lluvia de datos en el laboratorio).
- **Dificultad progresiva**: los rivales de entrenamiento, guardianes y
  jefes son más rápidos y agresivos cuanto más avanzada esté la etapa. La IA
  predice la trayectoria del balón en vez de perseguir solo su posición
  actual, se defiende colocándose entre el balón y su portería, y con más
  habilidad dirige mejor el golpe hacia el centro de la portería rival y usa
  el turbo con más agresividad.
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
- **Partidos**: son 1 contra 1, con física arcade simplificada (sin
  colisiones de coche-coche perfectamente realistas).
- El Sistema Solar tiene 3 planetas por ahora; añadir más sigue el mismo
  patrón de datos que los 3 actuales (etapa + NPCs + spawns + misiones).
- La mecánica "resonancia" de la Luna de Cristal usa un único cristal por
  guardián (no una secuencia de orden en un altar compartido); mantiene la
  exploración y el desbloqueo del domo, pero simplifica el puzzle de orden.

## Estructura del proyecto

```
src/
  data/       -> rarezas, etapas, items, tiendas, mascotas, misiones, NPCs/guardianes, cofres/spawns, zonas de guardián
  state/      -> estado global del juego (economía, inventario, llaves, progreso, guardado)
  core/       -> entrada de teclado, cámara 2D
  entities/   -> coche del jugador y NPCs (dibujo 2D en canvas)
  stage/      -> renderizado de cada etapa (fondo, props, landmarks, interiores secretos, zonas de guardián)
  match2d/    -> partidos: balón, campo, laberinto de jefe, IA, marcador, explosión de gol
  ui/         -> HUD, menús, mapa de etapas, garaje, tienda, negociación con guardianes, diálogos
  main.ts     -> punto de entrada, conecta todos los sistemas
```
