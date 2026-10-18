import * as THREE from 'three';
import {
  FontStacks,
  drawBulbGlow,
  drawSite,
  drawSteamPuff,
  drawWall,
  drawWallGlow,
  drawWood,
  makeCanvasTexture,
} from './textures';

/**
 * Light intensities. three.js r155+ uses physically based light units, so
 * these are candela-style values with inverse-square falloff. Tweak here to
 * change the mood of the room.
 */
export const LIGHTS = {
  ambient: 1.1, // lower than before so the lamp reads as the main light
  hemisphere: 0.7,
  lampSpot: 3.2, // focused cone, casts shadows
  lampWash: 0.9, // wide soft cone, no shadows, fills the area around the pool
  lampFill: 0.15,
  led: 0.35,
  screen: 0.3,
};

/** Position and size of the monitor panel in world units. The CSS3D layer uses the same numbers. */
export const SCREEN = { x: 0, y: 0.35, z: -0.2 + 0.0067, width: 0.84, height: 0.4725 };

/** Wall decor placement (world units). Move these around if the camera crops them. */
export const WALL = {
  z: -0.75,
  motivation: { x: -1.0, y: 0.7, w: 0.36, h: 0.5 },
  code: { x: 1.05, y: 0.7, w: 0.28, h: 0.38 },
};

export interface DeskHandles {
  /** Re-draws the monitor texture (call once webfonts have loaded). */
  redrawScreen: () => void;
  /** 0..1 levels for the desk lamp and the monitor glow. */
  setLevels: (lamp: number, screen: number) => void;
  /** Animates the coffee steam and the dust in the lamp beam. Pass elapsed time in seconds. */
  update: (time: number) => void;
  dispose: () => void;
}

/* ====================================================================== */
/*  Small canvas painters for the new wall decor                          */
/* ====================================================================== */

