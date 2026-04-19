import { State } from './common/state';
import { unicodeToBytes } from './util/encode';

let cache: number[] | undefined;

onActive(() => {
  (state as State).do = 1;
  let placeholder: number;                     // Replaced during build (optional)
  state.NAME = (cache ??= unicodeToBytes('')); // NAME and '' replaced during build
});
