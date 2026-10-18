import * as THREE from 'three';
import type { DeskCtx } from './context';

/* ====================================================================== */
/*  Scene                                                                 */
/* ====================================================================== */

export function buildRoom(ctx: DeskCtx) {
  const { scene, add, std, woodTex, wallTex, glowTex } = ctx;

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
}

/* ====================================================================== */
/*  Books on the shelf                                                    */
/* ====================================================================== */

export function buildShelfBooks(ctx: DeskCtx) {
  const { scene, add, std } = ctx;

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
}
