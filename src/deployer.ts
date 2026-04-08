import { _state } from './hw/state';
import { unicodeToBytes } from './util/encode';

let rom: number[] | undefined;

onActive(() => {
  _state.todo = 1;
  _state.rom = (rom ??= unicodeToBytes('')); // Replaced during build
});
