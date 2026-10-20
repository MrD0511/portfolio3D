import * as THREE from 'three';
import type { FontStacks } from './textures';
import { LIGHTS } from './constants';
import { createDeskCtx } from './context';
import { buildRoom, buildShelfBooks } from './room';
import { buildWallDecor } from './wallDecor';
import { buildMonitor } from './monitor';
import { buildLamp } from './lamp';
import { buildCables } from './cables';
import { buildDeskProps } from './props';
import { buildCoffee } from './coffee';
import { buildGadgets } from './gadgets';
import { buildLights } from './lights';
import { buildDetails } from './details';
import { buildTerrarium } from './terrarium';

export { LIGHTS, SCREEN, WALL } from './constants';

export interface DeskHandles {
  /** Re-draws the monitor texture (call once webfonts have loaded). */
  redrawScreen: () => void;
  /** 0..1 levels for the desk lamp and the monitor glow. */
  setLevels: (lamp: number, screen: number) => void;
  /** Animates the coffee steam and the dust in the lamp beam. Pass elapsed time in seconds. */
  update: (time: number) => void;
  dispose: () => void;
}

export function buildDesk(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  fonts: FontStacks,
  options: { liveScreen?: boolean } = {},
): DeskHandles {
  const ctx = createDeskCtx(scene, renderer, fonts, options);

  buildRoom(ctx);
  buildWallDecor(ctx);
  buildShelfBooks(ctx);
  buildDetails(ctx);
  buildTerrarium(ctx);
  const { MZ, screenMat } = buildMonitor(ctx);
  const { B, shade, bulb, shadeInnerMat, bulbMat, bulbSprite } = buildLamp(ctx);
  const cableMat = buildCables(ctx, B, MZ);
  buildDeskProps(ctx, cableMat);
  const { updateSteam } = buildCoffee(ctx);
  buildGadgets(ctx);
  const { lampSpot, lampWash, lampFill, pool, beamMat, dustMat, updateDust, screenLight } = buildLights(ctx, {
    shade,
    bulb,
  });

  /* ---------- handles ---------- */
  return {
    redrawScreen() {
      ctx.paintScreen();
      ctx.screenTex.needsUpdate = true;
    },
    setLevels(lamp: number, screenLevel: number) {
      lampSpot.intensity = LIGHTS.lampSpot * lamp;
      lampWash.intensity = LIGHTS.lampWash * lamp;
      lampFill.intensity = LIGHTS.lampFill * lamp;
      pool.material.opacity = 0.22 * lamp;
      beamMat.uniforms.uStrength.value = 0.16 * lamp;
      dustMat.opacity = 0.6 * lamp;
      bulbSprite.material.opacity = 0.9 * lamp;
      bulbMat.color.setRGB(0.35 + 0.65 * lamp, 0.3 + 0.62 * lamp, 0.25 + 0.5 * lamp);
      shadeInnerMat.emissiveIntensity = 1.0 * lamp;
      screenLight.intensity = LIGHTS.screen * screenLevel;
      if (!options.liveScreen) screenMat.color.setScalar(0.06 + 0.94 * screenLevel);
    },
    update(t: number) {
      updateSteam(t);
      updateDust(t);
    },
    dispose() {
      ctx.scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat?.dispose();
      });
      [ctx.woodTex, ctx.wallTex, ctx.glowTex, ctx.bulbTex, ctx.steamTex, ctx.screenTex, ...ctx.extraTextures].forEach(
        (t) => t.dispose(),
      );
    },
  };
}
