import * as THREE from 'three';
import type { DeskCtx } from './context';
import { WALL } from './constants';
import type { Painter } from './posters';

/* ====================================================================== */
/*  Everyday clutter: phone, notes, books, a desk fan, shelf keepsakes    */
/*  and a wall clock. These sit around the existing props rather than     */
/*  replacing them, so the desk still reads as one lived-in space.        */
/* ====================================================================== */

const SANS = 'Helvetica, Arial, sans-serif';
const MONO = '"Courier New", Courier, monospace';
const SHELF_TOP = 0.2225;

/* ---------------------------- canvas painters ---------------------------- */

const paintSketch: Painter = (c, w, h) => {
  c.fillStyle = '#f4efe3';
  c.fillRect(0, 0, w, h);

  // paper grain
  for (let i = 0; i < 900; i++) {
    const x = (i * 97) % w;
    const y = (i * 53) % h;
    c.fillStyle = `rgba(120,100,60,${0.02 + ((i * 7) % 5) * 0.006})`;
    c.fillRect(x, y, 1.5, 1.5);
  }

  // faint grid
  c.strokeStyle = 'rgba(90,120,160,0.16)';
  c.lineWidth = 1;
  for (let x = 28; x < w; x += 26) {
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x, h);
    c.stroke();
  }
  for (let y = 28; y < h; y += 26) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(w, y);
    c.stroke();
  }

  c.strokeStyle = '#3c5f8f';
  c.fillStyle = '#3c5f8f';
  c.lineWidth = 2.4;
  c.lineCap = 'round';
  c.lineJoin = 'round';

  // wireframe boxes
  c.strokeRect(42, 54, 108, 72);
  c.strokeRect(58, 70, 108, 72);
  c.beginPath();
  c.moveTo(42, 54);
  c.lineTo(58, 70);
  c.moveTo(150, 54);
  c.lineTo(166, 70);
  c.moveTo(42, 126);
  c.lineTo(58, 142);
  c.moveTo(150, 126);
  c.lineTo(166, 142);
  c.stroke();

  // arrows and flow
  c.beginPath();
  c.moveTo(186, 92);
  c.lineTo(234, 92);
  c.lineTo(226, 84);
  c.moveTo(234, 92);
  c.lineTo(226, 100);
  c.stroke();

  // little component sketch
  c.beginPath();
  c.arc(230, 58, 24, 0, Math.PI * 2);
  c.stroke();
  c.beginPath();
  c.moveTo(206, 58);
  c.lineTo(198, 58);
  c.moveTo(254, 58);
  c.lineTo(262, 58);
  c.moveTo(230, 34);
  c.lineTo(230, 26);
  c.moveTo(230, 82);
  c.lineTo(230, 90);
  c.stroke();

  // code scribble
  c.font = `700 20px ${MONO}`;
  c.fillText('const ship = () =>', 44, 200);
  c.fillText("  'it';", 62, 228);

  // rocket doodle
  c.save();
  c.translate(238, 186);
  c.rotate(-0.5);
  c.beginPath();
  c.moveTo(0, -30);
  c.quadraticCurveTo(18, 4, 8, 34);
  c.lineTo(-8, 34);
  c.quadraticCurveTo(-18, 4, 0, -30);
  c.stroke();
  c.beginPath();
  c.arc(0, -2, 6, 0, Math.PI * 2);
  c.stroke();
  c.beginPath();
  c.moveTo(-8, 20);
  c.lineTo(-18, 34);
  c.moveTo(8, 20);
  c.lineTo(18, 34);
  c.stroke();
  c.restore();

  // annotations
  c.font = `italic 600 17px ${SANS}`;
  c.fillText('idea!', 46, 284);
  c.beginPath();
  c.moveTo(46, 292);
  c.lineTo(96, 292);
  c.stroke();
  c.font = `500 15px ${SANS}`;
  c.fillText('ship small, ship often', 46, 326);
  c.fillText('coffee \u2192 code \u2192 repeat', 46, 352);

  // coffee ring
  c.strokeStyle = 'rgba(140,90,45,0.35)';
  c.lineWidth = 7;
  c.beginPath();
  c.arc(258, 318, 30, 0, Math.PI * 2);
  c.stroke();
  c.strokeStyle = 'rgba(140,90,45,0.16)';
  c.lineWidth = 2;
  c.beginPath();
  c.arc(258, 318, 38, 0, Math.PI * 2);
  c.stroke();
};

