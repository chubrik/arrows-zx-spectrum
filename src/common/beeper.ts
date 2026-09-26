import { tStates } from '../z80/utils';
import { beeperEnabled, cpuX, cpuY } from './state';
import { world_getArrow, world_setArrow, world_setSignal } from './world-refs';

const INSTRUMENT_MASK = 0x1F00;
const ARROW_TYPE = 29;
const ARROW_SIGNAL = 6;

// A single click repeated every frame gives 25 Hz, which is close to G of octave 0
// (the sub-contra octave) at 24.5 Hz
const OCTAVE_MIN = 0;
const NOTE_MIN = 7;

// The highest octave the music arrows can play. Anything above it is treated as noise.
const OCTAVE_MAX = 7;

// Octave 0 (the sub-contra octave). For every note this is the shortest half period in T-states
// that still counts as that note, which is the boundary with the note above.
//
//  T/sec   note A  half period  up 1/4 tone
// 3500000 / 27.5 /     2      /  2^(1/24)   ≈ 61825 T at the boundary between A and A#
//
//   C      C#      D     D#      E      F     F#      G     G#      A     A#      B
const octaveZeroNoteBounds =
  [103976, 98141, 92632, 87433, 82526, 77894, 73522, 69396, 65501, 61825, 58355, 55080];

// Equals the last element of octaveZeroNoteBounds and marks the boundary between octaves 0 and 1
const OCTAVE_ZERO_BOUND = 55080;

let inited: boolean;
let noteX0: number;
let noteX1: number;
let noteY: number;
let noiseY: number;
let instrument: number;

export function initBeeper() {
  if (inited) return;
  inited = true;

  noteX0 = cpuX;
  noteX1 = noteX0 + 1;
  noteY = cpuY - 17;
  noiseY = noteY - 1;
}

export function fetchBeeper() {
  instrument = (world_getArrow(noteX0, noteY)?.extra ?? 0) & INSTRUMENT_MASK; // 0 = piano
}

let beeperCount = 0;
let beeperBit: number; // 0 | 16
let firstTStates: number;
let lastTStates: number;

export function setBeeper(bit: number) {
  if (!beeperEnabled) return;

  if (beeperBit !== bit) {
    beeperBit = bit;
    if (beeperCount++) lastTStates = tStates;
    else firstTStates = tStates;
  }
}

let phase = false;

export function commitBeeper() {
  if (!beeperCount) return;
  const steps = beeperCount - 1; // Number of half periods: the gaps between the clicks
  beeperCount = 0;

  // Two identical arrows alternate so that every frame restarts the sound instead of holding it
  const x = phase ? noteX1 : noteX0;
  phase = !phase;

  let octave = OCTAVE_MIN;
  let note = 0;

  if (steps) {
    // The measured span in T-states between the first and the last click within one frame
    let span = lastTStates - firstTStates;

    // The shortest span in T-states that still belongs to octave 0 with this number of half periods
    const min = steps * OCTAVE_ZERO_BOUND;

    // Find the octave
    while (span < min) { span <<= 1; octave++; }

    // Above the available range the sound is played by the noise arrows
    if (octave > OCTAVE_MAX) {
      world_setSignal(x, noiseY, ARROW_SIGNAL);
      return;
    }

    // Find the note
    while (span < steps * octaveZeroNoteBounds[note]) note++;
  }
  else {
    // A single click
    note = NOTE_MIN;
  }

  world_setArrow(x, noteY, ARROW_TYPE, 0, false, instrument | (octave << 4) | note);
  world_setSignal(x, noteY, ARROW_SIGNAL);
}
