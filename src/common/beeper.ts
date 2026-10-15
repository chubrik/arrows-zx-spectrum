import { tStates } from '../cpu/utils';
import { beeperEnabled, cpuX, cpuY } from './state';
import { world_getArrow, world_setArrow, world_setSignal } from './world-refs';

const ARROW_TYPE = 29;
const ARROW_SIGNAL = 6;

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
let noteX: number;
let noiseX: number;
let earNoteY: number;
let earNoteYLast: number;
let earInstrument: number;
let micNoteY: number;
let micInstrument: number;

function initBeeper() {
  if (inited) return;
  inited = true;

  noteX = cpuX + 3;
  noiseX = noteX + 2;
  earNoteY = cpuY - 19;
  earNoteYLast = earNoteY - 2;
  micNoteY = cpuY - 17;
}

export function fetchBeeper() {
  initBeeper();
  earInstrument = (world_getArrow(noteX, earNoteY)?.extra ?? 0) & 0x1F00; // 0 = piano
  micInstrument = (world_getArrow(noteX, micNoteY)?.extra ?? 0) & 0x1F00; // 0 = piano
}

let earValue = 0; // 0 | 16
let earCount = 0;
let earFirstTStates: number;
let earLastTStates: number;
let micValue = 0; // 0 | 8
let micCount = 0;
let micFirstTStates: number;
let micLastTStates: number;

export function setBeeper(ear: number, mic: number) { /*!inline*/ earValue = ear; micValue = mic; }

export function writeBeeper(ear: number, mic: number) {
  if (beeperEnabled) {
    if (earValue !== ear) {
      if (earCount++) earLastTStates = tStates;
      else earFirstTStates = tStates;
    }
    if (micValue !== mic) {
      if (micCount++) micLastTStates = tStates;
      else micFirstTStates = tStates;
    }
  }
  setBeeper(ear, mic);
}

let phase = 0;

export function commitBeeper() {
  phase ^= 1; // Every frame restarts the sound instead of holding it

  if (earCount) {
    const earSpan = earLastTStates - earFirstTStates;
    const earNote = getNote(earCount, earSpan);
    earCount = 0;

    if (earNote < 0) {
      const x = noiseX + phase;
      for (let y = earNoteY; y >= earNoteYLast; y--)
        world_setSignal(x, y, ARROW_SIGNAL);
    }
    else {
      const x = noteX + phase;
      const extra = earInstrument | earNote;
      for (let y = earNoteY; y >= earNoteYLast; y--) {
        world_setArrow(x, y, ARROW_TYPE, 0, false, extra);
        world_setSignal(x, y, ARROW_SIGNAL);
      }
    }
  }

  if (micCount) {
    const micSpan = micLastTStates - micFirstTStates;
    const micNote = getNote(micCount, micSpan);
    micCount = 0;

    if (micNote < 0) {
      const x = noiseX + phase;
      world_setSignal(x, micNoteY, ARROW_SIGNAL);
    }
    else {
      const x = noteX + phase;
      const extra = micInstrument | micNote;
      world_setArrow(x, micNoteY, ARROW_TYPE, 0, false, extra);
      world_setSignal(x, micNoteY, ARROW_SIGNAL);
    }
  }
}

function getNote(count: number, span: number): number {
  if (count < 2) return -1; // A single click is treated as noise

  const steps = count - 1; // Number of half periods: the gaps between the clicks
  let octave = 0;
  let note = 0;

  // The shortest span in T-states that still belongs to octave 0 with this number of half periods
  const min = steps * OCTAVE_ZERO_BOUND;

  // Find the octave
  while (span < min) {
    span <<= 1;
    octave++;
  }

  // Above the available range the sound is played by the noise arrows
  if (octave > OCTAVE_MAX)
    return -1;

  // Find the note
  while (span < steps * octaveZeroNoteBounds[note])
    note++;

  return (octave << 4) | note;
}
