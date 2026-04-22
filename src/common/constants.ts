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

export const SCREEN_MIN_ADDR = RAM_MIN_ADDR;
export const ATTRIBUTES_MIN_ADDR = 0x5800;
export const ATTRIBUTES_AFTER_ADDR = 0x5B00;

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
export const TSTATES_PER_FRAME = 69888; // ≈50.08 Hz (at 3.5 MHz CPU)

export const TSTATES_PER_DISPLAY_BEGIN = 14408;  // (16 + 48) * 224 + 48 + 24
export const TSTATES_PER_DISPLAY_END = 57320;    // (16 + 48 + 192) * 224 - 24
export const TSTATES_PER_DISPLAY_CENTER = 35864; // (BEGIN + END) / 2
