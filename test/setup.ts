import { beforeEach } from 'vitest';

const storage = new Map<string, number>();

(globalThis as any).world = {
  getArrow(x: number, y: number) {
    const key = `${x},${y}`;
    const type = storage.get(key);
    return type !== undefined ? { type, rotation: 1, flip: false } : undefined;
  },
  setArrow(x: number, y: number, arrowType: number, _rotation: number, _flipped: boolean) {
    storage.set(`${x},${y}`, arrowType);
  },
  getSignal() { return 0; },
  setSignal() { },
  removeArrow() { },
  clearSignals() { },
  copy() { },
  copyRegion() { },
};

globalThis.log = () => { };
globalThis.showText = () => { };
globalThis.getPosition = () => ({ x: 0, y: 0 });

beforeEach(() => {
  storage.clear();
});
