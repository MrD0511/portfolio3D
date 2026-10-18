import * as THREE from 'three';
import type { DeskCtx } from './context';
import { SCREEN } from './constants';

/* ====================================================================== */
/*  Monitor                                                               */
/* ====================================================================== */

export function buildMonitor(ctx: DeskCtx) {
  const { scene, add, std, screenTex, options } = ctx;

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

  return { MZ, screenMat };
}
