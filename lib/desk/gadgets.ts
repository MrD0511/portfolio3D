import * as THREE from 'three';
import type { DeskCtx } from './context';

/* ====================================================================== */
/*  Desk gadgets: rubik's cube, headphones, PC case, plant                */
/* ====================================================================== */

export function buildGadgets(ctx: DeskCtx) {
  const { scene, add, std, rl } = ctx;

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
}
