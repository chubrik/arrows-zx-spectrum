import { unicodeToBytes } from './common/utils';
import { draw } from './memory/draw';

onActive(() => {
  const rom = unicodeToBytes(''); // Replaced during build
  draw(rom);
});
