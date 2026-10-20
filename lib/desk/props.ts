import * as THREE from 'three';
import type { DeskCtx } from './context';

/* ====================================================================== */
/*  Small desk props                                                      */
/* ====================================================================== */

export function buildDeskProps(ctx: DeskCtx, cableMat: THREE.Material) {
  const { scene, add, std, cable } = ctx;

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
    nb.position.set(-0.65, 0, 0.40);
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
    const PX = -0.70;
    const PZ = 0.25;
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
}
