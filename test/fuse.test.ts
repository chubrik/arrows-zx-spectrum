import { getResource } from '../build/resources';
import { mem } from '../src/common/memory';
import { mockPorts } from '../src/common/ports';
import { initOpsMisc } from '../src/z80/execute-misc';
import { setTStates, tStates } from '../src/z80/utils';
import { runFuseSuite } from './fuse-runner';
import { getState, loadProgram, setState, setupCpu, step } from './helpers';

const inputText = await getResource('fuse-tests.in', 'utf-8');
const expectedText = await getResource('fuse-tests.expected', 'utf-8');
initOpsMisc();

runFuseSuite('FUSE Z80 tests (source)', {
  setupCpu, setState, getState, loadProgram, step,
  setTStates, getTStates: () => tStates,
  mem, mockPorts,
}, inputText, expectedText);
