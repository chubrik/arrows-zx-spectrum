export const BIT7 = 0x80;
export const BIT6 = 0x40;
export const BIT5 = 0x20;
export const BIT4 = 0x10;
export const BIT3 = 0x08;
export const BIT2 = 0x04;
export const BIT1 = 0x02;
export const BIT0 = 0x01;

export const xFF = 0xFF;
export const xFFFF = 0xFFFF;

export const RAM_MIN_ADDR = 0x4000;

export const DISPLAY_MIN_ADDR = RAM_MIN_ADDR;
export const ATTRIBUTES_MIN_ADDR = 0x5800;
export const ATTRIBUTES_AFTER_ADDR = 0x5B00;
export const DISPLAY_LINE_COUNT = 192;
export const TOP_BORDER_LINE_COUNT = 14;
export const BORDER_LINE_COUNT = TOP_BORDER_LINE_COUNT * 2;

// The screen on the map, in cells: a Spectrum pixel is a PIXEL × PIXEL square of cells
export const PIXEL = 2;
export const DISPLAY_WIDTH = 256 * PIXEL;
export const DISPLAY_HEIGHT = DISPLAY_LINE_COUNT * PIXEL;
export const BORDER_WIDTH = 16 * PIXEL; // The border shown at each side of the display
export const SCREEN_WIDTH = DISPLAY_WIDTH + BORDER_WIDTH * 2;

export const MS_PER_FRAME = 20; // 50 fps

// 312 scan lines per frame:
// - Interrupt start (/INT held for 32 T-states)
// - 16 lines — vertical blanking (VSYNC + beam retrace to top)
// - 48 lines — top border
// - 192 lines — display area (pixel area)
// - 56 lines — bottom border
// Each line is 224 T-states:
// - 48 T-states — horizontal blanking (HSYNC + beam retrace to left)
// - 24 T-states — left border
// - 128 T-states — pixel area (256 pixels)
// - 24 T-states — right border
export const TSTATES_PER_FRAME = 69888_0; // ≈50.08 Hz (at 3.5 MHz CPU)

// An op costs a fractional number of T-states, so every T-state count is kept in tenths: an
// integer counter stays on the QuickJS int fast path. The trailing _0 marks the fraction.
export const TSTATES_PER_OP = 7_3; //todo: Real T-state counting

export const TSTATES_PER_LINE = 224_0; // Any scan line: display, border or blanking
export const TSTATES_AT_DISPLAY_FIRST_LINE_MIDDLE = 14472_0; // (16 + 48) * 224 + 48 + 24 + 128 / 2

// export const TSTATES_AT_DISPLAY_BEGIN = 14408_0;  // (16 + 48) * 224 + 48 + 24
// export const TSTATES_AT_DISPLAY_END = 57320_0;    // (16 + 48 + 192) * 224 - 24
// export const TSTATES_AT_DISPLAY_MIDDLE = 35864_0; // (BEGIN + END) * 0.5
