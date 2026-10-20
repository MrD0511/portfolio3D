import * as THREE from 'three';
import type { DeskCtx } from './context';

/* ====================================================================== */
/*  Closed jar terrarium (right of the monitor)                           */
/* ====================================================================== */

function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

/**
 * A small sealed glass jar with a cork stopper and a living landscape inside:
 * pebble drainage layer, soil, moss, a fern, a succulent, mushrooms, a tiny
 * tree and a rock, with condensation droplets on the inside of the glass.
 *
 * It uses its own random generator so it does not shift the sequence that the
 * other builders get from ctx.rl.
 */
export function buildTerrarium(ctx: DeskCtx) {
  const { scene, std } = ctx;
  const rnd = lcg(31);

  const T = new THREE.Group();
  T.position.set(0.68, 0, -0.04);
  T.rotation.y = -0.4;
  scene.add(T);

  const part = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    cast = true,
  ) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = cast;
    m.receiveShadow = true;
    T.add(m);
    return m;
  };

  const BASE = 0.006; // coaster thickness; the jar sits on top of it
  const SOIL_TOP = BASE + 0.04;

  // cork coaster
  part(new THREE.CylinderGeometry(0.068, 0.068, BASE, 40), std(0x8a5a35, 0.95), 0, BASE / 2, 0);

  /* ---------- glass jar ---------- */
  const profile = [
    [0.0, 0.0],
    [0.04, 0.0],
    [0.049, 0.006],
    [0.0535, 0.02],
    [0.0545, 0.045],
    [0.0545, 0.085],
    [0.052, 0.098],
    [0.043, 0.108],
    [0.034, 0.113],
    [0.0325, 0.118],
    [0.0345, 0.121],
    [0.0345, 0.123],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const glass = new THREE.Mesh(
    new THREE.LatheGeometry(profile, 56),
    new THREE.MeshStandardMaterial({
      color: 0xdff1ee,
      roughness: 0.04,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  glass.position.y = BASE;
  glass.renderOrder = 3;
  T.add(glass);

  /* ---------- layers ---------- */
  // drainage filler + pebbles
  part(new THREE.CylinderGeometry(0.0495, 0.0495, 0.024, 40), std(0x66625b, 0.9), 0, BASE + 0.012, 0, false);

  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();

  const pebbleCols = [0x8d8a85, 0xb5aea2, 0x6e6a66, 0xa09484];
  const pebbles = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), std(0xffffff, 0.8), 34);
  for (let i = 0; i < 34; i++) {
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * 0.043;
    const s = 0.0035 + rnd() * 0.0035;
    dummy.position.set(Math.cos(a) * r, BASE + 0.011 + rnd() * 0.003, Math.sin(a) * r);
    dummy.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
    dummy.scale.set(s, s * 0.75, s);
    dummy.updateMatrix();
    pebbles.setMatrixAt(i, dummy.matrix);
    pebbles.setColorAt(i, tint.set(pebbleCols[Math.floor(rnd() * pebbleCols.length)]));
  }
  if (pebbles.instanceColor) pebbles.instanceColor.needsUpdate = true;
  pebbles.castShadow = true;
  pebbles.receiveShadow = true;
  T.add(pebbles);

  // soil
  part(new THREE.CylinderGeometry(0.0495, 0.0495, 0.018, 40), std(0x3a2615, 1), 0, BASE + 0.031, 0, false);

  // moss: lots of flattened green blobs, kept inside the glass wall
  const mossCols = [0x3f6b32, 0x4f7d3a, 0x2f5a2c, 0x5a8a42];
  const MOSS = 44;
  const moss = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, emissive: 0x0d1f0a, emissiveIntensity: 0.5 }),
    MOSS,
  );
  for (let i = 0; i < MOSS; i++) {
    const s = 0.006 + rnd() * 0.009;
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * (0.0505 - s);
    dummy.position.set(Math.cos(a) * r, SOIL_TOP + 0.001, Math.sin(a) * r);
    dummy.rotation.set(0, rnd() * 3, 0);
    dummy.scale.set(s, s * 0.45, s);
    dummy.updateMatrix();
    moss.setMatrixAt(i, dummy.matrix);
    moss.setColorAt(i, tint.set(mossCols[Math.floor(rnd() * mossCols.length)]));
  }
  if (moss.instanceColor) moss.instanceColor.needsUpdate = true;
  moss.castShadow = true;
  moss.receiveShadow = true;
  T.add(moss);

  /* ---------- plants ---------- */
  const foliage = (color: number, emissive: number) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.7, emissive, emissiveIntensity: 0.45 });

  const blade = (
    mat: THREE.Material,
    px: number,
    pz: number,
    h: number,
    radius: number,
    rotY: number,
    tilt: number,
    flat = 0.3,
  ) => {
    const g = new THREE.ConeGeometry(radius, h, 5);
    g.translate(0, h / 2, 0);
    const m = new THREE.Mesh(g, mat);
    m.scale.z = flat;
    m.castShadow = true;
    const pivot = new THREE.Group();
    pivot.position.set(px, SOIL_TOP, pz);
    pivot.rotation.order = 'YXZ';
    pivot.rotation.y = rotY;
    pivot.rotation.x = tilt;
    pivot.add(m);
    T.add(pivot);
  };

  // fern
  const fernMat = foliage(0x2f7a3a, 0x0f2a12);
  for (let i = 0; i < 9; i++) {
    blade(fernMat, -0.015, 0.012, 0.034 + rnd() * 0.016, 0.0035, (i / 9) * Math.PI * 2 + rnd() * 0.4, 0.25 + rnd() * 0.35);
  }

  // succulent rosette: an outer ring of open petals and a tighter inner ring
  const succOuter = foliage(0x86b27a, 0x1a2e16);
  const succInner = foliage(0x9cc58a, 0x1f3a1a);
  for (let i = 0; i < 9; i++) {
    blade(succOuter, 0.022, -0.016, 0.02, 0.0055, (i / 9) * Math.PI * 2, 0.95 + rnd() * 0.15, 0.35);
  }
  for (let i = 0; i < 6; i++) {
    blade(succInner, 0.022, -0.016, 0.016, 0.0045, (i / 6) * Math.PI * 2 + 0.3, 0.5 + rnd() * 0.1, 0.35);
  }

  // mushrooms
  const stemMat = std(0xefe6d2, 0.7);
  const capMat = new THREE.MeshStandardMaterial({ color: 0xc4382a, roughness: 0.5, side: THREE.DoubleSide });
  const dotMat = std(0xfff8ec, 0.6);
  const mushroom = (x: number, z: number, stemH: number, capR: number) => {
    part(new THREE.CylinderGeometry(capR * 0.25, capR * 0.3, stemH, 10), stemMat, x, SOIL_TOP + stemH / 2, z);
    const cap = part(
      new THREE.SphereGeometry(capR, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      capMat,
      x,
      SOIL_TOP + stemH,
      z,
    );
    cap.scale.y = 0.8;
    [
      [0.35, 0.4],
      [0.6, 2.4],
      [0.55, 4.1],
      [0.8, 5.5],
    ].forEach(([theta, phi]) => {
      part(
        new THREE.SphereGeometry(capR * 0.16, 6, 4),
        dotMat,
        x + capR * 1.0 * Math.sin(theta) * Math.cos(phi),
        SOIL_TOP + stemH + capR * 0.8 * Math.cos(theta) * 1.01,
        z + capR * 1.0 * Math.sin(theta) * Math.sin(phi),
        false,
      );
    });
  };
  mushroom(-0.022, -0.027, 0.016, 0.0085);
  mushroom(-0.01, -0.036, 0.01, 0.005);

  // tiny tree
  const trunk = part(
    new THREE.CylinderGeometry(0.0011, 0.0018, 0.04, 6),
    std(0x4a3320, 0.9),
    0.006,
    SOIL_TOP + 0.02,
    0.03,
  );
  trunk.rotation.z = 0.08;
  [
    [0.0, 0.001, 0.0, 0.0095, 0x3f8a4a],
    [-0.007, -0.004, 0.002, 0.0075, 0x2f7a3a],
    [0.007, -0.003, -0.002, 0.0075, 0x4f9a54],
    [0.0, -0.006, 0.006, 0.006, 0x3a8545],
  ].forEach(([dx, dy, dz, r, c]) => {
    part(new THREE.SphereGeometry(r, 10, 8), foliage(c, 0x0f2a12), 0.009 + dx, SOIL_TOP + 0.04 + dy, 0.03 + dz);
  });

  // rock
  const rock = part(
    new THREE.DodecahedronGeometry(0.011, 0),
    std(0x7b7872, 0.9),
    0.032,
    SOIL_TOP + 0.003,
    0.018,
  );
  rock.scale.set(1, 0.7, 0.9);
  rock.rotation.y = 0.6;

  /* ---------- condensation on the inside of the glass ---------- */
  const DROPS = 46;
  const drops = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 6, 4),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.5, depthWrite: false }),
    DROPS,
  );
  for (let i = 0; i < DROPS; i++) {
    const a = rnd() * Math.PI * 2;
    const y = BASE + 0.04 + Math.pow(rnd(), 0.7) * 0.06;
    const r = y > BASE + 0.085 ? 0.0505 : 0.0533;
    const s = 0.0008 + rnd() * 0.0012;
    dummy.position.set(Math.sin(a) * r, y, Math.cos(a) * r);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(s, s * 1.3, s);
    dummy.updateMatrix();
    drops.setMatrixAt(i, dummy.matrix);
  }
  drops.renderOrder = 2;
  T.add(drops);

  /* ---------- glass highlights (the lamp's reflection, on the left) ---------- */
  const sheenMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  ([
    [-0.5, 0.006, 0.062, 0.055],
    [-0.36, 0.003, 0.03, 0.062],
  ] as const).forEach(([a, w, h, y]) => {
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(w, h), sheenMat);
    strip.position.set(Math.sin(a) * 0.0549, BASE + y, Math.cos(a) * 0.0549);
    strip.rotation.y = a;
    strip.renderOrder = 4;
    T.add(strip);
  });

  /* ---------- cork stopper + brass band ---------- */
  part(new THREE.CylinderGeometry(0.036, 0.031, 0.022, 32), std(0xb8895a, 0.95), 0, BASE + 0.125, 0);
  const band = part(
    new THREE.TorusGeometry(0.0338, 0.0012, 8, 32),
    std(0xc9a45c, 0.35, 0.9),
    0,
    BASE + 0.116,
    0,
    false,
  );
  band.rotation.x = Math.PI / 2;
}