import * as THREE from 'three';
import type { DeskCtx } from './context';

/* ====================================================================== */
/*  Hot coffee cup (right of the mouse)                                   */
/* ====================================================================== */

export function buildCoffee(ctx: DeskCtx) {
  const { scene, std, steamTex, rl } = ctx;

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

  return { updateSteam };
}
