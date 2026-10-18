import * as THREE from 'three';

export interface FontStacks {
  serif: string;
  mono: string;
}

type DrawFn = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

export function makeCanvasTexture(w: number, h: number, draw: DrawFn, anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d')!, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

export function drawWood(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#c8833f');
  g.addColorStop(0.5, '#b87636');
  g.addColorStop(1, '#a96a30');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const rnd = seeded(7);
  for (let i = 0; i < 520; i++) {
    const y0 = rnd() * h;
    const amp = 1 + rnd() * 5;
    const fr = 0.002 + rnd() * 0.006;
    const ph = rnd() * 6.28;
    const dark = rnd() < 0.62;
    ctx.strokeStyle = dark
      ? `rgba(92,48,18,${0.05 + rnd() * 0.16})`
      : `rgba(236,176,104,${0.05 + rnd() * 0.12})`;
    ctx.lineWidth = 0.6 + rnd() * 2.2;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 16) {
      const y = y0 + Math.sin(x * fr + ph) * amp;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

export function drawWall(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#3a2d26';
  ctx.fillRect(0, 0, w, h);
  const rnd = seeded(11);
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = rnd() < 0.5 ? `rgba(255,220,190,${rnd() * 0.05})` : `rgba(0,0,0,${rnd() * 0.08})`;
    ctx.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2);
  }
}

export function drawWallGlow(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(1, h / w);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w / 2);
  g.addColorStop(0, 'rgba(255,170,80,0.95)');
  g.addColorStop(0.35, 'rgba(255,130,50,0.45)');
  g.addColorStop(1, 'rgba(255,100,30,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-w / 2, -w / 2, w, w);
  ctx.restore();
}

export function drawBulbGlow(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0, 'rgba(255,240,205,1)');
  g.addColorStop(0.25, 'rgba(255,205,140,0.55)');
  g.addColorStop(1, 'rgba(255,160,70,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/* ------------------------------------------------------------------ */
/* The "Archive" portfolio site that appears on the monitor            */
/* ------------------------------------------------------------------ */

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

interface CardArt {
  tag: string;
  draw: (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => void;
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  fonts: FontStacks,
  cx: number,
  cy: number,
  w: number,
  h: number,
  rot: number,
  title: string,
  titleSize: number,
  art: CardArt,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.shadowColor = 'rgba(0,0,0,0.28)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = '#fbf7ee';
  roundRect(ctx, -w / 2, -h / 2, w, h, 6);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  ctx.fillStyle = '#1b1b1b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 ${titleSize}px ${fonts.serif}`;
  ctx.fillText(title, 0, -h / 2 + 18 + titleSize);

  ctx.font = `400 13px ${fonts.mono}`;
  ctx.textAlign = 'left';
  ctx.fillText('December 2024', -w / 2 + 16, -h / 2 + 18 + titleSize + 34);
  ctx.textAlign = 'right';
  ctx.fillText(art.tag, w / 2 - 16, -h / 2 + 18 + titleSize + 34);

  const ix = -w / 2 + 14;
  const iy = -h / 2 + 18 + titleSize + 48;
  const iw = w - 28;
  const ih = h - (iy + h / 2) + 20;
  ctx.save();
  ctx.beginPath();
  ctx.rect(ix, iy, iw, ih);
  ctx.clip();
  art.draw(ctx, ix, iy, iw, ih);
  ctx.restore();
  ctx.restore();
}

export function drawSite(ctx: CanvasRenderingContext2D, W: number, H: number, fonts: FontStacks) {
  const { serif, mono } = fonts;
  ctx.fillStyle = '#f8eed6';
  ctx.fillRect(0, 0, W, H);

  // --- nav -----------------------------------------------------------
  ctx.fillStyle = '#f7c948';
  roundRect(ctx, 40, 22, 196, 52, 10);
  ctx.fill();
  ctx.strokeStyle = '#2b2208';
  ctx.lineWidth = 2;
  roundRect(ctx, 40, 22, 196, 52, 10);
  ctx.stroke();
  ctx.fillStyle = '#1a1405';
  ctx.font = `700 26px ${mono}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Archive', 56, 49);
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#1a1405';
  roundRect(ctx, 186, 34, 34, 28, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#1a1405';
  ctx.beginPath();
  ctx.arc(203, 48, 5, 0, 6.28);
  ctx.fill();

  ctx.font = `400 19px ${mono}`;
  (
    [
      ['Home', 290],
      ['About', 430],
      ['Projects', 570],
    ] as const
  ).forEach(([label, x], i) => {
    ctx.fillStyle = i === 0 ? '#7fb77e' : '#f8eed6';
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, 48, 17, 0, 6.28);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(x, 48, 4, 0, 6.28);
    ctx.fill();
    ctx.fillText(label, x + 28, 49);
  });

  (
    [
      ['#6da36f', 1190],
      ['#7d1a14', 1250],
      ['#f2c53a', 1310],
    ] as const
  ).forEach(([color, x]) => {
    ctx.fillStyle = color;
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, 48, 19, 0, 6.28);
    ctx.fill();
    ctx.stroke();
  });

  ctx.fillStyle = '#f8eed6';
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 2;
  roundRect(ctx, 1352, 20, 208, 56, 28);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#1a1a1a';
  ctx.textAlign = 'center';
  ctx.font = `400 20px ${mono}`;
  ctx.fillText('Contact', 1456, 49);

  // --- green hero panel ------------------------------------------------
  ctx.fillStyle = '#6fa571';
  roundRect(ctx, 40, 100, 1520, 900, 30);
  ctx.fill();
  ctx.save();
  roundRect(ctx, 40, 100, 1520, 900, 30);
  ctx.clip();
  ctx.strokeStyle = 'rgba(20,50,25,0.09)';
  ctx.lineWidth = 1;
  for (let gx = 40; gx < 1560; gx += 14) {
    ctx.beginPath();
    ctx.moveTo(gx, 100);
    ctx.lineTo(gx, 900);
    ctx.stroke();
  }
  for (let gy = 100; gy < 900; gy += 14) {
    ctx.beginPath();
    ctx.moveTo(40, gy);
    ctx.lineTo(1560, gy);
    ctx.stroke();
  }
  ctx.restore();

  // pill
  ctx.strokeStyle = '#f8f3e4';
  ctx.lineWidth = 2;
  ctx.fillStyle = 'rgba(111,165,113,0.9)';
  roundRect(ctx, 680, 142, 240, 46, 23);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f8f3e4';
  ctx.font = `400 19px ${mono}`;
  ctx.textAlign = 'center';
  ctx.fillText('Digital designer', 800, 166);

  // wordmark, scaled to a fixed width so fallback fonts still fit
  let size = 200;
  ctx.font = `900 ${size}px ${serif}`;
  size = (size * 880) / ctx.measureText('Archive').width;
  ctx.font = `900 ${size}px ${serif}`;
  ctx.fillStyle = '#0d0d0d';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Archive', 800, 374);

  // body copy
  ctx.fillStyle = '#16261a';
  ctx.font = `400 20px ${mono}`;
  ctx.fillText('Designing distinctive brand identities, digital experiences,', 800, 408);
  ctx.fillText('and visual systems that help businesses build recognition,', 800, 436);
  ctx.fillText('connect with audiences, and grow with confidence.', 800, 464);

  // buttons
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fbf7ee';
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 2;
  roundRect(ctx, 612, 492, 216, 58, 29);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#1a1a1a';
  ctx.font = `400 20px ${mono}`;
  ctx.fillText('Get to know me', 720, 522);
  ctx.fillStyle = '#3d93e0';
  ctx.strokeStyle = '#1a1a1a';
  roundRect(ctx, 852, 492, 176, 58, 29);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.fillText("Let's talk", 940, 522);
  ctx.textBaseline = 'alphabetic';

  // --- project cards, cut off by the bottom edge ------------------------
  drawCard(ctx, fonts, 244, 760, 380, 400, -0.01, 'FORMA', 50, {
    tag: 'Web design',
    draw: (c, x, y, w, h) => {
      c.fillStyle = '#d6c8b6';
      c.fillRect(x, y, w, h);
      c.fillStyle = '#b09c86';
      c.font = `italic 400 64px ${serif}`;
      c.textAlign = 'left';
      c.textBaseline = 'alphabetic';
      c.fillText('forma', x + 22, y + 82);
      c.fillStyle = '#4b4741';
      roundRect(c, x + 30, y + 130, w - 70, 90, 22);
      c.fill();
      c.fillStyle = '#625d55';
      roundRect(c, x + 18, y + 118, 56, 120, 18);
      c.fill();
      roundRect(c, x + w - 82, y + 118, 56, 120, 18);
      c.fill();
      c.fillStyle = '#d9d2c6';
      roundRect(c, x + 70, y + 126, w - 150, 44, 14);
      c.fill();
    },
  });

  drawCard(ctx, fonts, 590, 805, 340, 380, -0.085, 'COCO PUFF', 44, {
    tag: 'Digital experience',
    draw: (c, x, y, w, h) => {
      c.fillStyle = '#a9d3ee';
      c.fillRect(x, y, w, h);
      const spots: [number, number][] = [
        [0.2, 0.25],
        [0.55, 0.15],
        [0.8, 0.4],
        [0.35, 0.6],
        [0.7, 0.75],
        [0.12, 0.85],
      ];
      spots.forEach(([sx, sy], i) => {
        c.fillStyle = i % 2 ? '#f3f7fb' : '#ead9a6';
        c.beginPath();
        c.arc(x + sx * w, y + sy * h, 26 + (i % 3) * 8, 0, 6.28);
        c.fill();
      });
    },
  });

  drawCard(ctx, fonts, 960, 790, 360, 400, 0.04, 'VELVET', 50, {
    tag: '01 / 03',
    draw: (c, x, y, w, h) => {
      c.fillStyle = '#c9301c';
      c.fillRect(x, y, w, h);
      c.fillStyle = '#e8d7c4';
      c.fillRect(x + w * 0.05, y, w * 0.3, h);
      c.fillStyle = '#2a63c9';
      roundRect(c, x + w * 0.28, y + h * 0.42, w * 0.34, h * 0.36, 14);
      c.fill();
      c.strokeStyle = '#1a3f8f';
      c.lineWidth = 6;
      c.beginPath();
      c.arc(x + w * 0.45, y + h * 0.42, 34, Math.PI, 0);
      c.stroke();
      c.fillStyle = '#3a2418';
      c.fillRect(x + w * 0.62, y, w * 0.26, h * 0.55);
    },
  });

  drawCard(ctx, fonts, 1290, 840, 340, 400, 0.115, 'SOLE', 50, {
    tag: 'Product design',
    draw: (c, x, y, w, h) => {
      c.fillStyle = '#f6531e';
      c.fillRect(x, y, w, h);
      c.fillStyle = '#18100d';
      c.beginPath();
      c.arc(x + w * 0.42, y + h * 0.46, 76, 0, 6.28);
      c.fill();
      c.fillStyle = '#f2c9a6';
      c.beginPath();
      c.arc(x + w * 0.62, y + h * 0.3, 40, 0, 6.28);
      c.fill();
      c.fillStyle = '#18100d';
      c.fillRect(x + w * 0.12, y + h * 0.78, w * 0.7, 30);
    },
  });
}

export function drawSteamPuff(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const rnd = seeded(23);
  for (let i = 0; i < 7; i++) {
    const x = w * (0.3 + rnd() * 0.4);
    const y = h * (0.3 + rnd() * 0.4);
    const r = w * (0.18 + rnd() * 0.16);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
}