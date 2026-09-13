import { beforeEach } from 'vitest';

// Minimal mock of the command block API (see src/types/command-block-api.d.ts)

const storage = new Map<string, number>();

(globalThis as any).world = {
  clearSignals() { },
  copy() { },
  copyRegion() { },
  copyRegionWithSignals() { },
  getArrow(x: number, y: number) {
    const key = `${x},${y}`;
    const type = storage.get(key);
    return type !== undefined ? { type, rotation: 1, flip: false } : undefined;
  },
  getChunks() { return []; },
  getSignal() { return 0; },
  removeArrow() { },
  setArrow(x: number, y: number, arrowType: number, _rotation: number, _flipped: boolean) {
    storage.set(`${x},${y}`, arrowType);
  },
  setCommandBlockCode() { },
  setSignal() { },
};

globalThis.always = () => { };
globalThis.getPosition = () => ({ x: 0, y: 0 });
globalThis.getTick = () => 0;
globalThis.log = () => { };
globalThis.onActive = () => { };
globalThis.showText = () => { };

beforeEach(() => {
  storage.clear();
});
