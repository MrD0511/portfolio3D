/* ====================================================================== */
/*  Small canvas painters for the new wall decor                          */
/* ====================================================================== */

export type Painter = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

const SANS = 'Helvetica, Arial, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';
const MONO = 'Menlo, Consolas, "Courier New", monospace';

function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

/** Centered text with manual letter spacing (canvas letterSpacing is not supported everywhere). */
function spaced(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, spacing: number) {
  const chars = text.split('');
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let x = cx - total / 2;
  ctx.textAlign = 'left';
  chars.forEach((ch, i) => {
    ctx.fillText(ch, x, y);
    x += widths[i] + spacing;
  });
}

/** Sunrise over mountains, a flag on the summit, and a big "KEEP SHIPPING." */
export const drawMotivationPoster: Painter = (ctx, w, h) => {
  const rnd = lcg(11);
  ctx.fillStyle = '#efe4cf';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = `rgba(120,90,50,${rnd() * 0.05})`;
    ctx.fillRect(rnd() * w, rnd() * h, 1.5, 1.5);
  }

  const ax = 48;
  const ay = 48;
  const aw = w - 96;
  const ah = 560;

  ctx.save();
  ctx.beginPath();
  ctx.rect(ax, ay, aw, ah);
  ctx.clip();

  const sky = ctx.createLinearGradient(0, ay, 0, ay + ah);
  sky.addColorStop(0, '#231c42');
  sky.addColorStop(0.45, '#8f3f66');
  sky.addColorStop(0.75, '#e0705a');
  sky.addColorStop(1, '#f6b563');
  ctx.fillStyle = sky;
  ctx.fillRect(ax, ay, aw, ah);

  for (let i = 0; i < 45; i++) {
    ctx.fillStyle = `rgba(255,240,220,${0.2 + rnd() * 0.5})`;
    const r = rnd() * 1.6 + 0.4;
    ctx.beginPath();
    ctx.arc(ax + rnd() * aw, ay + rnd() * ah * 0.4, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const sx = ax + aw * 0.42;
  const sy = ay + ah * 0.6;
  const halo = ctx.createRadialGradient(sx, sy, 20, sx, sy, 260);
  halo.addColorStop(0, 'rgba(255,214,140,0.9)');
  halo.addColorStop(1, 'rgba(255,214,140,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(ax, ay, aw, ah);
  ctx.fillStyle = '#ffd68c';
  ctx.beginPath();
  ctx.arc(sx, sy, 62, 0, Math.PI * 2);
  ctx.fill();

  const ridge = (base: number, amp: number, color: string, seedN: number) => {
    const r = lcg(seedN);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(ax, ay + ah);
    for (let x = 0; x <= aw + 40; x += 36) {
      const y = ay + ah * base - Math.sin(x * 0.013 + seedN) * amp - r() * amp * 0.9;
      ctx.lineTo(ax + x, y);
    }
    ctx.lineTo(ax + aw, ay + ah);
    ctx.closePath();
    ctx.fill();
  };
  ridge(0.68, 38, '#7a3e66', 3);
  ridge(0.76, 46, '#4a2a58', 7);

  // the near ridge has one tall summit for the flag
  const peakX = ax + 470;
  const peakY = ay + ah * 0.4;
  ctx.fillStyle = '#1d1530';
  ctx.beginPath();
  [
    [ax, ay + ah * 0.82],
    [ax + 110, ay + ah * 0.72],
    [ax + 230, ay + ah * 0.8],
    [ax + 330, ay + ah * 0.54],
    [ax + 400, ay + ah * 0.62],
    [peakX, peakY],
    [ax + 540, ay + ah * 0.64],
    [ax + aw, ay + ah * 0.74],
    [ax + aw, ay + ah],
    [ax, ay + ah],
  ].forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();

  // flag
  ctx.strokeStyle = '#f3e3c3';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(peakX, peakY + 2);
  ctx.lineTo(peakX, peakY - 46);
  ctx.stroke();
  ctx.fillStyle = '#ff6b4a';
  ctx.beginPath();
  ctx.moveTo(peakX, peakY - 46);
  ctx.lineTo(peakX + 30, peakY - 37);
  ctx.lineTo(peakX, peakY - 28);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = 'rgba(43,35,71,0.7)';
  ctx.lineWidth = 2;
  ctx.strokeRect(ax - 10, ay - 10, aw + 20, ah + 20);

  ctx.fillStyle = '#2b2347';
  ctx.font = `bold 100px ${SERIF}`;
  spaced(ctx, 'KEEP', w / 2, 730, 10);
  ctx.font = `bold 92px ${SERIF}`;
  spaced(ctx, 'SHIPPING.', w / 2, 830, 6);

  ctx.fillStyle = '#b5475a';
  ctx.font = `600 26px ${SANS}`;
  spaced(ctx, 'SMALL STEPS  \u2022  EVERY DAY', w / 2, 900, 7);

  ctx.fillStyle = 'rgba(43,35,71,0.7)';
  ctx.font = `italic 26px ${SERIF}`;
  ctx.textAlign = 'center';
  ctx.fillText('progress over perfection', w / 2, 950);
};

/** Dark "terminal" poster with the daily loop. */
export const drawCodePoster: Painter = (ctx, w, h) => {
  ctx.fillStyle = '#14171c';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#3a4150';
  ctx.lineWidth = 2;
  ctx.strokeRect(22, 22, w - 44, h - 44);

  ctx.textAlign = 'left';
  ctx.font = `26px ${MONO}`;
  ctx.fillStyle = '#6b7688';
  ctx.fillText('// the daily loop', 52, 92);

  const plain = '#c9d1d9';
  const lines: [string, string][][] = [
    [['while', '#ff9a52'], [' (', plain], ['alive', '#7ee0c3'], [') {', plain]],
    [['  learn', '#7cc4ff'], ['();', plain]],
    [['  build', '#7cc4ff'], ['();', plain]],
    [['  ship', '#7cc4ff'], ['();', plain]],
    [['  repeat', '#7cc4ff'], ['();', plain]],
    [['}', plain]],
  ];
  ctx.font = `bold 40px ${MONO}`;
  lines.forEach((tokens, i) => {
    let x = 52;
    const y = 190 + i * 64;
    tokens.forEach(([text, color]) => {
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
      x += ctx.measureText(text).width;
    });
  });

  ctx.strokeStyle = '#2a303a';
  ctx.beginPath();
  ctx.moveTo(52, 590);
  ctx.lineTo(w - 52, 590);
  ctx.stroke();

  ctx.font = `24px ${MONO}`;
  ctx.fillStyle = '#7ee0c3';
  ctx.fillText('$ git commit -m', 52, 640);
  ctx.fillStyle = '#e6c07b';
  ctx.fillText('"1% better today"', 52, 680);
  ctx.fillStyle = '#c9d1d9';
  ctx.fillRect(52 + ctx.measureText('"1% better today"').width + 8, 662, 13, 22);
};

export const drawSticky = (bg: string, lines: string[]): Painter => (ctx, w, h) => {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  const shade = ctx.createLinearGradient(0, h * 0.7, 0, h);
  shade.addColorStop(0, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(0,0,0,0.14)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#3a3a3a';
  ctx.font = `bold 30px "Segoe Print","Bradley Hand","Comic Sans MS",cursive`;
  ctx.textAlign = 'center';
  lines.forEach((l, i) => ctx.fillText(l, w / 2, h * 0.42 + i * 36));
};
