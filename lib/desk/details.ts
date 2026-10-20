import * as THREE from 'three';
import type { DeskCtx } from './context';
import { WALL } from './constants';
import type { Painter } from './posters';

/* ====================================================================== */
/*  Extra room and desk details                                           */
/*                                                                        */
/*  Wall:   sprint kanban board, "open to work" neon sign                 */
/*  Shelf:  tech books + Rubik's cube, film clapperboard                  */
/*  Desk:   small terminal screen, second laptop (code editor)            */
/* ====================================================================== */

const SANS = 'Helvetica, Arial, sans-serif';
const MONO = '"Courier New", Courier, monospace';
const SHELF_TOP = 0.2225;

/* ---- easy-to-edit text ---- */
const SPRINT_LABEL = 'SPRINT 42';
const NEON_LINES = ['OPEN TO', 'WORK']; // try ['LET\u2019S WORK', 'TOGETHER']
const NEON_COLOR = '#35ffb0';
const TERMINAL_LINES: [string, string][] = [
  ['$ whoami', '#35ffb0'],
  ['dhruv \u2014 software engineer', '#d6deeb'],
  ['$ cat stack.txt', '#35ffb0'],
  ['typescript \u00b7 react \u00b7 three.js', '#d6deeb'],
  ['$ git log --oneline -1', '#35ffb0'],
  ['a1b2c3d ship portfolio', '#e0af68'],
  ['$ status', '#35ffb0'],
  ['open to work \u2713', '#7dcfff'],
];

/* ---- desk placement (tweak to fit your scene) ---- */
const TERM_POS = { x: 0.55, z: -0.2, rotY: -0.3 };
const LAPTOP_POS = { x: -0.50, z: 0.09, rotY: 0.65 }; // left side, angled toward the centre
const LAPTOP_SCALE = 1.25;
const NEON_POS = { x: 0.45, y: 0.8 };

/* ---------------------------- canvas painters ---------------------------- */

const paintKanban: Painter = (c, w, h) => {
  c.fillStyle = '#eef1f4';
  c.fillRect(0, 0, w, h);

  // header bar
  c.fillStyle = '#1f2a3a';
  c.fillRect(0, 0, w, 44);
  c.fillStyle = '#ffffff';
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.font = `700 22px ${SANS}`;
  c.fillText(SPRINT_LABEL, 18, 23);
  c.textAlign = 'right';
  c.font = `500 14px ${SANS}`;
  c.fillStyle = '#9fb3cc';
  c.fillText('main  \u2713  all checks passed', w - 18, 23);

  const cols = [
    { title: 'TODO', notes: [['refactor auth', '#ffe27a'], ['write docs', '#ff9fb2']] },
    { title: 'DOING', notes: [['ship v2', '#8fd3ff']] },
    { title: 'DONE', notes: [['code review', '#a8e6a1'], ['deploy', '#a8e6a1']] },
  ] as const;
  const colW = w / 3;
  cols.forEach((col, i) => {
    const x0 = i * colW;
    if (i > 0) {
      c.fillStyle = '#c3cad3';
      c.fillRect(x0 - 1, 56, 2, h - 70);
    }
    c.fillStyle = '#44505f';
    c.textAlign = 'center';
    c.font = `700 16px ${SANS}`;
    c.fillText(col.title, x0 + colW / 2, 72);
    col.notes.forEach(([text, color], j) => {
      const nx = x0 + 20;
      const ny = 96 + j * 82;
      c.save();
      c.translate(nx + 62, ny + 32);
      c.rotate(((i * 3 + j * 5) % 5 - 2) * 0.025);
      c.shadowColor = 'rgba(0,0,0,0.25)';
      c.shadowBlur = 6;
      c.shadowOffsetY = 2;
      c.fillStyle = color;
      c.fillRect(-62, -32, 124, 64);
      c.shadowColor = 'transparent';
      c.fillStyle = '#2a2a2a';
      c.font = `600 15px ${SANS}`;
      c.textAlign = 'center';
      c.fillText(text, 0, 0);
      c.restore();
    });
  });
};

