import type { DeskCtx } from './context';

/* ====================================================================== */
/*  Cables                                                                */
/* ====================================================================== */

export function buildCables(ctx: DeskCtx, B: number[], MZ: number) {
  const { cable, std } = ctx;

  const cableMat = std(0x0a0a0a, 0.6);
  cable(
    [
      [0, 0.12, MZ - 0.043],
      [0, 0.03, MZ - 0.07],
      [-0.03, 0.003, -0.33],
      [-0.06, 0.003, -0.5],
      [-0.1, 0.003, -0.7],
    ],
    0.0022,
    cableMat,
  );
  cable(
    [
      [B[0] + 0.02, 0.014, B[2] - 0.03],
      [-0.78, 0.003, -0.4],
      [-0.9, 0.003, -0.5],
      [-0.95, 0.003, -0.7],
    ],
    0.002,
    cableMat,
  );

  return cableMat;
}