const paintPhoto: Painter = (c, w, h) => {
  const sky = c.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#16213e');
  sky.addColorStop(0.45, '#5b3a6e');
  sky.addColorStop(0.72, '#e07a5f');
  sky.addColorStop(1, '#f2b263');
  c.fillStyle = sky;
  c.fillRect(0, 0, w, h);

  // stars
  for (let i = 0; i < 40; i++) {
    c.fillStyle = `rgba(255,255,255,${0.15 + ((i * 13) % 7) * 0.08})`;
    c.fillRect((i * 73) % w, (i * 37) % (h * 0.5), 1.6, 1.6);
  }

  // sun
  c.fillStyle = '#ffd18a';
  c.beginPath();
  c.arc(w * 0.58, h * 0.55, w * 0.15, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(255,209,138,0.22)';
  c.beginPath();
  c.arc(w * 0.58, h * 0.55, w * 0.25, 0, Math.PI * 2);
  c.fill();

  // mountains
  c.fillStyle = '#2a2340';
  c.beginPath();
  c.moveTo(0, h * 0.7);
  c.lineTo(w * 0.18, h * 0.48);
  c.lineTo(w * 0.34, h * 0.66);
  c.lineTo(w * 0.52, h * 0.44);
  c.lineTo(w * 0.74, h * 0.68);
  c.lineTo(w, h * 0.5);
  c.lineTo(w, h);
  c.lineTo(0, h);
  c.closePath();
  c.fill();
  c.fillStyle = '#171a2c';
  c.beginPath();
  c.moveTo(0, h * 0.82);
  c.lineTo(w * 0.25, h * 0.66);
  c.lineTo(w * 0.48, h * 0.84);
  c.lineTo(w * 0.7, h * 0.64);
  c.lineTo(w, h * 0.8);
  c.lineTo(w, h);
  c.lineTo(0, h);
  c.closePath();
  c.fill();

  // grain
  for (let i = 0; i < 500; i++) {
    c.fillStyle = `rgba(0,0,0,${0.02 + ((i * 11) % 4) * 0.008})`;
    c.fillRect((i * 61) % w, (i * 43) % h, 1.4, 1.4);
  }
};

const paintClockFace: Painter = (c, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  c.fillStyle = '#efe6d2';
  c.fillRect(0, 0, w, h);

  const v = c.createRadialGradient(cx, cy, 10, cx, cy, w / 2);
  v.addColorStop(0, 'rgba(255,255,255,0.55)');
  v.addColorStop(0.7, 'rgba(255,255,255,0)');
  v.addColorStop(1, 'rgba(120,90,50,0.22)');
  c.fillStyle = v;
  c.beginPath();
  c.arc(cx, cy, w / 2, 0, Math.PI * 2);
  c.fill();

  // minute ticks
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const major = i % 5 === 0;
    const r1 = w * (major ? 0.36 : 0.4);
    const r2 = w * 0.45;
    c.strokeStyle = major ? '#2b2b2b' : 'rgba(43,43,43,0.55)';
    c.lineWidth = major ? 5 : 2;
    c.beginPath();
    c.moveTo(cx + Math.sin(a) * r1, cy - Math.cos(a) * r1);
    c.lineTo(cx + Math.sin(a) * r2, cy - Math.cos(a) * r2);
    c.stroke();
  }

  c.fillStyle = '#222222';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.font = `700 34px ${SANS}`;
  [
    ['12', 0, -0.27],
    ['3', 0.27, 0],
    ['6', 0, 0.27],
    ['9', -0.27, 0],
  ].forEach(([t, x, y]) => c.fillText(String(t), cx + Number(x) * w, cy + Number(y) * w));

  c.fillStyle = 'rgba(60,60,60,0.5)';
  c.font = `600 11px ${SANS}`;
  c.fillText('PORTFOLIO', cx, cy + w * 0.17);
};