const paintClapBody: Painter = (c, w, h) => {
  c.fillStyle = '#17181c';
  c.fillRect(0, 0, w, h);
  c.strokeStyle = '#e8e8e8';
  c.fillStyle = '#e8e8e8';
  c.lineWidth = 2;
  c.textBaseline = 'alphabetic';
  c.textAlign = 'left';
  c.strokeRect(6, 6, w - 12, h - 12);
  c.beginPath();
  c.moveTo(6, h * 0.36);
  c.lineTo(w - 6, h * 0.36);
  c.moveTo(6, h * 0.68);
  c.lineTo(w - 6, h * 0.68);
  c.moveTo(w * 0.34, h * 0.36);
  c.lineTo(w * 0.34, h - 6);
  c.moveTo(w * 0.67, h * 0.36);
  c.lineTo(w * 0.67, h - 6);
  c.stroke();
  c.font = `700 14px ${SANS}`;
  c.fillText('PROD.  PORTFOLIO', 14, h * 0.25);
  c.font = `600 11px ${SANS}`;
  c.fillStyle = '#9aa0aa';
  c.fillText('ROLL', 14, h * 0.48);
  c.fillText('SCENE', w * 0.34 + 8, h * 0.48);
  c.fillText('TAKE', w * 0.67 + 8, h * 0.48);
  c.fillText('DIRECTOR', 14, h * 0.8);
  c.fillText('CAMERA', w * 0.34 + 8, h * 0.8);
  c.fillText('DATE', w * 0.67 + 8, h * 0.8);
  c.fillStyle = '#ffffff';
  c.font = `700 22px ${SANS}`;
  c.fillText('A', 18, h * 0.62);
  c.fillText('404', w * 0.34 + 10, h * 0.62);
  c.fillText('01', w * 0.67 + 10, h * 0.62);
};

const paintClapStripes: Painter = (c, w, h) => {
  c.fillStyle = '#f2f2f2';
  c.fillRect(0, 0, w, h);
  c.fillStyle = '#17181c';
  const step = 36;
  for (let x = -h; x < w + h; x += step) {
    c.beginPath();
    c.moveTo(x, h);
    c.lineTo(x + step / 2, h);
    c.lineTo(x + step / 2 + h * 0.7, 0);
    c.lineTo(x + h * 0.7, 0);
    c.closePath();
    c.fill();
  }
};

const paintNeon: Painter = (c, w, h) => {
  c.fillStyle = '#07080c';
  c.fillRect(0, 0, w, h);

  const glow = (draw: () => void) => {
    c.save();
    c.shadowColor = NEON_COLOR;
    c.shadowBlur = 26;
    c.strokeStyle = NEON_COLOR;
    c.lineWidth = 7;
    c.lineJoin = 'round';
    draw();
    draw();
    c.restore();
    c.save();
    c.strokeStyle = '#ffffff';
    c.globalAlpha = 0.85;
    c.lineWidth = 2;
    c.lineJoin = 'round';
    draw();
    c.restore();
  };

  // rounded border tube
  const m = 22;
  const r = 36;
  glow(() => {
    c.beginPath();
    c.moveTo(m + r, m);
    c.arcTo(w - m, m, w - m, h - m, r);
    c.arcTo(w - m, h - m, m, h - m, r);
    c.arcTo(m, h - m, m, m, r);
    c.arcTo(m, m, w - m, m, r);
    c.closePath();
    c.stroke();
  });

  // text
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.font = `700 ${NEON_LINES.length > 1 ? 82 : 100}px ${SANS}`;
  const lineH = 92;
  const startY = h / 2 - ((NEON_LINES.length - 1) * lineH) / 2;
  NEON_LINES.forEach((line, i) => {
    glow(() => c.strokeText(line, w / 2, startY + i * lineH));
  });
};

const paintTerminal: Painter = (c, w, h) => {
  c.fillStyle = '#0c1018';
  c.fillRect(0, 0, w, h);
  // title bar
  c.fillStyle = '#1a2030';
  c.fillRect(0, 0, w, 34);
  ['#ff5f56', '#ffbd2e', '#27c93f'].forEach((col, i) => {
    c.fillStyle = col;
    c.beginPath();
    c.arc(22 + i * 22, 17, 6, 0, Math.PI * 2);
    c.fill();
  });
  c.fillStyle = '#6b7690';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.font = `600 13px ${MONO}`;
  c.fillText('portfolio \u2014 zsh', w / 2, 18);

  c.textAlign = 'left';
  c.font = `700 19px ${MONO}`;
  TERMINAL_LINES.forEach(([text, color], i) => {
    c.fillStyle = color;
    c.fillText(text, 20, 64 + i * 29);
  });
  // cursor
  const cy = 64 + TERMINAL_LINES.length * 29;
  c.fillStyle = '#35ffb0';
  c.fillText('$', 20, cy);
  c.fillRect(42, cy - 11, 11, 22);
};

