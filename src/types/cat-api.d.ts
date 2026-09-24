// Position is declared in command-block-api.d.ts

/** The cat assistant */
declare const cat: {
  /** Toggle the automatic blinking */
  autoBlink(enabled: boolean): void;

  /** Blink once */
  blink(): void;

  /** Toggle the breathing animation */
  breathe(enabled: boolean): void;

  /** Stop the taps repeated by tap() */
  clearAutoTaps(): void;

  /** Cat coordinates, or null when the cat is not on the map */
  getPosition(): Position | null;

  /** Hide the cat */
  hide(): void;

  /** Look at a target; without a target the cat looks straight ahead */
  look(target?: CatLookTarget): void;

  /** Scroll the map view to the coordinates */
  moveMap(x: number, y: number): void;

  /** Walk to the coordinates */
  moveTo(x: number, y: number): void;

  /** Open the eyes: 0 is closed, 1 is wide open */
  openEyes(openness?: number): void;

  /** Speech bubble; onNext fires when the player presses the next button */
  say(text?: string, onNext?: () => void): void;

  /** Eye expression; the set of states is not documented yet, and "default" is the fallback */
  setEyes(state?: string): void;

  /**
   * Movement speed; the scale is not documented yet.
   * withinReach keeps the cat within the area it can reach.
   */
  setSpeed(level: number, options?: { withinReach?: boolean }): void;

  /** Turn the cat by the angle in degrees */
  setTurn(degrees: number): void;

  /** Show the cat */
  show(): void;

  /** Tap a point of the screen, a cell of the map or a toolbar button */
  tap(target: CatTapTarget): void;

  /** Zoom the map view */
  zoom(scale: number): void;
};

declare type CatLookTarget =
  | { type: 'screen'; x: number; y: number }
  | { type: 'button'; button: 'toolbarSlot'; slot: number }
  | { type: 'button'; button: 'toolbarPage'; direction: 'previous' | 'next' };

declare type CatTapOptions = {
  /** Number of taps, 1 by default */
  taps?: number;

  /** Delay before the taps repeat; without it they happen once */
  repeatInterval?: number;
};

declare type CatTapTarget = CatTapOptions & (
  | { type: 'screen'; x: number; y: number }
  // withinReach works for a cell only
  | { type: 'cell'; x: number; y: number; withinReach?: boolean }
  | { type: 'button'; button: 'toolbarSlot'; slot: number }
  | { type: 'button'; button: 'toolbarPage'; direction: 'previous' | 'next' }
);
