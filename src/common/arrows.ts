export type ArrowCtx = { x: number; y: number; a: number[]; };

export function getDirect(ctx: ArrowCtx): number {
  let value = 0;

  for (let i = 0; i < 8; i++) {
    value <<= 1;
    const arrow = world.getArrow(ctx.x + i, ctx.y);

    if (arrow && arrow.type >= 16)
      value |= 1;
  }

  return value;
}

export function setDirect(ctx: ArrowCtx, value: number) {
  for (let i = 7; i >= 0; i--) {
    const arrowType = ctx.a[value & 1];
    world.setArrow(ctx.x + i, ctx.y, arrowType, 1, false);
    value >>= 1;
  }
}

export function createCtx(x: number, y: number): ArrowCtx {
  const xMod = x & 8;
  const yMod = y & 8;
  const arrowTypes = xMod === yMod ? arrowTypes1 : arrowTypes2;
  return { x, y, a: arrowTypes };
}

const arrowTypes1 = [10, 25];
const arrowTypes2 = [1, 18];