const paintEditor: Painter = (c, w, h) => {
  c.fillStyle = '#0f1219';
  c.fillRect(0, 0, w, h);
  // sidebar + tab bar
  c.fillStyle = '#0a0c12';
  c.fillRect(0, 0, 64, h);
  c.fillStyle = '#161a24';
  c.fillRect(64, 0, w - 64, 30);
  c.fillStyle = '#0f1219';
  c.fillRect(74, 4, 96, 26);
  c.fillStyle = '#7aa2f7';
  c.fillRect(74, 4, 96, 2);
  c.fillStyle = '#9aa5c4';
  c.font = `600 12px ${MONO}`;
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillText('index.tsx', 86, 18);
  // sidebar icons
  c.fillStyle = '#2a3042';
  for (let i = 0; i < 5; i++) c.fillRect(20, 24 + i * 34, 24, 18);

  const palette = ['#7aa2f7', '#bb9af7', '#9ece6a', '#e0af68', '#7dcfff', '#c0caf5'];
  const indents = [0, 1, 1, 2, 2, 1, 0, 1, 2, 2, 2, 1, 0, 0, 1];
  c.fillStyle = 'rgba(255,255,255,0.05)';
  c.fillRect(64, 62 + 6 * 19 - 9, w - 64, 19);
  indents.forEach((ind, i) => {
    const y = 62 + i * 19;
    c.fillStyle = '#3b4261';
    c.textAlign = 'right';
    c.fillText(String(i + 1), 92, y);
    let x = 106 + ind * 18;
    const segs = 2 + ((i * 5) % 3);
    for (let s = 0; s < segs; s++) {
      const len = 24 + ((i * 37 + s * 53) % 60);
      c.fillStyle = palette[(i + s * 2) % palette.length];
      c.fillRect(x, y - 4, len, 8);
      x += len + 8;
    }
  });
  // status bar
  c.fillStyle = '#7aa2f7';
  c.fillRect(0, h - 20, w, 20);
  c.fillStyle = '#0f1219';
  c.textAlign = 'left';
  c.font = `700 11px ${MONO}`;
  c.fillText('main  \u2713  TypeScript', 74, h - 10);
};

const paintKeys: Painter = (c, w, h) => {
  c.fillStyle = '#16181d';
  c.fillRect(0, 0, w, h);
  c.fillStyle = '#2b2f38';
  const rows = 5;
  const cols = 14;
  const pad = 6;
  const kw = (w - pad * 2) / cols;
  const kh = (h - pad * 2) / rows;
  for (let r = 0; r < rows; r++) {
    for (let k = 0; k < cols; k++) {
      c.fillRect(pad + k * kw + 1.5, pad + r * kh + 1.5, kw - 3, kh - 3);
    }
  }
};

/* --------------------------------- builder -------------------------------- */

