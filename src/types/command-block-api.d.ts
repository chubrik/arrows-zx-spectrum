/**
 * Fires on every tick, even if the command block is not activated.
 * Only one callback is kept: a second call replaces the previous one.
 */
declare function always(callback: (event: BlockEvent) => void): void;

/** Game settings */
declare const game: {
  /**
   * Switch the map into the key mode: an arrow that is sensitive to a key gets activated while the
   * player holds that key, so a block can read the keyboard through world.getSignal()
   */
  setKeyMode(active: boolean): void;

  /**
   * Set the tick rate, by the positions of the speed control of the game:
   * 0 = paused, 1 = 3 ticks per second, 2 = 12, 3 = 60, 4 = 300, 5 = 1200, 6 = unlimited
   */
  setSpeed(level: number): void;
};

/**
 * Command block coordinates. A placed block always has them, even before the first tick;
 * null is only a fallback of the runtime.
 */
declare function getPosition(): Position | null;

/** Current tick count: 0 while the block code is loading, 1 inside the first always() call */
declare function getTick(): number | null;

/** Load a localized text; an unknown key comes back unchanged */
declare function loadText(key?: string): string;

/**
 * State of this command block alone; other blocks do not see it, and it lives in memory only,
 * so it is gone after a level reload.
 * It is a proxy over JSON: reading a property parses the stored string, writing serializes
 * the value. Therefore:
 * - a typed array arrives as a plain object, a Date as a string, NaN as null, and a function
 *   or a BigInt as undefined;
 * - changing a value in place does nothing, only an assignment stores it;
 * - every read parses the string again: reading an array of 16K numbers takes about 1 ms and
 *   writing it about 5 ms, so keep the value in a variable instead of reading it twice.
 */
declare const localState: Record<string, any>;

/**
 * Print log; the values are serialized with JSON.stringify and joined with spaces.
 * A value that cannot be serialized is printed as "[unserializable]".
 */
declare function log(...values: any[]): void;

/**
 * Fires when the command block is activated.
 * Only one callback is kept: a second call replaces the previous one.
 */
declare function onActive(callback: (event: BlockEvent) => void): void;

/** Fires when the player edits the map */
declare function onPlayerMapAction(callback: (event: PlayerMapActionEvent) => void): void;

/**
 * Fires while the player moves the pointer; x and y are fractions of the screen (0 to 1),
 * and several events may arrive within one tick
 */
declare function onPlayerMouseMove(callback: (x: number, y: number) => void): void;

/** Fires when the player uses a tool */
declare function onPlayerToolAction(callback: (event: ToolActionEvent) => void): void;

/** Display text on screen; onNext fires when the player presses the next button */
declare function showText(text?: string, onNext?: () => void): void;

/**
 * Shared state between command blocks; it lives in memory only and is gone after a level reload.
 * It is a proxy over JSON: reading a property parses the stored string, writing serializes
 * the value. Therefore:
 * - a typed array arrives as a plain object, a Date as a string, NaN as null, and a function
 *   or a BigInt as undefined;
 * - changing a value in place does nothing, only an assignment stores it;
 * - every read parses the string again: reading an array of 16K numbers takes about 1 ms and
 *   writing it about 5 ms, so keep the value in a variable instead of reading it twice.
 */
declare const state: Record<string, any>;

declare const world: {
  /** Clear all signals */
  clearSignals(): void;

  /** Copy an arrow from coordinates (xSrc, ySrc) to coordinates (xDst, yDst) */
  copy(xSrc: number, ySrc: number, xDst: number, yDst: number): void;

  /**
   * Copy a region of arrows from coordinates (xSrc0, ySrc0) - (xSrc1, ySrc1) to coordinates
   * (xDst, yDst)
   */
  copyRegion(
    xSrc0: number, ySrc0: number, xSrc1: number, ySrc1: number, xDst: number, yDst: number): void;

  /**
   * Copy a region of arrows with signals from coordinates (xSrc0, ySrc0) - (xSrc1, ySrc1)
   * to coordinates (xDst, yDst)
   */
  copyRegionWithSignals(
    xSrc0: number, ySrc0: number, xSrc1: number, ySrc1: number, xDst: number, yDst: number): void;

  /** Read an arrow */
  getArrow(x: number, y: number): Arrow | null;

  /** All existing chunks */
  getChunks(): Position[];

  /**
   * Command block coordinates. A placed block always has them, even before the first tick;
   * null is only a fallback of the runtime.
   */
  getPosition(): Position | null;

  /**
   * Read a signal: 0 none, 1 red, 2 blue, 3 yellow, 4 green, 5 orange, 6 purple.
   * Arrow.extra stores colors with the same numbering, plus 7 for the black of a wall.
   */
  getSignal(x: number, y: number): number | null;

  /** Current tick count: 0 while the block code is loading, 1 inside the first always() call */
  getTick(): number | null;

  /** Remove an arrow */
  removeArrow(x: number, y: number): void;

  /** Set an arrow */
  setArrow(
    x: number, y: number, arrowType: number, rotation?: number, flip?: boolean, extra?: number)
    : void;

  /** Set the code of a command block */
  setCommandBlockCode(x: number, y: number, code: string): void;

  /** Set a signal: 0 none, 1 red, 2 blue, 3 yellow, 4 green, 5 orange, 6 purple */
  setSignal(x: number, y: number, signal: number): void;
};

declare type Arrow = {
  type: number;
  rotation: number;
  flip: boolean;

  /**
   * The signal on the arrow, the same value getSignal(x, y) returns: 0 none, 1 red, 2 blue,
   * 3 yellow, 4 green, 5 orange, 6 purple
   */
  signal: number;

  /**
   * ```
   * Light:          000bcccc (brightness, color)
   * Music: 000iiiii oooonnnn (instrument, octave, note)
   * Wall:  000000ll llllcccc (letter, color)
   * ```
   * The color c: 0 none, 1 red, 2 blue, 3 yellow, 4 green, 5 orange, 6 purple,
   * and 7 black for a wall
   */
  extra: number;
};

/** The object passed to always() and onActive(); x and y are the coordinates of the block itself */
declare type BlockEvent = {
  type: 'always' | 'commandBlockActive' | 'playerMapAction';
  tick: number;
  x: number;
  y: number;
};

/** An arrow of a tool action: the fields of Arrow except the signal, plus its coordinates */
declare type PlacedArrow = Position & {
  type: number;
  rotation: number;
  flip: boolean;

  /**
   * ```
   * Light:          000bcccc (brightness, color)
   * Music: 000iiiii oooonnnn (instrument, octave, note)
   * Wall:  000000ll llllcccc (letter, color)
   * ```
   * The color c: 0 none, 1 red, 2 blue, 3 yellow, 4 green, 5 orange, 6 purple,
   * and 7 black for a wall
   */
  extra: number;
};

/** The player edited the map */
declare type PlayerMapActionEvent = BlockEvent & {
  /**
   * How many arrows are selected at that moment: 0 once the selection is cleared,
   * and the whole amount when it is extended with Shift
   */
  count: number;
};

declare type Position = {
  x: number;
  y: number;
};

/**
 * The player used a tool. Known actions: 'selectArrow' with the toolbar id of the arrow,
 * 'placeArrows' with the arrows that were put on the map, 'selectionFinalized' with the arrows
 * inside the rectangle the player has dragged (the empty cells of it are not reported, and neither
 * are the bounds of the rectangle itself); the full list is not documented yet.
 */
declare type ToolActionEvent = {
  action: string;
  id?: number;
  arrows?: PlacedArrow[];
  positions?: Position[];
};
