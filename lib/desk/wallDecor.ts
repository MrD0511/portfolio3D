import * as THREE from 'three';
import type { DeskCtx } from './context';
import { WALL } from './constants';
import { drawCodePoster, drawMotivationPoster, drawSticky } from './posters';

/* ====================================================================== */
/*  Wall decor: framed posters + sticky notes                             */
/* ====================================================================== */

export function buildWallDecor(ctx: DeskCtx) {
  const { scene, std, canvasTex } = ctx;

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
}
