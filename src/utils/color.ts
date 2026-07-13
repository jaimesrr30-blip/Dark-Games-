export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(v, 16) || 0;
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function lerpColor(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const bl = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

// Colores de objetos "chetos" (secreto/divino/prohibido) que van y vienen entre
// sus dos tonos, como un brillo pulsante. `alt` es opcional: si no hay segundo
// color, se devuelve el color base sin animar.
export function animatedColor(base: string, alt: string | undefined, timeSeconds: number, periodSeconds = 2.2): string {
  if (!alt) return base;
  const phase = (Math.sin((timeSeconds / periodSeconds) * Math.PI * 2) + 1) / 2;
  return lerpColor(base, alt, phase);
}
