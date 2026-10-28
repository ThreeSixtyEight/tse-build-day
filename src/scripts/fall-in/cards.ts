// Placeholder paper cutouts for the fall-in scene, drawn on canvases in the video's palette.
// Each draw* returns a canvas that becomes a texture. Replace with Nano Banana cutouts (transparent PNGs) when they land.

export type Item = 'handkerchief' | 'umbrella' | 'fan' | 'tambourine';

const INK = '#1d1d1b';
const SKIN = ['#8d5524', '#c68642', '#e0ac69', '#5c3a21', '#a0672e', '#f1c27d'];
const SHIRTS = ['#ffffff', '#e76f9a', '#f2c84b', '#3fa7a0', '#6aa84f', '#ef6f5a', '#ffffff', '#7fb3d5'];
const PANTS = ['#3d5a80', '#c9b27c', '#2b2b2b', '#5b6b7a', '#f4f1ea'];
const UMBRELLAS = ['#f4c430', '#ef6fa8', '#f39c4a'];
const WALLS = ['#a6493a', '#b5553f', '#8f3f33', '#e8d9b5', '#8fbfa6', '#e9c46a', '#7d9bb0', '#a6493a'];
const BRASS = '#d4a017';

function canvas(w: number, h: number, reuse?: HTMLCanvasElement) {
  const c = reuse ?? document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  return [c, ctx] as const;
}

function shape(ctx: CanvasRenderingContext2D, fill: string, draw: () => void, line = 4) {
  ctx.beginPath();
  draw();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = line;
  ctx.strokeStyle = INK;
  ctx.stroke();
}

export function drawSky() {
  const [c, ctx] = canvas(8, 512);
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#4fa6e0');
  g.addColorStop(0.6, '#9fd3ef');
  g.addColorStop(1, '#e2f2f8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 8, 512);
  return c;
}

export function drawStreet() {
  const [c, ctx] = canvas(256, 256);
  ctx.fillStyle = '#8b8e93';
  ctx.fillRect(0, 0, 256, 256);
  // Patches and cracks: old asphalt, no lane lines.
  for (let i = 0; i < 18; i++) {
    ctx.fillStyle = i % 2 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
    ctx.fillRect((i * 97) % 256, (i * 61) % 256, 30 + ((i * 13) % 40), 14 + ((i * 7) % 30));
  }
  ctx.strokeStyle = 'rgba(29,29,27,0.45)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 7; i++) {
    let x = (i * 71) % 256;
    let y = (i * 113) % 256;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < 5; s++) {
      x += ((s * 17 + i * 5) % 21) - 10;
      y += 9;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  return c;
}

/** A townhouse front: shuttered doors below, windows above the balcony line at 4.3 units. */
export function drawFacade(seed: number, w: number, h: number) {
  const PX = 32;
  const W = w * PX;
  const H = h * PX;
  const [c, ctx] = canvas(W, H);
  const y = (u: number) => H - u * PX;
  const wall = WALLS[seed % WALLS.length];
  const shutter = seed % 3 === 0 ? '#2f6b4f' : seed % 3 === 1 ? '#3b7a57' : '#1f4e3d';

  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, W, H);
  // Brick coursing on the red houses.
  if (wall === '#a6493a' || wall === '#8f3f33' || wall === '#b5553f') {
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    for (let row = 0; row < H; row += 8) {
      ctx.beginPath();
      ctx.moveTo(0, row);
      ctx.lineTo(W, row);
      ctx.stroke();
    }
  }

  const cols = Math.max(2, Math.floor(w / 2.2));
  const step = W / cols;
  const floors = h >= 11.5 ? [4.6, 8.4] : [4.6];
  for (let i = 0; i < cols; i++) {
    const cx = step * (i + 0.5);
    // Door with an arched top and shutters.
    const dw = 1.1 * PX;
    shape(ctx, '#2b2b2b', () => {
      ctx.moveTo(cx - dw / 2, y(0));
      ctx.lineTo(cx - dw / 2, y(2.6));
      ctx.arc(cx, y(2.6), dw / 2, Math.PI, 0);
      ctx.lineTo(cx + dw / 2, y(0));
      ctx.closePath();
    });
    for (const s of [-1, 1]) {
      shape(ctx, shutter, () => ctx.rect(cx + s * dw / 2 + (s < 0 ? -0.45 * PX : 0), y(3.1), 0.45 * PX, 3.1 * PX), 3);
    }
    for (const f of floors) {
      const ww = 0.9 * PX;
      shape(ctx, '#33424d', () => ctx.rect(cx - ww / 2, y(f + 2.2), ww, 2.2 * PX));
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, y(f + 2.2));
      ctx.lineTo(cx, y(f));
      ctx.stroke();
      for (const s of [-1, 1]) {
        shape(ctx, shutter, () => ctx.rect(cx + s * ww / 2 + (s < 0 ? -0.4 * PX : 0), y(f + 2.2), 0.4 * PX, 2.2 * PX), 3);
      }
    }
    // Hanging ferns on some balconies.
    if ((seed + i) % 3 === 0) {
      shape(ctx, '#4f8a3a', () => ctx.ellipse(cx + step * 0.3, y(3.7), 0.5 * PX, 0.35 * PX, 0, 0, Math.PI * 2), 3);
    }
  }
  // Cornice.
  shape(ctx, '#e9e2cf', () => ctx.rect(-4, 0, W + 8, 0.45 * PX), 3);
  ctx.lineWidth = 6;
  ctx.strokeStyle = INK;
  ctx.strokeRect(0, 0, W, H);
  return c;
}

