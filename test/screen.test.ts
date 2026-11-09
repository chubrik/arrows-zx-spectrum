import { describe, expect, it, vi } from 'vitest';
import {
  ATTRIBUTES_MIN_ADDR, BIT7, BORDER_LINE_COUNT, BORDER_WIDTH, DISPLAY_HEIGHT, DISPLAY_LINE_COUNT,
  DISPLAY_MIN_ADDR, DISPLAY_WIDTH, PIXEL, SCREEN_WIDTH, TOP_BORDER_LINE_COUNT
} from '../src/common/constants';
import { initMemory, mem, write } from '../src/common/memory';
import {
  commitBorder, commitBorderLine, commitDisplayLine, incFrameCount, initScreen, refreshScreen,
  setBorder
} from '../src/common/screen';
import { cpuX, cpuY, initState } from '../src/common/state';

// Line-by-line commit of the screen.ts module with the world mock of setup.ts. Checks which lines
// get redrawn after a byte, an attribute or the border color is written, and in which frame: an
// attribute changed before its row is drawn on all eight lines at once, one changed during the row
// is drawn on the remaining lines now and on the whole row in the next frame; a border color
// changed in the middle of a frame lands on the lines below now and on the lines above next frame.
//
// The lines are numbered here in the order the beam commits them, the beam lines: the top border
// lines, the display lines, the bottom border lines. screen.ts itself numbers the display lines
// and the border lines apart.

// The copy interceptor is installed before the modules load: world-refs.ts binds the world
// functions on import
const copies = vi.hoisted(() => {
  const list: { x: number, y: number, w: number }[] = [];
  (globalThis as any).world.copyRegionWithSignals =
    (x0: number, _y0: number, x1: number, _y1: number, dx: number, dy: number) => {
      list.push({ x: dx, y: dy, w: x1 - x0 + 1 });
    };
  return list;
});

const ROW = 5;
const COLUMN = 10;
const FIRST_LINE = ROW * 8;
const ROW_LINES = [0, 1, 2, 3, 4, 5, 6, 7].map(i => FIRST_LINE + i);
const ATTR_ADDR = ATTRIBUTES_MIN_ADDR + ROW * 32 + COLUMN;
const COPIES_PER_BYTE = 1; // A byte is one copy of its window from the GFX cache
const BYTES_PER_LINE = 32;

// The corners of screen.ts: the outermost lines are cut by these pixels from each end
const CORNER_SKIPS = [10, 7, 5, 4, 3, 2, 2, 1, 1, 1];
const BEAM_LINE_COUNT = BORDER_LINE_COUNT + DISPLAY_LINE_COUNT;
const ALL_BEAM_LINES = [...Array(BEAM_LINE_COUNT).keys()];

/** Address of the byte on line lineInRow of the character cell (ROW, COLUMN); the row lies in the
 *  top third of the screen */
const pixelAddr = (lineInRow: number) => DISPLAY_MIN_ADDR + (lineInRow << 8) + (ROW << 5) + COLUMN;

/** A write that changes the byte: writing the same value does not make it dirty */
const touch = (addr: number) => write(addr, (mem[addr] + 1) & 0x3F);

/** The beam line of a display line */
const beamLine = (displayLine: number) => TOP_BORDER_LINE_COUNT + displayLine;

/** The lines drawn once each, with the number of copies on each */
const drawn = (lines: number[], copiesPerLine = COPIES_PER_BYTE) => new Map(lines.map(l => [l, copiesPerLine]));

/** Border cells of a beam line */
function borderCells(line: number): number {
  const displayLine = line - TOP_BORDER_LINE_COUNT;
  if (displayLine >= 0 && displayLine < DISPLAY_LINE_COUNT) return BORDER_WIDTH * 2;
  const edge = line < TOP_BORDER_LINE_COUNT ? line : BEAM_LINE_COUNT - 1 - line;
  return SCREEN_WIDTH - (CORNER_SKIPS[edge] ?? 0) * PIXEL * 2;
}

/** The border of the given beam lines, drawn once: the cells copied on each */
const borderDrawnOn = (lines: number[]) => new Map(lines.map(l => [l, borderCells(l)]));