type Painter = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

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
const drawMotivationPoster: Painter = (ctx, w, h) => {
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
const drawCodePoster: Painter = (ctx, w, h) => {
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

const drawSticky = (bg: string, lines: string[]): Painter => (ctx, w, h) => {
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

/* ====================================================================== */
/*  Scene                                                                 */
/* ====================================================================== */

export function buildDesk(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  fonts: FontStacks,
  options: { liveScreen?: boolean } = {},
): DeskHandles {
  const aniso = renderer.capabilities.getMaxAnisotropy();

  /* ---------- small helpers ---------- */
  const std = (color: number, roughness = 0.6, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });

  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, shadow = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = shadow;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  };

  const limb = (a: number[], b: number[], r: number, mat: THREE.Material) => {
    const A = new THREE.Vector3(...(a as [number, number, number]));
    const B = new THREE.Vector3(...(b as [number, number, number]));
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, A.distanceTo(B), 16), mat);
    m.position.copy(A).add(B).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
    m.castShadow = true;
    scene.add(m);
    return m;
  };

  /** A thin cable lying along a smooth curve through the given points. */
  const cable = (pts: number[][], radius: number, mat: THREE.Material) => {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, radius, 6, false), mat);
    m.receiveShadow = true;
    scene.add(m);
    return m;
  };

  let seed = 5;
  const rl = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  const extraTextures: THREE.Texture[] = [];
  const canvasTex = (w: number, h: number, paint: Painter) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    paint(c.getContext('2d')!, w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = aniso;
    extraTextures.push(t);
    return t;
  };

  /* ---------- textures ---------- */
  const woodTex = makeCanvasTexture(1024, 512, drawWood, aniso);
  const wallTex = makeCanvasTexture(512, 512, drawWall, aniso);
  wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
  wallTex.repeat.set(5, 2.5);
  const glowTex = makeCanvasTexture(512, 256, drawWallGlow, aniso);
  const bulbTex = makeCanvasTexture(128, 128, drawBulbGlow, aniso);
  const steamTex = makeCanvasTexture(128, 128, drawSteamPuff, aniso);

  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 1600;
  screenCanvas.height = 900;
  const paintScreen = () => drawSite(screenCanvas.getContext('2d')!, 1600, 900, fonts);
  paintScreen();
  const screenTex = new THREE.CanvasTexture(screenCanvas);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  screenTex.anisotropy = aniso;

  /* ---------- room ---------- */
  add(
    new THREE.PlaneGeometry(7, 3.2),
    new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.95 }),
    0,
    1.0,
    -0.75,
    false,
  );

  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 1.15),
    new THREE.MeshBasicMaterial({
      map: glowTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.85,
    }),
  );
  glow.position.set(0, 0.3, -0.742);
  scene.add(glow);

  const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.52 });

  // shelf + light strip
  add(new THREE.BoxGeometry(2.8, 0.035, 0.24), woodMat, 0, 0.205, -0.63);
  add(new THREE.BoxGeometry(2.7, 0.006, 0.01), new THREE.MeshBasicMaterial({ color: 0xffc27a }), 0, 0.185, -0.52, false);

  // shelf brackets
  const bracketMat = std(0x141416, 0.4, 0.6);
  [-1.15, 1.15].forEach((bx) => {
    add(new THREE.BoxGeometry(0.014, 0.09, 0.012), bracketMat, bx, 0.155, -0.744);
    add(new THREE.BoxGeometry(0.014, 0.012, 0.2), bracketMat, bx, 0.182, -0.65);
  });

  // desk and the dark void below it
  add(new THREE.BoxGeometry(2.6, 0.05, 1.3), woodMat, 0, -0.025, -0.1);
  // darker front lip so the desk edge reads as a separate slab
  add(new THREE.BoxGeometry(2.6, 0.012, 0.012), std(0x2a1a10, 0.5), 0, -0.006, 0.544, false);
  const floor = add(new THREE.PlaneGeometry(8, 8), std(0x0d0806, 1), 0, -0.9, -0.1, false);
  floor.rotation.x = -Math.PI / 2;

  /* ---------- wall decor: framed posters + sticky notes ---------- */
  const frameMat = std(0x1b120c, 0.55);
  const hang = (cx: number, cy: number, w: number, h: number, tex: THREE.Texture, rotZ = 0) => {
    const g = new THREE.Group();
    g.position.set(cx, cy, WALL.z);
    g.rotation.z = rotZ;
    scene.add(g);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.024, h + 0.024, 0.016), frameMat);
    frame.position.z = 0.008;
    frame.castShadow = true;
    frame.receiveShadow = true;
    g.add(frame);

    const art = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 }),
    );
    art.position.z = 0.0165;
    art.receiveShadow = true;
    g.add(art);

    // faint glass sheen so the lamp catches the frame
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.03,
        transparent: true,
        opacity: 0.07,
        depthWrite: false,
      }),
    );
    glass.position.z = 0.018;
    g.add(glass);
    return g;
  };

  const M = WALL.motivation;
  hang(M.x, M.y, M.w, M.h, canvasTex(720, 1000, drawMotivationPoster), 0.015);
  const C = WALL.code;
  hang(C.x, C.y, C.w, C.h, canvasTex(540, 730, drawCodePoster), -0.01);

  const sticky = (x: number, y: number, bg: string, lines: string[], rot: number) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(0.07, 0.07),
      new THREE.MeshStandardMaterial({ map: canvasTex(160, 160, drawSticky(bg, lines)), roughness: 0.9 }),
    );
    m.position.set(x, y, WALL.z + 0.0015);
    m.rotation.z = rot;
    m.receiveShadow = true;
    scene.add(m);
  };
  sticky(0.8, 0.74, '#f7e27a', ['ship', 'it!'], 0.06);
  sticky(0.87, 0.64, '#f4a6b8', ['drink', 'water'], -0.08);

  /* ---------- books on the shelf ---------- */
  const SHELF_TOP = 0.2225;
  const bookSpecs: { t: number; h: number; color: number; band: number }[] = [
    { t: 0.032, h: 0.17, color: 0x7a2e2e, band: 0xd9b45a },
    { t: 0.045, h: 0.15, color: 0x2b4a63, band: 0xe8dcc0 },
    { t: 0.026, h: 0.19, color: 0x3d5a3a, band: 0xd9b45a },
    { t: 0.038, h: 0.16, color: 0x5a4632, band: 0xe8dcc0 },
  ];
  const BOOK_DEPTH = 0.15;
  let bx = -1.3;
  bookSpecs.forEach(({ t, h, color, band }) => {
    add(new THREE.BoxGeometry(t, h, BOOK_DEPTH), std(color, 0.7), bx + t / 2, SHELF_TOP + h / 2, -0.64);
    add(
      new THREE.BoxGeometry(t * 0.92, 0.01, 0.002),
      std(band, 0.5, 0.3),
      bx + t / 2,
      SHELF_TOP + h - 0.03,
      -0.64 + BOOK_DEPTH / 2 + 0.001,
      false,
    );
    bx += t + 0.002;
  });
  // one book leaning on the row
  {
    const t = 0.03;
    const h = 0.17;
    const lean = 0.2;
    const book = new THREE.Mesh(new THREE.BoxGeometry(t, h, BOOK_DEPTH), std(0x8a6a2a, 0.7));
    book.rotation.z = lean;
    book.position.set(bx + 0.05 - (h / 2) * Math.sin(lean), SHELF_TOP + (h / 2) * Math.cos(lean) + 0.004, -0.64);
    book.castShadow = true;
    book.receiveShadow = true;
    scene.add(book);
  }

  /* ---------- monitor ---------- */
  const black = std(0x0b0b0d, 0.4, 0.2);
  const MZ = -0.2;
  // 16:9 panel, about 35% larger than before (screen is 0.84 x 0.4725)
  const MY = SCREEN.y; // vertical centre of the panel
  add(new THREE.BoxGeometry(0.858, 0.5, 0.012), black, 0, MY, MZ);
  add(new THREE.BoxGeometry(0.54, 0.34, 0.022), std(0x131316, 0.5, 0.3), 0, MY, MZ - 0.016);
  const screenMat = options.liveScreen
    ? new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0, blending: THREE.NoBlending })
    : new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN.width, SCREEN.height), screenMat);
  screen.position.set(SCREEN.x, SCREEN.y, SCREEN.z);
  scene.add(screen);
  add(new THREE.BoxGeometry(0.06, 0.26, 0.014), black, 0, 0.14, MZ - 0.035);
  add(new THREE.BoxGeometry(0.36, 0.008, 0.2), black, 0, 0.004, MZ - 0.02);
  add(new THREE.BoxGeometry(0.12, 0.008, 0.012), std(0x1c1c20, 0.3, 0.6), 0, 0.103, MZ + 0.004);
  // power LED on the chin
  add(new THREE.BoxGeometry(0.006, 0.002, 0.002), new THREE.MeshBasicMaterial({ color: 0x66ff99 }), 0.4, 0.107, MZ + 0.0065, false);

  /* ---------- desk lamp ---------- */
  const lampMat = std(0x0a0a0a, 0.35, 0.55);
  // moved left to make room for the larger monitor
  const B = [-0.74, 0.02, -0.32];
  const E = [-0.71, 0.36, -0.3];
  const N = [-0.59, 0.51, -0.14];
  add(new THREE.CylinderGeometry(0.06, 0.065, 0.02, 32), lampMat, B[0], 0.01, B[2]);
  limb(B, E, 0.007, lampMat);
  limb(E, N, 0.007, lampMat);
  [B, E, N].forEach((p) => add(new THREE.SphereGeometry(0.012, 16, 12), lampMat, p[0], p[1], p[2]));

  const shade = new THREE.Group();
  shade.position.set(N[0] + 0.02, N[1] - 0.01, N[2] + 0.02);
  shade.rotation.z = 0.55;
  shade.rotation.x = 0.2;
  scene.add(shade);

  const outerProfile: THREE.Vector2[] = [];
  const innerProfile: THREE.Vector2[] = [];
  for (let i = 0; i <= 26; i++) {
    const t = ((i / 26) * Math.PI) / 2;
    outerProfile.push(new THREE.Vector2(0.115 * Math.sin(t), 0.095 * Math.cos(t)));
    innerProfile.push(new THREE.Vector2(0.108 * Math.sin(t), 0.089 * Math.cos(t)));
  }
  shade.add(
    new THREE.Mesh(
      new THREE.LatheGeometry(outerProfile, 48),
      new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.32, metalness: 0.6, side: THREE.DoubleSide }),
    ),
  );
  const shadeInnerMat = new THREE.MeshStandardMaterial({
    color: 0xf0d7b4,
    emissive: 0xb87430,
    emissiveIntensity: 0.7,
    roughness: 0.6,
    side: THREE.BackSide,
  });
  shade.add(new THREE.Mesh(new THREE.LatheGeometry(innerProfile, 48), shadeInnerMat));

  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfff0d0, toneMapped: false });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.03, 24, 16), bulbMat);
  bulb.position.set(0, 0.035, 0);
  shade.add(bulb);

  const bulbSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: bulbTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.9,
    }),
  );
  bulbSprite.scale.set(0.42, 0.42, 1);
  bulbSprite.position.set(0, 0.02, 0);
  shade.add(bulbSprite);

  /* ---------- cables ---------- */
  const cableMat = std(0x0a0a0a, 0.6);
  cable(
    [
      [0, 0.12, MZ - 0.043],
      [0, 0.03, MZ - 0.07],
      [-0.03, 0.003, -0.33],
      [-0.06, 0.003, -0.5],
      [-0.1, 0.003, -0.7],
    ],
    0.0022,
    cableMat,
  );
  cable(
    [
      [B[0] + 0.02, 0.014, B[2] - 0.03],
      [-0.78, 0.003, -0.4],
      [-0.9, 0.003, -0.5],
      [-0.95, 0.003, -0.7],
    ],
    0.002,
    cableMat,
  );

  /* ---------- water glass on a cork coaster ---------- */
  add(new THREE.CylinderGeometry(0.055, 0.055, 0.008, 40), std(0x8a5a35, 0.95), -0.4, 0.004, 0.34);
  add(
    new THREE.CylinderGeometry(0.037, 0.031, 0.095, 40, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.04,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    -0.4,
    0.0555,
    0.34,
    false,
  );
  add(
    new THREE.CylinderGeometry(0.034, 0.03, 0.07, 40),
    new THREE.MeshStandardMaterial({ color: 0xe6d2b2, roughness: 0.05, transparent: true, opacity: 0.3, depthWrite: false }),
    -0.4,
    0.047,
    0.34,
    false,
  );
  add(
    new THREE.CylinderGeometry(0.031, 0.031, 0.006, 40),
    new THREE.MeshStandardMaterial({ color: 0xe9e6e0, roughness: 0.1, transparent: true, opacity: 0.4, depthWrite: false }),
    -0.4,
    0.012,
    0.34,
    false,
  );

  /* ---------- notebook + pen ---------- */
  {
    const nb = new THREE.Group();
    nb.position.set(-0.64, 0, 0.22);
    nb.rotation.y = 0.35;
    scene.add(nb);
    const part = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      nb.add(m);
      return m;
    };
    part(new THREE.BoxGeometry(0.14, 0.014, 0.19), std(0x2d4a52, 0.75), 0, 0.007, 0);
    part(new THREE.BoxGeometry(0.133, 0.009, 0.183), std(0xf0e6d2, 0.9), 0.004, 0.0065, 0);
    part(new THREE.BoxGeometry(0.006, 0.0152, 0.192), std(0x111111, 0.5), 0.045, 0.0072, 0);
    const pen = part(new THREE.CylinderGeometry(0.003, 0.003, 0.15, 12), std(0xd4a24c, 0.3, 0.8), -0.01, 0.0175, 0);
    pen.rotation.set(0, 0.4, Math.PI / 2);
  }

  /* ---------- pen cup ---------- */
  {
    const PX = -0.56;
    const PZ = -0.05;
    add(new THREE.CylinderGeometry(0.03, 0.026, 0.09, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0x3a3a40, roughness: 0.5, metalness: 0.4, side: THREE.DoubleSide }), PX, 0.045, PZ);
    add(new THREE.CylinderGeometry(0.026, 0.026, 0.004, 32), std(0x2a2a30, 0.6), PX, 0.002, PZ, false);
    const pens = [
      { c: 0xc0392b, tilt: 0.22, rot: 0.5, len: 0.14 },
      { c: 0x2b6cb0, tilt: 0.12, rot: 2.4, len: 0.15 },
      { c: 0x222222, tilt: 0.18, rot: 4.1, len: 0.13 },
      { c: 0xe0b030, tilt: 0.25, rot: 5.4, len: 0.16 },
      { c: 0x2f855a, tilt: 0.06, rot: 1.2, len: 0.12 },
    ];
    pens.forEach(({ c, tilt, rot, len }) => {
      const g = new THREE.CylinderGeometry(0.0025, 0.0025, len, 8);
      g.translate(0, len / 2, 0);
      const pen = new THREE.Mesh(g, std(c, 0.4));
      pen.castShadow = true;
      const pivot = new THREE.Group();
      pivot.position.set(PX, 0.01, PZ);
      pivot.rotation.order = 'YXZ';
      pivot.rotation.y = rot;
      pivot.rotation.x = tilt;
      pivot.add(pen);
      scene.add(pivot);
    });
  }

  /* ---------- deskmat, keyboard, mouse ---------- */
  add(new THREE.BoxGeometry(0.72, 0.004, 0.31), std(0x1a1a1c, 0.95), 0.12, 0.002, 0.34, false);

  const kb = new THREE.Group();
  kb.position.set(0.04, 0.004, 0.35);
  kb.rotation.y = -0.05;
  scene.add(kb);

  const kbBase = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.018, 0.13), std(0x202024, 0.4, 0.4));
  kbBase.position.y = 0.009;
  kbBase.castShadow = true;
  kbBase.receiveShadow = true;
  kb.add(kbBase);

  const COLS = 15;
  const ROWS = 4;
  const keys = new THREE.InstancedMesh(new THREE.BoxGeometry(0.0195, 0.007, 0.0185), std(0xffffff, 0.55, 0.1), COLS * ROWS);
  keys.castShadow = true;
  const m4 = new THREE.Matrix4();
  const keyColor = new THREE.Color();
  let idx = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      m4.makeTranslation(-0.178 + c * 0.0255, 0.0215, -0.044 + r * 0.0225);
      keys.setMatrixAt(idx, m4);
      const accent = r === 0 && (c === 0 || c === COLS - 1);
      const modifier = c <= 1 || c >= COLS - 2;
      keyColor.set(accent ? 0xc4623a : modifier ? 0x1a1a1f : 0x0c0c0e);
      keys.setColorAt(idx, keyColor);
      idx++;
    }
  }
  if (keys.instanceColor) keys.instanceColor.needsUpdate = true;
  kb.add(keys);

  const space = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.007, 0.0185), std(0x0c0c0e, 0.55, 0.1));
  space.position.set(-0.02, 0.0215, 0.046);
  space.castShadow = true;
  kb.add(space);

  // keyboard cable, routed around the monitor stand to the back of the desk
  cable(
    [
      [0.04, 0.012, 0.284],
      [0.1, 0.003, 0.2],
      [0.12, 0.003, 0.05],
      [0.26, 0.003, -0.15],
      [0.3, 0.003, -0.45],
      [0.25, 0.003, -0.7],
    ],
    0.002,
    cableMat,
  );

  const mouse = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), std(0x111113, 0.3, 0.35));
  mouse.scale.set(0.03, 0.015, 0.05);
  mouse.position.set(0.47, 0.012, 0.35);
  mouse.rotation.y = 0.12;
  mouse.castShadow = true;
  scene.add(mouse);
  // scroll wheel
  const wheel = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.003, 0.013), std(0xc4623a, 0.4));
  wheel.position.set(0.47 - Math.sin(0.12) * 0.015, 0.0268, 0.35 - Math.cos(0.12) * 0.015);
  wheel.rotation.y = 0.12;
  scene.add(wheel);

  /* ---------- hot coffee cup (right of the mouse) ---------- */
  const CUP_X = 0.68;
  const CUP_Z = 0.27;
  const COFFEE_Y = 0.08; // height of the coffee surface

  const cup = new THREE.Group();
  cup.position.set(CUP_X, 0, CUP_Z);
  cup.rotation.y = -0.55; // turns the handle toward the camera
  scene.add(cup);

  const ceramic = new THREE.MeshStandardMaterial({ color: 0xf1ebe0, roughness: 0.28, metalness: 0.02, side: THREE.DoubleSide });

  const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.058, 0.008, 48), ceramic);
  saucer.position.y = 0.004;
  saucer.castShadow = true;
  saucer.receiveShadow = true;
  cup.add(saucer);

  // spoon on the saucer
  const spoonMat = std(0xc9c9cf, 0.25, 0.9);
  const spoonHandle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.0018, 0.005), spoonMat);
  spoonHandle.position.set(-0.025, 0.0095, 0.058);
  spoonHandle.rotation.y = 0.18;
  spoonHandle.castShadow = true;
  cup.add(spoonHandle);
  const spoonBowl = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), spoonMat);
  spoonBowl.scale.set(0.011, 0.002, 0.008);
  spoonBowl.position.set(0.012, 0.0095, 0.052);
  spoonBowl.castShadow = true;
  cup.add(spoonBowl);

  // mug body: one lathe profile that runs up the outside and back down the inside
  const mugProfile = [
    [0.001, 0.008],
    [0.03, 0.008],
    [0.038, 0.014],
    [0.04, 0.03],
    [0.042, 0.09],
    [0.0395, 0.09],
    [0.0375, 0.088],
    [0.036, 0.03],
    [0.03, 0.018],
    [0.001, 0.016],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const mug = new THREE.Mesh(new THREE.LatheGeometry(mugProfile, 48), ceramic);
  mug.castShadow = true;
  mug.receiveShadow = true;
  cup.add(mug);

  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.0055, 12, 28, Math.PI), ceramic);
  handle.rotation.z = -Math.PI / 2;
  handle.position.set(0.0405, 0.052, 0);
  handle.castShadow = true;
  cup.add(handle);

  const coffee = new THREE.Mesh(
    new THREE.CircleGeometry(0.0355, 48),
    new THREE.MeshStandardMaterial({ color: 0x2a1209, roughness: 0.12, metalness: 0.1 }),
  );
  coffee.rotation.x = -Math.PI / 2;
  coffee.position.y = COFFEE_Y;
  cup.add(coffee);

  // lighter crema ring around the edge
  const crema = new THREE.Mesh(
    new THREE.RingGeometry(0.027, 0.0355, 48),
    new THREE.MeshStandardMaterial({ color: 0x6a3a1c, roughness: 0.3 }),
  );
  crema.rotation.x = -Math.PI / 2;
  crema.position.y = COFFEE_Y + 0.0003;
  cup.add(crema);

  // steam: soft sprites that rise, sway, grow and fade
  const STEAM_COUNT = 22;
  const steam = Array.from({ length: STEAM_COUNT }, (_, i) => {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: steamTex,
        color: 0xfff3e2,
        transparent: true,
        depthWrite: false,
        opacity: 0,
      }),
    );
    sprite.renderOrder = 2;
    scene.add(sprite);
    return { sprite, offset: i / STEAM_COUNT, phase: rl() * 6.28, sway: 0.008 + rl() * 0.012 };
  });

  const updateSteam = (t: number) => {
    steam.forEach(({ sprite, offset, phase, sway }) => {
      const life = (t * 0.2 + offset) % 1; // 0 at the coffee, 1 at the top of the plume
      const spread = 0.4 + life * 2.2;
      sprite.position.set(
        CUP_X + Math.sin(t * 1.3 + phase + life * 5) * sway * spread - life * life * 0.02,
        COFFEE_Y + 0.006 + life * 0.26,
        CUP_Z + Math.cos(t * 1.1 + phase * 1.7 + life * 4) * sway * spread,
      );
      const s = 0.035 + life * 0.11;
      sprite.scale.set(s, s, 1);
      sprite.material.rotation = phase + life * 1.2;
      sprite.material.opacity = Math.pow(Math.sin(Math.PI * life), 1.4) * 0.4;
    });
  };
  updateSteam(2.5);

  /* ---------- rubik's cube (mid-solve: the top layer is turned) ---------- */
  {
    const PITCH = 0.019;
    const BODY = 0.0185;
    const STICKER = 0.0155;
    const stickerGeo = new THREE.PlaneGeometry(STICKER, STICKER);
    const bodyGeo = new THREE.BoxGeometry(BODY, BODY, BODY);
    const bodyMat = std(0x0a0a0a, 0.4);
    const stickerMat = (c: number) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.28, metalness: 0.0 });
    const colors = {
      px: stickerMat(0xb71234), // red
      nx: stickerMat(0xff5800), // orange
      py: stickerMat(0xf5f5f0), // white
      ny: stickerMat(0xffd500), // yellow
      pz: stickerMat(0x009b48), // green
      nz: stickerMat(0x0046ad), // blue
    };
    const faceDefs: { key: keyof typeof colors; axis: 0 | 1 | 2; sign: 1 | -1; rx: number; ry: number }[] = [
      { key: 'px', axis: 0, sign: 1, rx: 0, ry: Math.PI / 2 },
      { key: 'nx', axis: 0, sign: -1, rx: 0, ry: -Math.PI / 2 },
      { key: 'py', axis: 1, sign: 1, rx: -Math.PI / 2, ry: 0 },
      { key: 'ny', axis: 1, sign: -1, rx: Math.PI / 2, ry: 0 },
      { key: 'pz', axis: 2, sign: 1, rx: 0, ry: 0 },
      { key: 'nz', axis: 2, sign: -1, rx: 0, ry: Math.PI },
    ];

    const cube = new THREE.Group();
    cube.position.set(0.5, 0.0285 + 0.0004, 0.06);
    cube.rotation.set(0, 0.6, 0);
    scene.add(cube);
    const topLayer = new THREE.Group();
    topLayer.rotation.y = 0.38; // the twist
    cube.add(topLayer);

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        for (let k = -1; k <= 1; k++) {
          const cubelet = new THREE.Group();
          cubelet.position.set(i * PITCH, j * PITCH, k * PITCH);
          const body = new THREE.Mesh(bodyGeo, bodyMat);
          body.castShadow = true;
          body.receiveShadow = true;
          cubelet.add(body);
          const idxs = [i, j, k];
          faceDefs.forEach(({ key, axis, sign, rx, ry }) => {
            if (idxs[axis] !== sign) return;
            const s = new THREE.Mesh(stickerGeo, colors[key]);
            const off = BODY / 2 + 0.0004;
            s.position.set(axis === 0 ? sign * off : 0, axis === 1 ? sign * off : 0, axis === 2 ? sign * off : 0);
            s.rotation.set(rx, ry, 0);
            s.receiveShadow = true;
            cubelet.add(s);
          });
          (j === 1 ? topLayer : cube).add(cubelet);
        }
      }
    }
  }

  /* ---------- headphones on a stand ---------- */
  {
    const hp = new THREE.Group();
    hp.position.set(1.02, 0, 0.1);
    hp.rotation.y = -0.6;
    scene.add(hp);
    const part = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      hp.add(m);
      return m;
    };
    const standMat = std(0x18181b, 0.35, 0.6);
    const shell = std(0x111114, 0.35, 0.3);
    const pad = std(0x2a2a2e, 0.9);
    part(new THREE.CylinderGeometry(0.05, 0.055, 0.008, 32), standMat, 0, 0.004, 0);
    part(new THREE.CylinderGeometry(0.006, 0.006, 0.2, 12), standMat, 0, 0.1, 0);
    const band = part(new THREE.TorusGeometry(0.075, 0.0065, 12, 40, Math.PI), shell, 0, 0.125, 0);
    band.scale.set(1, 1.15, 1);
    [-1, 1].forEach((side) => {
      const c = part(new THREE.CylinderGeometry(0.034, 0.034, 0.022, 28), shell, side * 0.077, 0.115, 0);
      c.rotation.z = Math.PI / 2;
      const p = part(new THREE.CylinderGeometry(0.03, 0.03, 0.012, 28), pad, side * 0.066, 0.115, 0);
      p.rotation.z = Math.PI / 2;
      // little accent ring on the outside of each cup
      const ring = part(new THREE.TorusGeometry(0.02, 0.0018, 8, 28), std(0xc4623a, 0.4, 0.4), side * 0.089, 0.115, 0);
      ring.rotation.y = Math.PI / 2;
    });
  }

  /* ---------- PC case and plant ---------- */
  add(new THREE.BoxGeometry(0.17, 0.23, 0.25), std(0xb4b4b8, 0.4, 0.6), 0.88, 0.115, -0.3);
  add(new THREE.BoxGeometry(0.03, 0.05, 0.004), std(0x101012, 0.5), 0.84, 0.07, -0.174);
  // power button on the case
  add(new THREE.CylinderGeometry(0.006, 0.006, 0.003, 16), std(0x2a2a2e, 0.3, 0.7), 0.9, 0.2, -0.174, false).rotation.x = Math.PI / 2;

  const PLANT_X = 0.66;
  add(new THREE.CylinderGeometry(0.04, 0.03, 0.065, 32), std(0x2a2a2c, 0.7), PLANT_X, 0.255, -0.62);
  const leafMats = [std(0x2f5a2e, 0.7), std(0x3b6b36, 0.7), std(0x274d28, 0.7)];
  for (let k = 0; k < 15; k++) {
    const h = 0.14 + rl() * 0.14;
    const g = new THREE.ConeGeometry(0.014, h, 6);
    g.translate(0, h / 2, 0);
    const leaf = new THREE.Mesh(g, leafMats[k % 3]);
    leaf.scale.z = 0.3;
    leaf.castShadow = true;
    const pivot = new THREE.Group();
    pivot.position.set(PLANT_X, 0.287, -0.62);
    pivot.rotation.order = 'YXZ';
    pivot.rotation.y = rl() * 6.28;
    pivot.rotation.x = 0.2 + rl() * 0.65;
    pivot.add(leaf);
    scene.add(pivot);
  }

  /* ---------- lights ---------- */
  scene.add(new THREE.AmbientLight(0x6b4a34, LIGHTS.ambient));
  scene.add(new THREE.HemisphereLight(0x8a6a4a, 0x1a120c, LIGHTS.hemisphere));

  // Aim along the shade's own axis (its local -Y), and find where that ray hits the desk (y = 0).
  shade.updateMatrixWorld(true);
  const bulbWorld = new THREE.Vector3();
  bulb.getWorldPosition(bulbWorld);
  const aim = new THREE.Vector3(0, -1, 0).transformDirection(shade.matrixWorld);
  const hitDist = bulbWorld.y / -aim.y;
  const hit = bulbWorld.clone().addScaledVector(aim, hitDist);

  // Main cone: warm (about 2700K), focused, casts shadows.
  const lampSpot = new THREE.SpotLight(0xffb36b, LIGHTS.lampSpot, 0, 0.55, 0.9, 2);
  lampSpot.position.copy(bulbWorld);
  lampSpot.target.position.copy(hit);
  lampSpot.castShadow = true;
  lampSpot.shadow.mapSize.set(2048, 2048);
  lampSpot.shadow.camera.near = 0.05;
  lampSpot.shadow.camera.far = 3;
  lampSpot.shadow.bias = -0.0003;
  lampSpot.shadow.normalBias = 0.01;
  scene.add(lampSpot, lampSpot.target);

  // Wide, softer cone with no shadows. This stands in for light bouncing around the desk.
  const lampWash = new THREE.SpotLight(0xff9a50, LIGHTS.lampWash, 0, 1.15, 1, 2);
  lampWash.position.copy(bulbWorld);
  lampWash.target.position.copy(hit);
  scene.add(lampWash, lampWash.target);

  const lampFill = new THREE.PointLight(0xffb870, LIGHTS.lampFill, 0, 2);
  lampFill.position.copy(bulbWorld);
  scene.add(lampFill);

  // Glowing pool of light on the desk, stretched along the beam direction.
  const poolGroup = new THREE.Group();
  poolGroup.position.set(hit.x, 0.0015, hit.z);
  poolGroup.rotation.y = Math.atan2(aim.x, aim.z);
  const pool = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 0.9),
    new THREE.MeshBasicMaterial({
      map: bulbTex,
      color: 0xffa860,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.22,
    }),
  );
  pool.rotation.x = -Math.PI / 2;
  poolGroup.add(pool);
  scene.add(poolGroup);

  // Faint visible beam from the bulb to the desk. Edges fade out and it is strongest near the bulb.
  const beamGeo = new THREE.CylinderGeometry(0.012, Math.tan(0.42) * hitDist, hitDist, 48, 1, true);
  beamGeo.translate(0, -hitDist / 2, 0); // top of the cone sits at the bulb
  const beamMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uColor: { value: new THREE.Color(0xffb066) },
      uStrength: { value: 0.16 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uStrength;
      varying vec2 vUv;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        float edge = pow(abs(dot(normalize(vN), normalize(vV))), 1.6);
        float along = pow(clamp(vUv.y, 0.0, 1.0), 1.4);
        gl_FragColor = vec4(uColor, edge * along * uStrength);
      }
    `,
  });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.copy(bulbWorld);
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), aim);
  beam.renderOrder = 1;
  scene.add(beam);

  // Dust motes floating inside the beam.
  const DUST = 70;
  const dustBase = new Float32Array(DUST * 3);
  const dustPos = new Float32Array(DUST * 3);
  const dustPhase = new Float32Array(DUST);
  const tangent = new THREE.Vector3()
    .crossVectors(aim, Math.abs(aim.z) < 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0))
    .normalize();
  const bitangent = new THREE.Vector3().crossVectors(aim, tangent);
  const coneR = Math.tan(0.42) * hitDist;
  for (let i = 0; i < DUST; i++) {
    const u = 0.12 + rl() * 0.88;
    const ang = rl() * Math.PI * 2;
    const r = Math.sqrt(rl()) * coneR * u * 0.85;
    const p = bulbWorld
      .clone()
      .addScaledVector(aim, u * hitDist)
      .addScaledVector(tangent, Math.cos(ang) * r)
      .addScaledVector(bitangent, Math.sin(ang) * r);
    p.y = Math.max(p.y, 0.03);
    dustBase.set([p.x, p.y, p.z], i * 3);
    dustPhase[i] = rl() * 6.28;
  }
  dustPos.set(dustBase);
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({
    map: bulbTex,
    color: 0xffd9a0,
    size: 0.012,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.frustumCulled = false;
  scene.add(dust);

  const updateDust = (t: number) => {
    for (let i = 0; i < DUST; i++) {
      const ph = dustPhase[i];
      dustPos[i * 3] = dustBase[i * 3] + Math.sin(t * 0.25 + ph) * 0.012;
      dustPos[i * 3 + 1] = Math.max(0.02, dustBase[i * 3 + 1] + Math.sin(t * 0.18 + ph * 1.7) * 0.02);
      dustPos[i * 3 + 2] = dustBase[i * 3 + 2] + Math.cos(t * 0.22 + ph * 1.3) * 0.012;
    }
    dustGeo.attributes.position.needsUpdate = true;
  };

  const ledA = new THREE.PointLight(0xff9440, LIGHTS.led, 0, 2);
  ledA.position.set(-0.55, 0.3, -0.5);
  const ledB = new THREE.PointLight(0xff9440, LIGHTS.led, 0, 2);
  ledB.position.set(0.55, 0.3, -0.5);
  scene.add(ledA, ledB);

  const screenLight = new THREE.PointLight(0xe6f2cf, LIGHTS.screen, 0, 2);
  screenLight.position.set(0, 0.33, 0.14);
  scene.add(screenLight);

  /* ---------- handles ---------- */
  return {
    redrawScreen() {
      paintScreen();
      screenTex.needsUpdate = true;
    },
    setLevels(lamp: number, screenLevel: number) {
      lampSpot.intensity = LIGHTS.lampSpot * lamp;
      lampWash.intensity = LIGHTS.lampWash * lamp;
      lampFill.intensity = LIGHTS.lampFill * lamp;
      pool.material.opacity = 0.22 * lamp;
      beamMat.uniforms.uStrength.value = 0.16 * lamp;
      dustMat.opacity = 0.6 * lamp;
      bulbSprite.material.opacity = 0.9 * lamp;
      bulbMat.color.setRGB(0.35 + 0.65 * lamp, 0.3 + 0.62 * lamp, 0.25 + 0.5 * lamp);
      shadeInnerMat.emissiveIntensity = 1.0 * lamp;
      screenLight.intensity = LIGHTS.screen * screenLevel;
      if (!options.liveScreen) screenMat.color.setScalar(0.06 + 0.94 * screenLevel);
    },
    update(t: number) {
      updateSteam(t);
      updateDust(t);
    },
    dispose() {
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat?.dispose();
      });
      [woodTex, wallTex, glowTex, bulbTex, steamTex, screenTex, ...extraTextures].forEach((t) => t.dispose());
    },
  };
}