/** Iron balcony rail; tiles horizontally. */
export function drawRail() {
  const [c, ctx] = canvas(64, 64);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.lineTo(64, 4);
  ctx.moveTo(0, 60);
  ctx.lineTo(64, 60);
  for (let x = 4; x < 64; x += 12) {
    ctx.moveTo(x, 4);
    ctx.lineTo(x, 60);
  }
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(32, 32, 9, 0, Math.PI * 2);
  ctx.stroke();
  return c;
}

/**
 * One second liner. Every fourth card carries an umbrella (taller card); some wave handkerchiefs; a few play brass.
 * No faces: these are generic figures, not portraits of anyone.
 */
export function drawFigure(i: number) {
  const W = 140;
  const H = 256;
  const [c, ctx] = canvas(W, H);
  const umbrella = i % 4 === 0;
  const fig = umbrella ? H * 0.68 : H;
  const top = H - fig;
  const s = fig / 256;
  const cx = W / 2;
  const skin = SKIN[i % SKIN.length];
  const shirt = SHIRTS[(i * 3) % SHIRTS.length];
  const pants = PANTS[(i * 5) % PANTS.length];
  const waving = i % 3 === 1;
  const tuba = i % 8 === 3;
  const trumpet = i % 8 === 7;
  const Y = (v: number) => top + v * s;

  // Legs.
  shape(ctx, pants, () => {
    ctx.rect(cx - 22 * s, Y(150), 19 * s, 104 * s);
    ctx.rect(cx + 3 * s, Y(150), 19 * s, 104 * s);
  });
  // Arms first, so the torso overlaps the shoulders.
  if (waving || umbrella) {
    shape(ctx, skin, () => {
      ctx.moveTo(cx + 22 * s, Y(80));
      ctx.lineTo(cx + 40 * s, Y(20));
      ctx.lineTo(cx + 52 * s, Y(24));
      ctx.lineTo(cx + 34 * s, Y(88));
      ctx.closePath();
    });
  } else {
    shape(ctx, skin, () => ctx.rect(cx + 24 * s, Y(78), 12 * s, 62 * s));
  }
  shape(ctx, skin, () => ctx.rect(cx - 36 * s, Y(78), 12 * s, 62 * s));
  // Torso.
  shape(ctx, shirt, () => {
    ctx.moveTo(cx - 28 * s, Y(72));
    ctx.lineTo(cx + 28 * s, Y(72));
    ctx.lineTo(cx + 24 * s, Y(156));
    ctx.lineTo(cx - 24 * s, Y(156));
    ctx.closePath();
  });
  // Head, hair, sometimes a straw hat.
  shape(ctx, skin, () => ctx.arc(cx, Y(46), 22 * s, 0, Math.PI * 2));
  shape(ctx, '#2a1d14', () => ctx.arc(cx, Y(40), 22 * s, Math.PI * 1.05, Math.PI * 1.95), 3);
  if (i % 5 === 2) {
    shape(ctx, '#d9b36b', () => ctx.ellipse(cx, Y(28), 34 * s, 8 * s, 0, 0, Math.PI * 2), 3);
    shape(ctx, '#d9b36b', () => ctx.rect(cx - 16 * s, Y(10), 32 * s, 18 * s), 3);
  }
  if (waving && !umbrella) {
    shape(ctx, '#ffffff', () => {
      ctx.moveTo(cx + 46 * s, Y(22));
      ctx.quadraticCurveTo(cx + 64 * s, Y(0), cx + 66 * s, Y(10));
      ctx.quadraticCurveTo(cx + 58 * s, Y(26), cx + 48 * s, Y(30));
      ctx.closePath();
    }, 3);
  }
  if (tuba) {
    ctx.lineWidth = 10 * s;
    ctx.strokeStyle = BRASS;
    ctx.beginPath();
    ctx.arc(cx, Y(110), 30 * s, Math.PI * 0.2, Math.PI * 1.6);
    ctx.stroke();
    shape(ctx, BRASS, () => ctx.ellipse(cx + 18 * s, Y(66), 22 * s, 10 * s, -0.3, 0, Math.PI * 2), 3);
  }
  if (trumpet) {
    shape(ctx, BRASS, () => ctx.rect(cx + 10 * s, Y(52), 44 * s, 7 * s), 3);
    shape(ctx, BRASS, () => {
      ctx.moveTo(cx + 54 * s, Y(48));
      ctx.lineTo(cx + 66 * s, Y(42));
      ctx.lineTo(cx + 66 * s, Y(68));
      ctx.lineTo(cx + 54 * s, Y(62));
      ctx.closePath();
    }, 3);
  }
  if (umbrella) drawUmbrella(ctx, cx + 4, top + 22 * s, 64, UMBRELLAS[i % UMBRELLAS.length]);
  return c;
}