/* --------------------------------- builder -------------------------------- */

export function buildClutter(ctx: DeskCtx) {
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

  /* ---------- sketch sheet + pencil + eraser ---------- */
  const paper = new THREE.Group();
  paper.position.set(-0.27, 0.0009, 0.46);
  paper.rotation.y = -0.15;
  scene.add(paper);
  const sheet = new THREE.Mesh(
    new THREE.PlaneGeometry(0.13, 0.17),
    new THREE.MeshStandardMaterial({ map: canvasTex(420, 540, paintSketch), roughness: 0.92 }),
  );
  sheet.rotation.x = -Math.PI / 2;
  sheet.receiveShadow = true;
  paper.add(sheet);

  const pencil = new THREE.Mesh(new THREE.CylinderGeometry(0.0026, 0.0026, 0.145, 10), std(0xd8a83c, 0.45, 0.1));
  pencil.position.set(0.078, 0.0035, 0.012);
  pencil.rotation.z = Math.PI / 2;
  pencil.rotation.y = 0.12;
  pencil.castShadow = true;
  paper.add(pencil);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.0026, 0.012, 10), std(0x3a2a1c, 0.8));
  tip.position.set(0.151, 0.0035, 0.024);
  tip.rotation.z = -Math.PI / 2;
  paper.add(tip);

  mesh(paper, new THREE.BoxGeometry(0.026, 0.009, 0.015), std(0xe89aa8, 0.85), 0.083, 0.0045, -0.06, false);

  /* ---------- small stack of books on the left ---------- */
  const books = new THREE.Group();
  books.position.set(-1.0, 0, 0.18);
  books.rotation.y = 0.14;
  scene.add(books);
  const bookCover = std(0x1f3a5f, 0.7);
  const bookPages = std(0xe9dfc8, 0.9);
  mesh(books, new THREE.BoxGeometry(0.16, 0.024, 0.22), bookCover, 0, 0.012, 0);
  mesh(books, new THREE.BoxGeometry(0.154, 0.006, 0.21), bookPages, 0.002, 0.027, 0);
  const secondCover = std(0xb05a2a, 0.7);
  const second = new THREE.Group();
  second.rotation.y = -0.07;
  books.add(second);
  mesh(second, new THREE.BoxGeometry(0.145, 0.02, 0.2), secondCover, 0, 0.04, 0);
  mesh(second, new THREE.BoxGeometry(0.14, 0.005, 0.19), bookPages, 0.002, 0.0525, 0);
  // a slim bookmark poking out
  mesh(second, new THREE.BoxGeometry(0.012, 0.0015, 0.06), std(0xd9b45a, 0.5, 0.2), 0.03, 0.0565, 0.09, false);

  /* ---------- shelf: leaning polaroid + candle ---------- */
  const photo = new THREE.Group();
  photo.position.set(0.42, SHELF_TOP + 0.001, -0.68);
  photo.rotation.x = -0.16;
  photo.rotation.y = 0.08;
  scene.add(photo);
  const frameMat = std(0x2a1a10, 0.55);
  mesh(photo, new THREE.BoxGeometry(0.086, 0.108, 0.007), frameMat, 0, 0.054, 0);
  mesh(
    photo,
    new THREE.PlaneGeometry(0.074, 0.094),
    new THREE.MeshStandardMaterial({ map: canvasTex(300, 380, paintPhoto), roughness: 0.65 }),
    0,
    0.054,
    0.0038,
    false,
  );
  // little easel foot
  const foot = mesh(photo, new THREE.BoxGeometry(0.012, 0.03, 0.006), frameMat, 0, 0.014, -0.012);
  foot.rotation.x = 0.45;

  const candle = new THREE.Group();
  candle.position.set(0.15, SHELF_TOP + 0.001, -0.66);
  scene.add(candle);
  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.024, 0.052, 28, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xdfe9e4,
      roughness: 0.05,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  glass.position.y = 0.027;
  candle.add(glass);
  mesh(candle, new THREE.CylinderGeometry(0.0245, 0.0245, 0.004, 28), std(0xb8895a, 0.9), 0, 0.003, 0, false);
  mesh(candle, new THREE.CylinderGeometry(0.021, 0.022, 0.028, 28), std(0xefe3c6, 0.8), 0, 0.02, 0);
  mesh(candle, new THREE.CylinderGeometry(0.0011, 0.0011, 0.008, 6), std(0x2a2118, 0.9), 0, 0.038, 0, false);
  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.0038, 0.014, 10),
    new THREE.MeshBasicMaterial({ color: 0xffc46a, toneMapped: false }),
  );
  flame.position.y = 0.049;
  candle.add(flame);
  const flameGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: bulbTex,
      color: 0xffa040,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.34,
    }),
  );
  flameGlow.position.y = 0.05;
  flameGlow.scale.set(0.075, 0.075, 1);
  candle.add(flameGlow);

  /* ---------- wall clock (animated hands) ---------- */
  const clock = new THREE.Group();
  clock.position.set(0.08, 0.9, WALL.z);
  scene.add(clock);
  const clockCase = std(0x241a14, 0.5, 0.3);
  mesh(clock, new THREE.CylinderGeometry(0.058, 0.058, 0.012, 48), clockCase, 0, 0, 0.004).rotation.x = Math.PI / 2;
  const face = new THREE.Mesh(
    new THREE.CircleGeometry(0.052, 48),
    new THREE.MeshStandardMaterial({ map: canvasTex(300, 300, paintClockFace), roughness: 0.75 }),
  );
  face.position.z = 0.0112;
  clock.add(face);
  mesh(clock, new THREE.TorusGeometry(0.056, 0.0028, 10, 48), std(0xb9a06a, 0.4, 0.8), 0, 0, 0.011, false);

  const hand = (len: number, w: number, color: number, z: number) => {
    const pivot = new THREE.Group();
    const geo = new THREE.BoxGeometry(w, len, 0.0018);
    geo.translate(0, len / 2, 0);
    const m = new THREE.Mesh(geo, std(color, 0.4));
    m.castShadow = false;
    pivot.add(m);
    pivot.position.z = z;
    clock.add(pivot);
    return pivot;
  };
  const hourHand = hand(0.027, 0.0042, 0x222222, 0.0128);
  const minuteHand = hand(0.038, 0.003, 0x222222, 0.0135);
  const secondHand = hand(0.043, 0.0014, 0xc0392b, 0.0142);
  mesh(clock, new THREE.CylinderGeometry(0.0035, 0.0035, 0.003, 16), std(0x222222, 0.4), 0, 0, 0.0146, false).rotation.x =
    Math.PI / 2;

  /* ---------- per-frame animation ---------- */
  const update = (t: number) => {
    // candle flicker
    const flicker = 0.9 + Math.sin(t * 13.1) * 0.06 + Math.sin(t * 7.3 + 1.7) * 0.04;
    flame.scale.set(1, flicker, 1);
    flame.position.x = Math.sin(t * 9.1) * 0.0006;
    (flameGlow.material as THREE.SpriteMaterial).opacity = 0.28 + flicker * 0.08;
    // the clock starts at 10:10:20 and keeps ticking
    const seconds = 20 + t;
    const minutes = 10 + seconds / 60;
    const hours = 10 + minutes / 60;
    hourHand.rotation.z = -((hours % 12) / 12) * Math.PI * 2;
    minuteHand.rotation.z = -((minutes % 60) / 60) * Math.PI * 2;
    secondHand.rotation.z = -((seconds % 60) / 60) * Math.PI * 2;
  };
  update(0);

  return { update };
}
