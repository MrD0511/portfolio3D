import * as THREE from 'three';
import {
  FontStacks,
  drawBulbGlow,
  drawSite,
  drawSteamPuff,
  drawWall,
  drawWallGlow,
  drawWood,
  makeCanvasTexture,
} from './textures';
import type { Painter } from './posters';

/**
 * Everything the individual scene builders share: the scene itself, the
 * small mesh helpers, the seeded random, and the textures created once at
 * start-up.
 */
export interface DeskCtx {
  scene: THREE.Scene;
  options: { liveScreen?: boolean };
  std: (color: number, roughness?: number, metalness?: number) => THREE.MeshStandardMaterial;
  add: (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    shadow?: boolean,
  ) => THREE.Mesh;
  limb: (a: number[], b: number[], r: number, mat: THREE.Material) => THREE.Mesh;
  /** A thin cable lying along a smooth curve through the given points. */
  cable: (pts: number[][], radius: number, mat: THREE.Material) => THREE.Mesh;
  rl: () => number;
  extraTextures: THREE.Texture[];
  canvasTex: (w: number, h: number, paint: Painter) => THREE.Texture;
  woodTex: THREE.CanvasTexture;
  wallTex: THREE.CanvasTexture;
  glowTex: THREE.CanvasTexture;
  bulbTex: THREE.CanvasTexture;
  steamTex: THREE.CanvasTexture;
  screenTex: THREE.CanvasTexture;
  paintScreen: () => void;
}

export function createDeskCtx(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  fonts: FontStacks,
  options: { liveScreen?: boolean } = {},
): DeskCtx {
  const aniso = renderer.capabilities.getMaxAnisotropy();

  /* ---------- small helpers ---------- */
  const std = (color: number, roughness = 0.6, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });

  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, shadow = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = shadow;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  };

  const limb = (a: number[], b: number[], r: number, mat: THREE.Material) => {
    const A = new THREE.Vector3(...(a as [number, number, number]));
    const B = new THREE.Vector3(...(b as [number, number, number]));
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, A.distanceTo(B), 16), mat);
    m.position.copy(A).add(B).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
    m.castShadow = true;
    scene.add(m);
    return m;
  };

  const cable = (pts: number[][], radius: number, mat: THREE.Material) => {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, radius, 6, false), mat);
    m.receiveShadow = true;
    scene.add(m);
    return m;
  };

  let seed = 5;
  const rl = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  const extraTextures: THREE.Texture[] = [];
  const canvasTex = (w: number, h: number, paint: Painter) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    paint(c.getContext('2d')!, w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = aniso;
    extraTextures.push(t);
    return t;
  };

  /* ---------- textures ---------- */
  const woodTex = makeCanvasTexture(1024, 512, drawWood, aniso);
  const wallTex = makeCanvasTexture(512, 512, drawWall, aniso);
  wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
  wallTex.repeat.set(5, 2.5);
  const glowTex = makeCanvasTexture(512, 256, drawWallGlow, aniso);
  const bulbTex = makeCanvasTexture(128, 128, drawBulbGlow, aniso);
  const steamTex = makeCanvasTexture(128, 128, drawSteamPuff, aniso);

  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 1600;
  screenCanvas.height = 900;
  const paintScreen = () => drawSite(screenCanvas.getContext('2d')!, 1600, 900, fonts);
  paintScreen();
  const screenTex = new THREE.CanvasTexture(screenCanvas);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  screenTex.anisotropy = aniso;

  return {
    scene,
    options,
    std,
    add,
    limb,
    cable,
    rl,
    extraTextures,
    canvasTex,
    woodTex,
    wallTex,
    glowTex,
    bulbTex,
    steamTex,
    screenTex,
    paintScreen,
  };
}