describe('Screen: line-by-line commit', () => {
  // The GFX tables the display is drawn from: a stand-in of the right shape, only the copies are
  // counted here
  const zeros = () => Array<number>(256).fill(0);
  (globalThis as any).globalState = {
    gfx: { attrYs: zeros(), valueXs: [zeros(), zeros(), zeros(), zeros()], attrKinds: zeros(), attrKindsFlash: zeros() },
  };
  initState();
  initMemory();
  initScreen();

  const displayX = cpuX + 80;
  const displayY = cpuY - 400;
  const screenX = displayX - BORDER_WIDTH;
  const screenY = displayY - TOP_BORDER_LINE_COUNT * PIXEL;

  /** A frame, the three phases of the frame loop of cpu.ts: the lines are committed in the beam
   *  order, writes[beamLine] runs before the commit of that line */
  function frame(writes: Record<number, () => void> = {}) {
    for (let line = 0; line < TOP_BORDER_LINE_COUNT; line++) {
      writes[line]?.();
      commitBorderLine(line);
    }

    for (let line = 0; line < DISPLAY_LINE_COUNT; line++) {
      writes[TOP_BORDER_LINE_COUNT + line]?.();
      commitDisplayLine(line);
    }

    for (let line = TOP_BORDER_LINE_COUNT; line < BORDER_LINE_COUNT; line++) {
      writes[DISPLAY_LINE_COUNT + line]?.();
      commitBorderLine(line);
    }
  }

  /** Copies since the previous call: per display line inside the display, cells per beam line
   *  in the border, plus the number of border copies. A copy outside the screen is an error */
  function takeCopies() {
    const display = new Map<number, number>();
    const border = new Map<number, number>();
    let borderCopies = 0;

    for (const { x, y, w } of copies) {
      const inScreen = x >= screenX && x < screenX + SCREEN_WIDTH
        && y >= screenY && y < screenY + BEAM_LINE_COUNT * PIXEL;
      if (!inScreen) throw new Error(`Copy outside the screen: ${x}, ${y}`);

      const inDisplay = x >= displayX && x < displayX + DISPLAY_WIDTH
        && y >= displayY && y < displayY + DISPLAY_HEIGHT;

      if (inDisplay) {
        const line = (y - displayY) / PIXEL;
        display.set(line, (display.get(line) ?? 0) + 1);
      } else {
        const line = (y - screenY) / PIXEL;
        border.set(line, (border.get(line) ?? 0) + w);
        borderCopies++;
      }
    }

    copies.length = 0;
    return { display, border, borderCopies };
  }

  const linesDrawn = () => takeCopies().display;
  const borderDrawn = () => takeCopies().border;

  it('refreshScreen draws every display line once', () => {
    refreshScreen();
    const all = [...Array(DISPLAY_LINE_COUNT).keys()];
    expect(linesDrawn()).toEqual(drawn(all, BYTES_PER_LINE * COPIES_PER_BYTE));
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
    frame({ [beamLine(FIRST_LINE + 4)]: () => touch(ATTR_ADDR) });
    expect(linesDrawn()).toEqual(drawn(ROW_LINES.slice(4)));
    frame();
    expect(linesDrawn()).toEqual(drawn(ROW_LINES));
    frame();
    expect(linesDrawn().size).toBe(0);
  });

  it('an attribute changed during its row every frame stays dirty', () => {
    const writes = { [beamLine(FIRST_LINE + 4)]: () => touch(ATTR_ADDR) };
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

  it('refreshScreen draws the border of every beam line once, a copy per run', () => {
    refreshScreen();
    const { border, borderCopies } = takeCopies();
    expect(border).toEqual(borderDrawnOn(ALL_BEAM_LINES));
    expect(borderCopies).toBe(BORDER_LINE_COUNT + DISPLAY_LINE_COUNT * 2);
    frame();
    expect(borderDrawn().size).toBe(0);
  });

  it('a border color changed in the middle of a frame recolors the lines below now and the lines above next frame', () => {
    const SPLIT = 100;
    frame({ [SPLIT]: () => setBorder(2) });
    expect(borderDrawn()).toEqual(borderDrawnOn(ALL_BEAM_LINES.slice(SPLIT)));
    frame();
    expect(borderDrawn()).toEqual(borderDrawnOn(ALL_BEAM_LINES.slice(0, SPLIT)));
    frame();
    expect(borderDrawn().size).toBe(0);
  });

  it('a border split repeated every frame costs nothing after the first frame', () => {
    const writes = { 0: () => setBorder(3), 120: () => setBorder(4) };
    frame(writes);
    expect(borderDrawn()).toEqual(borderDrawnOn(ALL_BEAM_LINES));
    frame(writes);
    expect(borderDrawn().size).toBe(0);
  });

  it('commitBorder redraws every line in a new color and nothing in the same one', () => {
    setBorder(5);
    commitBorder();
    expect(borderDrawn()).toEqual(borderDrawnOn(ALL_BEAM_LINES));
    commitBorder();
    expect(borderDrawn().size).toBe(0);
  });
});
