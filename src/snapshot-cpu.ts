import { _state } from './hw/state';

onActive(() => {
  _state.todo = 1;
  _state.cpu = []; // Array filled during build
});