export function buildDetails(ctx: DeskCtx) {
  const { scene, std, canvasTex, bulbTex } = ctx;

  const mesh = (
    parent: THREE.Object3D,
    geo: THREE.BufferGeometry,
    mat: THREE.Material | THREE.Material[],
    x: number,
    y: number,
    z: number,
    cast = true,
  ) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = cast;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  const screenMat = (tex: THREE.Texture, glow = 0.55) =>
    new THREE.MeshStandardMaterial({
      map: tex,
      emissiveMap: tex,
      emissive: 0xffffff,
      emissiveIntensity: glow,
      roughness: 0.4,
    });

  /* ---------- wall: sprint kanban board ---------- */
  const KX = -0.5;
  const KY = 0.78;
  const kanban = new THREE.Group();
  kanban.position.set(KX, KY, WALL.z);
  scene.add(kanban);
  mesh(kanban, new THREE.BoxGeometry(0.25, 0.16, 0.008), std(0xaab2bd, 0.35, 0.8), 0, 0, 0.004);
  const kanbanFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.236, 0.147),
    new THREE.MeshStandardMaterial({ map: canvasTex(512, 320, paintKanban), roughness: 0.55 }),
  );
  kanbanFace.position.set(0, 0, 0.0085);
  kanbanFace.receiveShadow = true;
  kanban.add(kanbanFace);
  // marker tray
  mesh(kanban, new THREE.BoxGeometry(0.16, 0.006, 0.014), std(0x8f98a4, 0.4, 0.7), 0, -0.083, 0.01);

  /* ---------- wall: "open to work" neon sign ---------- */
  const neon = new THREE.Group();
  neon.position.set(NEON_POS.x, NEON_POS.y, WALL.z);
  scene.add(neon);
  mesh(neon, new THREE.BoxGeometry(0.2, 0.11, 0.008), std(0x0b0c10, 0.5), 0, 0, 0.004);
  const neonTex = canvasTex(512, 280, paintNeon);
  const neonMat = new THREE.MeshStandardMaterial({
    map: neonTex,
    emissiveMap: neonTex,
    emissive: 0xffffff,
    emissiveIntensity: 0.9,
    roughness: 0.5,
  });
  const neonFace = new THREE.Mesh(new THREE.PlaneGeometry(0.192, 0.105), neonMat);
  neonFace.position.set(0, 0, 0.0085);
  neon.add(neonFace);
  // standoff pins
  ([-1, 1] as const).forEach((sx) => {
    mesh(neon, new THREE.CylinderGeometry(0.003, 0.003, 0.012, 12), std(0xb9bec6, 0.3, 0.8), sx * 0.085, 0.045, 0.009, false).rotation.x =
      Math.PI / 2;
  });
  const neonHalo = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.3),
    new THREE.MeshBasicMaterial({
      map: bulbTex,
      color: new THREE.Color(NEON_COLOR),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.16,
    }),
  );
  neonHalo.position.set(NEON_POS.x, NEON_POS.y, WALL.z + 0.003);
  scene.add(neonHalo);

  /* ---------- shelf: tech books with a Rubik's cube on top ---------- */
  const book = (
    w: number,
    h: number,
    d: number,
    cover: number,
    pages: number,
    x: number,
    y: number,
    z: number,
    rotY: number,
  ) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = rotY;
    scene.add(g);
    mesh(g, new THREE.BoxGeometry(w, h, d), std(cover, 0.7), 0, 0, 0);
    mesh(g, new THREE.BoxGeometry(w - 0.004, h - 0.006, d - 0.002), std(pages, 0.9), 0, 0, 0.003, false);
  };
  const SX = -0.93;
  const SZ = -0.64;
  book(0.17, 0.022, 0.12, 0x1f3a5f, 0xeadfc6, SX, SHELF_TOP + 0.011, SZ, 0.08);
  book(0.15, 0.028, 0.11, 0xd9622b, 0xeadfc6, SX + 0.004, SHELF_TOP + 0.022 + 0.014, SZ, -0.05);
  book(0.16, 0.02, 0.115, 0x8a8f98, 0xeadfc6, SX - 0.003, SHELF_TOP + 0.05 + 0.01, SZ, 0.12);
  const stackTop = SHELF_TOP + 0.07;

  const cubeSize = 0.0096;
  const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
  const blk = std(0x101113, 0.6);
  const stk = {
    r: std(0xc0392b, 0.4),
    o: std(0xe67e22, 0.4),
    w: std(0xf2f2f2, 0.4),
    y: std(0xf1c40f, 0.4),
    g: std(0x27ae60, 0.4),
    b: std(0x2d6cdf, 0.4),
  };
  const rubik = new THREE.Group();
  rubik.position.set(SX, stackTop + 0.0145, SZ);
  rubik.rotation.y = 0.5;
  scene.add(rubik);
  const topLayer = new THREE.Group();
  topLayer.rotation.y = 0.45; // mid-solve twist
  rubik.add(topLayer);
  for (let ix = -1; ix <= 1; ix++) {
    for (let iy = -1; iy <= 1; iy++) {
      for (let iz = -1; iz <= 1; iz++) {
        const mats = [
          ix === 1 ? stk.r : blk,
          ix === -1 ? stk.o : blk,
          iy === 1 ? stk.w : blk,
          iy === -1 ? stk.y : blk,
          iz === 1 ? stk.g : blk,
          iz === -1 ? stk.b : blk,
        ];
        mesh(iy === 1 ? topLayer : rubik, cubeGeo, mats, ix * 0.00985, iy * 0.00985, iz * 0.00985);
      }
    }
  }

  /* ---------- shelf: film clapperboard ---------- */
  const clap = new THREE.Group();
  clap.position.set(1.08, SHELF_TOP, -0.64);
  clap.rotation.y = -0.25;
  scene.add(clap);
  const clapLean = new THREE.Group();
  clapLean.rotation.x = -0.18;
  clap.add(clapLean);
  const clapDark = std(0x17181c, 0.5);
  mesh(
    clapLean,
    new THREE.BoxGeometry(0.07, 0.05, 0.004),
    [
      clapDark,
      clapDark,
      clapDark,
      clapDark,
      new THREE.MeshStandardMaterial({ map: canvasTex(256, 180, paintClapBody), roughness: 0.6 }),
      clapDark,
    ],
    0,
    0.025,
    0,
  );
  const stickPivot = new THREE.Group();
  stickPivot.position.set(-0.035, 0.0505, 0);
  stickPivot.rotation.z = 0.28; // clapper slightly open
  clapLean.add(stickPivot);
  mesh(
    stickPivot,
    new THREE.BoxGeometry(0.07, 0.011, 0.004),
    [
      clapDark,
      clapDark,
      clapDark,
      clapDark,
      new THREE.MeshStandardMaterial({ map: canvasTex(256, 40, paintClapStripes), roughness: 0.6 }),
      clapDark,
    ],
    0.035,
    0.0055,
    0.001,
  );

  /* ---------- desk: small terminal screen ---------- */
  const term = new THREE.Group();
  term.position.set(TERM_POS.x, 0, TERM_POS.z);
  term.rotation.y = TERM_POS.rotY;
  scene.add(term);
  const darkMetal = std(0x1b1d22, 0.4, 0.6);
  mesh(term, new THREE.BoxGeometry(0.05, 0.003, 0.032), darkMetal, 0, 0.0015, 0); // base
  mesh(term, new THREE.BoxGeometry(0.008, 0.032, 0.006), darkMetal, 0, 0.019, -0.006); // neck
  mesh(term, new THREE.BoxGeometry(0.13, 0.083, 0.006), std(0x101114, 0.5), 0, 0.0755, 0); // bezel
  const termFace = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.075), screenMat(canvasTex(512, 320, paintTerminal)));
  termFace.position.set(0, 0.0755, 0.0032);
  term.add(termFace);

  /* ---------- desk: second laptop (code editor) ---------- */
  const LW = 0.30;
  const LD = 0.160;
  const laptop = new THREE.Group();
  laptop.position.set(LAPTOP_POS.x, 0, LAPTOP_POS.z);
  laptop.rotation.y = LAPTOP_POS.rotY;
  laptop.scale.setScalar(LAPTOP_SCALE);
  scene.add(laptop);
  const alu = std(0xaab2bd, 0.35, 0.8);
  mesh(laptop, new THREE.BoxGeometry(LW, 0.007, LD), alu, 0, 0.0035, 0);
  const keys = new THREE.Mesh(
    new THREE.PlaneGeometry(LW - 0.02, 0.045),
    new THREE.MeshStandardMaterial({ map: canvasTex(448, 144, paintKeys), roughness: 0.6 }),
  );
  keys.rotation.x = -Math.PI / 2;
  keys.position.set(0, 0.00705, -0.013);
  laptop.add(keys);
  mesh(laptop, new THREE.BoxGeometry(0.04, 0.0006, 0.026), std(0x8f98a4, 0.35, 0.7), 0, 0.0073, 0.031, false); // trackpad

  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, 0.007, -LD / 2);
  lidPivot.rotation.x = -1.83; // ~105 degrees open
  laptop.add(lidPivot);
  mesh(lidPivot, new THREE.BoxGeometry(LW, 0.004, LD), alu, 0, 0.002, LD / 2);
  const lidScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(LW - 0.006, LD - 0.006),
    screenMat(canvasTex(512, 346, paintEditor), 0.6),
  );
  lidScreen.rotation.x = Math.PI / 2; // faces the user once the lid is open
  lidScreen.position.set(0, -0.0003, LD / 2);
  lidPivot.add(lidScreen);

  /* ---------- per-frame animation ---------- */
  const update = (t: number) => {
    // neon: gentle pulse with an occasional electric buzz
    const buzz = Math.sin(t * 37) * Math.sin(t * 5.3) > 0.97 ? 0.55 : 1;
    const pulse = 0.9 + 0.05 * Math.sin(t * 1.4);
    neonMat.emissiveIntensity = pulse * buzz;
    (neonHalo.material as THREE.MeshBasicMaterial).opacity = (0.15 + 0.03 * Math.sin(t * 1.4)) * buzz;
  };
  update(2.5);

  return { update };
}