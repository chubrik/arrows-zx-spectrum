// Fires when the command block is activated
declare function onActive(callback: () => void): void;

// Fires on every tick, even if the command block is not activated
declare function always(callback: () => void): void;

// Command block coordinates
declare function getPosition(): Position;

// Print log
declare function log(...values: string[]): void;

// Display text on screen
declare function showText(text: string): void;

declare const world: {
  // Read an arrow
  getArrow(x: number, y: number): Arrow | undefined;

  // Set an arrow
  setArrow(x: number, y: number, arrowType: number, rotation: number, flipped: boolean): void;

  // Read a signal
  getSignal(x: number, y: number): number;

  // Set a signal
  setSignal(x: number, y: number, signal: number): void;

  // Remove an arrow
  removeArrow(x: number, y: number): void;

  // Clear all signals
  clearSignals(): void;

  // Copy an arrow from coordinates (xSrc, ySrc) to coordinates (xDst, yDst)
  copy(xSrc: number, ySrc: number, xDst: number, yDst: number): void;

  // Copy a region of arrows from coordinates (xSrc0, ySrc0) - (xSrc1, ySrc1) to coordinates (xDst, yDst)
  copyRegion(xSrc0: number, ySrc0: number, xSrc1: number, ySrc1: number, xDst: number, yDst: number): void;
};

declare type Arrow = {
  type: number;
  rotation: number;
  flip: boolean;
};

declare type Position = {
  x: number;
  y: number;
};