function drawUmbrella(ctx: CanvasRenderingContext2D, handX: number, handY: number, r: number, color: string) {
  const cy = handY - 70;
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.beginPath();
  ctx.moveTo(handX, handY);
  ctx.lineTo(handX, cy);
  ctx.stroke();
  shape(ctx, color, () => {
    ctx.moveTo(handX - r, cy);
    ctx.quadraticCurveTo(handX - r, cy - r * 0.85, handX, cy - r * 0.85);
    ctx.quadraticCurveTo(handX + r, cy - r * 0.85, handX + r, cy);
    ctx.closePath();
  });
  // Fringe.
  for (let x = -r + 8; x < r; x += 16) {
    shape(ctx, color, () => ctx.arc(handX + x, cy + 2, 7, 0, Math.PI), 2.5);
  }
}

/** The visitor, seen from behind, holding the item they picked. Redraws into the same canvas. */
export function drawVisitor(item: Item, reuse: HTMLCanvasElement) {
  const W = 162;
  const H = 300;
  const [c, ctx] = canvas(W, H, reuse);
  const top = 76;
  const s = (H - top) / 256;
  const cx = W / 2 - 8;
  const Y = (v: number) => top + v * s;
  const skin = '#c68642';

  shape(ctx, '#34495e', () => {
    ctx.rect(cx - 22 * s, Y(150), 19 * s, 104 * s);
    ctx.rect(cx + 3 * s, Y(150), 19 * s, 104 * s);
  });
  // Raised right arm (screen right, since we see their back).
  shape(ctx, skin, () => {
    ctx.moveTo(cx + 20 * s, Y(84));
    ctx.lineTo(cx + 44 * s, Y(14));
    ctx.lineTo(cx + 58 * s, Y(20));
    ctx.lineTo(cx + 34 * s, Y(92));
    ctx.closePath();
  });
  shape(ctx, skin, () => ctx.rect(cx - 38 * s, Y(80), 13 * s, 64 * s));
  shape(ctx, '#ffffff', () => {
    ctx.moveTo(cx - 31 * s, Y(70));
    ctx.lineTo(cx + 31 * s, Y(70));
    ctx.lineTo(cx + 26 * s, Y(158));
    ctx.lineTo(cx - 26 * s, Y(158));
    ctx.closePath();
  });
  // Back of the head: hair, no face.
  shape(ctx, '#2a1d14', () => ctx.arc(cx, Y(44), 23 * s, 0, Math.PI * 2));
  shape(ctx, skin, () => ctx.rect(cx - 9 * s, Y(62), 18 * s, 10 * s), 3);

  const hx = cx + 52 * s;
  const hy = Y(14);
  if (item === 'handkerchief') {
    shape(ctx, '#ffffff', () => {
      ctx.moveTo(hx, hy);
      ctx.quadraticCurveTo(hx + 30, hy - 34, hx + 24, hy - 46);
      ctx.quadraticCurveTo(hx + 4, hy - 30, hx - 12, hy - 34);
      ctx.closePath();
    });
  } else if (item === 'umbrella') {
    drawUmbrella(ctx, hx, hy, 56, '#f4c430');
  } else if (item === 'fan') {
    shape(ctx, '#ef6fa8', () => {
      ctx.moveTo(hx, hy);
      ctx.arc(hx, hy, 46, Math.PI * 1.15, Math.PI * 1.85);
      ctx.closePath();
    });
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    for (let a = 1.25; a < 1.85; a += 0.12) {
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + Math.cos(Math.PI * a) * 44, hy + Math.sin(Math.PI * a) * 44);
      ctx.stroke();
    }
  } else {
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#b5553f';
    ctx.beginPath();
    ctx.arc(hx, hy - 24, 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.beginPath();
    ctx.arc(hx, hy - 24, 29, 0, Math.PI * 2);
    ctx.stroke();
    for (let a = 0; a < 6; a++) {
      shape(ctx, '#e0e0e0', () => ctx.arc(hx + Math.cos(a) * 24, hy - 24 + Math.sin(a) * 24, 5, 0, Math.PI * 2), 2);
    }
  }
  return c;
}
