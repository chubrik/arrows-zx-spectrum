import { describe, expect, it, vi } from 'vitest';
import { ATTRIBUTES_MIN_ADDR, BIT7, DISPLAY_LINE_COUNT, DISPLAY_MIN_ADDR } from '../src/common/constants';
import { initMemory, mem, write } from '../src/common/memory';
import { commitDisplayLine, incFrameCount, initScreen, refreshScreen } from '../src/common/screen';
import { cpuX, cpuY, initState, memoryX, memoryY } from '../src/common/state';

// Line-by-line display commit of the screen.ts module with the world mock of setup.ts. Checks which
// display lines get redrawn after a byte or an attribute is written, and in which frame: an
// attribute changed before its row is drawn on all eight lines at once, one changed during the row
// is drawn on the remaining lines now and on the whole row in the next frame.

// The copy interceptor is installed before the modules load: world-refs.ts binds the world
// functions on import
const copies = vi.hoisted(() => {
  const list: { x: number, y: number }[] = [];
  (globalThis as any).world.copyRegionWithSignals =
    (_x0: number, _y0: number, _x1: number, _y1: number, dx: number, dy: number) => { list.push({ x: dx, y: dy }); };
  return list;
});

const ROW = 5;
const COLUMN = 10;
const FIRST_LINE = ROW * 8;
const ROW_LINES = [0, 1, 2, 3, 4, 5, 6, 7].map(i => FIRST_LINE + i);
const ATTR_ADDR = ATTRIBUTES_MIN_ADDR + ROW * 32 + COLUMN;
const PIXELS_PER_BYTE = 8;
const BYTES_PER_LINE = 32;

/** Address of the byte on line lineInRow of the character cell (ROW, COLUMN); the row lies in the
 *  top third of the screen */
const pixelAddr = (lineInRow: number) => DISPLAY_MIN_ADDR + (lineInRow << 8) + (ROW << 5) + COLUMN;

/** A write that changes the byte: writing the same value does not make it dirty */
const touch = (addr: number) => write(addr, (mem[addr] + 1) & 0x3F);

/** The lines drawn once each, with the number of copies on each */
const drawn = (lines: number[], copiesPerLine = PIXELS_PER_BYTE) => new Map(lines.map(l => [l, copiesPerLine]));

describe('Screen: line-by-line commit', () => {
  (globalThis as any).state = {};
  initState();
  const paletteX = memoryX - 32;
  (globalThis as any).world.setArrow(paletteX + 15, memoryY, 1, 0, false); // Palette exists
  (globalThis as any).world.setArrow(paletteX + 18, memoryY + 1, 1, 0, false); // Selector exists
  initMemory();
  initScreen();

  const displayX = cpuX + 80;
  const displayY = cpuY - 400;

  /** A frame: the lines are committed in order; writes[line] runs before the commit of that line */
  function frame(writes: Record<number, () => void> = {}) {
    for (let line = 0; line < DISPLAY_LINE_COUNT; line++) {
      writes[line]?.();
      commitDisplayLine(line);
    }
  }

  /** Copies per display line since the previous call; the border does not count */
  function linesDrawn(): Map<number, number> {
    const result = new Map<number, number>();

    for (const { x, y } of copies) {
      if (x < displayX || x >= displayX + 512 || y < displayY || y >= displayY + 384) continue;
      const line = (y - displayY) >> 1;
      result.set(line, (result.get(line) ?? 0) + 1);
    }

    copies.length = 0;
    return result;
  }

  it('refreshScreen draws every line once', () => {
    refreshScreen();
    const all = [...Array(DISPLAY_LINE_COUNT).keys()];
    expect(linesDrawn()).toEqual(drawn(all, BYTES_PER_LINE * PIXELS_PER_BYTE));
    frame();
    expect(linesDrawn().size).toBe(0);
  });

  it('a pixel byte is drawn on its own line only', () => {
    frame({ 0: () => touch(pixelAddr(2)) });
    expect(linesDrawn()).toEqual(drawn([FIRST_LINE + 2]));
    frame();
    expect(linesDrawn().size).toBe(0);
  });

  it('an attribute changed before its row is drawn on all eight lines and is clean afterwards', () => {
    frame({ 0: () => touch(ATTR_ADDR) });
    expect(linesDrawn()).toEqual(drawn(ROW_LINES));
    frame();
    expect(linesDrawn().size).toBe(0);
  });

  it('an attribute changed during its row finishes the row now and redraws the whole row next frame', () => {
    frame({ [FIRST_LINE + 4]: () => touch(ATTR_ADDR) });
    expect(linesDrawn()).toEqual(drawn(ROW_LINES.slice(4)));
    frame();
    expect(linesDrawn()).toEqual(drawn(ROW_LINES));
    frame();
    expect(linesDrawn().size).toBe(0);
  });

  it('an attribute changed during its row every frame stays dirty', () => {
    const writes = { [FIRST_LINE + 4]: () => touch(ATTR_ADDR) };
    frame(writes);
    expect(linesDrawn()).toEqual(drawn(ROW_LINES.slice(4)));
    frame(writes);
    expect(linesDrawn()).toEqual(drawn(ROW_LINES));
    frame();
    expect(linesDrawn()).toEqual(drawn(ROW_LINES));
    frame();
    expect(linesDrawn().size).toBe(0);
  });

  it('a flash phase change redraws flashing attributes on all eight lines', () => {
    write(ATTR_ADDR, BIT7);
    frame();
    expect(linesDrawn()).toEqual(drawn(ROW_LINES));

    for (let i = 0; i < 16; i++) incFrameCount(); // The flash phase changes once every 16 frames
    frame();
    expect(linesDrawn()).toEqual(drawn(ROW_LINES));

    incFrameCount();
    frame();
    expect(linesDrawn().size).toBe(0);
  });
});
