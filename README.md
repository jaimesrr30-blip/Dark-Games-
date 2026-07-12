# Piloto Cúbico: Mundo Abierto

Prototipo jugable de un juego de mundo abierto que combina exploración libre con
partidos de "fútbol con coches" (estilo Rocket League), progresión RPG,
coleccionismo y un sistema de mascotas con poderes. Coches y personajes con
estética low-poly / cúbica, construido en 3D con Three.js + TypeScript + Vite.

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

- **W / S** o **flechas arriba/abajo**: acelerar / frenar-retroceder
- **A / D** o **flechas izquierda/derecha**: girar
- **Shift**: turbo (consume el medidor de boost)
- **Espacio**: saltar (doble salto disponible)
- **E**: interactuar (hablar con NPC, abrir cofres, recoger mascotas, entrar a
  portales/estadios)
- Botones en pantalla: **Misiones**, **Inventario**, **Garaje**

## Qué incluye este prototipo

- Mundo abierto único con 8 regiones temáticas + una plaza central (Hub),
  cada una con su propio color de terreno, cielo, niebla, clima y props.
- Ciclo de día/noche dinámico y clima por región (lluvia, nieve, arena, ceniza).
- Coche con física arcade (aceleración, giro, turbo, salto, colisiones básicas).
- NPCs cúbicos con diálogo y misiones (principales, secundarias, especiales y
  ocultas), con seguimiento de objetivos en el HUD.
- Cofres y mascotas coleccionables repartidos por el mapa, con **sistema de
  rarezas de 9 niveles**: Común, Poco Común, Raro, Épico, Legendario, Dios,
  Secreto, Divino y Prohibido.
- **Sistema de mascotas con poderes en partido**: cada mascota da un poder
  distinto (recarga de turbo, golpe más fuerte, efecto de curva en el balón,
  salto más alto, escudo defensivo o imán de balón); cuanto mejor la rareza,
  más fuerte el efecto.
- Portales de viaje rápido (incluye uno secreto).
- Partidos de fútbol con coches en estadios temáticos: balón y coches
  flotantes, porterías elevadas, marcador, temporizador y un compañero/rivales
  controlados por IA.
- Un jefe único por región (coche especial, introducción cinematográfica
  simplificada, música/tema propio del estadio) que se derrota jugando un
  partido 1 contra 1; al vencerlo se registra el progreso de la historia.
- Economía con monedas y diamantes, niveles/XP, tienda de cosméticos y
  garaje con vista previa 3D giratoria del coche (arrastra para rotar).
- Guardado de partida automático en `localStorage` (botón "Continuar").

## Limitaciones conocidas / lo que NO incluye

Esto es una **vertical slice** jugable, no un juego con cientos de horas de
contenido como pediste en la idea original. Cosas que se simplificaron a
propósito:

- **Música**: no se incluye música con derechos de autor. No hay banda
  sonora real por región; se puede añadir después con archivos de audio
  propios.
- **Modelos 3D**: personajes y coches son geometría low-poly/cúbica generada
  por código (tal y como aceptaste), no modelos modelados a mano ni animados
  con esqueletos.
- **Cantidad de contenido**: hay un puñado de misiones, cofres, mascotas y
  NPCs por región (no cientos), pensado como base extensible mediante los
  archivos de datos en `src/data/` (añadir más entradas es sencillo, no
  requiere tocar la lógica del juego).
- **Partidos**: son 1v1 (jefes) o 2v2 (partidos normales) con físicas arcade
  simplificadas, sin colisiones de coche-coche perfectamente realistas.
- **Rendimiento**: se optimizó fusionando la geometría decorativa por región
  y limitando las luces dinámicas para que corra fluido en un navegador con
  aceleración por GPU real. (En este entorno de pruebas sandbox, sin GPU,
  el renderizado es por software y por tanto más lento; en un navegador
  normal debería ir a 60 fps sin problema.)

## Estructura del proyecto

```
src/
  data/       -> configuración de rarezas, regiones, items, mascotas, misiones, NPCs, spawns
  state/      -> estado global del juego (economía, inventario, progreso, guardado)
  world/      -> generación del mundo (terreno, cielo, clima, props, cofres, portales)
  entities/   -> coche del jugador y NPCs
  match/      -> partidos: balón, estadio, IA, marcador, jefes
  ui/         -> HUD, menús, garaje 3D, tienda, diálogos
  main.ts     -> punto de entrada, conecta todos los sistemas
```
