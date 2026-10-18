import * as THREE from 'three';
import type { DeskCtx } from './context';

/* ====================================================================== */
/*  Desk lamp                                                             */
/* ====================================================================== */

export function buildLamp(ctx: DeskCtx) {
  const { scene, add, limb, std, bulbTex } = ctx;

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

  return { B, shade, bulb, shadeInnerMat, bulbMat, bulbSprite };
}
