import { getResource } from '../build/resources';
import { mem } from '../src/hw/mem-state';
import { mockPorts } from '../src/hw/ports';
import { runFuseSuite } from './fuse-runner';
import { getState, loadProgram, setState, setupCpu, step } from './helpers';

const inputText = await getResource('fuse-tests.in', 'utf-8');
const expectedText = await getResource('fuse-tests.expected', 'utf-8');

runFuseSuite('FUSE Z80 tests (source)', {
  setupCpu, setState, getState, loadProgram, step, mem, mockPorts,
}, inputText, expectedText);
