// Test hook: in test build (TEST=true) exposes CPU internals via globalThis.__z80
// so test/fuse-dist.test.ts can drive the fully-compiled bundle. In prod build
// (TEST=false) the entire `if (TEST)` block is dead-code-eliminated by terser
// and unused imports are tree-shaken away.
//
// Inlined setters/functions are wrapped in arrows so the inliner expands the
// call inside the arrow body, but the arrow itself survives. Without this, the
// shorthand `setHLT` would be a dangling reference after inlineFunctions removes
// the declaration.

import { mem, setRamMinAddrForTest } from './common/memory';
import { mockPorts } from './common/ports';
import { executeMain } from './z80/execute-main';
import { initOpsMisc } from './z80/execute-misc';
import { getF, HLT, hlt, IFF1, iff1, IFF2, iff2, IM1, im1, IM2, im2, setF, setHLT, setIFF1, setIFF2, setIM1, setIM2 } from './z80/flags';
import { clearCpu } from './z80/init';
import {
  a, aa, b, ba, c, ca, d, da, e, ea, fa, getR, hla, hlxy, i, ix, iy, pc, setA, setAa, setB, setBa,
  setC, setCa, setD, setDa, setE, setEa, setFa, setHLa, setHLXY, setI, setIX, setIY, setPC, setR,
  setSP, setWZ, sp
} from './z80/registers';
import { setTStates, tStates } from './z80/utils';

if (TEST) {
  initOpsMisc();

  (globalThis as Record<string, unknown>).__z80 = {
    mem, mockPorts,
    getF: () => getF(),
    getR: () => getR(),
    HLT, IFF1, IFF2, IM1, IM2,
    setRamMinAddrForTest: (v: number) => setRamMinAddrForTest(v),
    executeMain: () => executeMain(),
    clearCpu: () => clearCpu(),

    setF: (v: number) => setF(v),
    setHLT: (v: number) => setHLT(v),
    setIFF1: (v: number) => setIFF1(v),
    setIFF2: (v: number) => setIFF2(v),
    setIM1: (v: number) => setIM1(v),
    setIM2: (v: number) => setIM2(v),
    setA: (v: number) => setA(v),
    setAa: (v: number) => setAa(v),
    setB: (v: number) => setB(v),
    setBa: (v: number) => setBa(v),
    setC: (v: number) => setC(v),
    setCa: (v: number) => setCa(v),
    setD: (v: number) => setD(v),
    setDa: (v: number) => setDa(v),
    setE: (v: number) => setE(v),
    setEa: (v: number) => setEa(v),
    setFa: (v: number) => setFa(v),
    setHLa: (v: number) => setHLa(v),
    setHLXY: (v: number) => setHLXY(v),
    setI: (v: number) => setI(v),
    setIX: (v: number) => setIX(v),
    setIY: (v: number) => setIY(v),
    setPC: (v: number) => setPC(v),
    setR: (v: number) => setR(v),
    setSP: (v: number) => setSP(v),
    setWZ: (v: number) => setWZ(v),
    setTStates: (v: number) => setTStates(v),

    get hlt() { return hlt; },
    get iff1() { return iff1; },
    get iff2() { return iff2; },
    get im1() { return im1; },
    get im2() { return im2; },
    get a() { return a; },
    get aa() { return aa; },
    get b() { return b; },
    get ba() { return ba; },
    get c() { return c; },
    get ca() { return ca; },
    get d() { return d; },
    get da() { return da; },
    get e() { return e; },
    get ea() { return ea; },
    get fa() { return fa; },
    get hla() { return hla; },
    get hlxy() { return hlxy; },
    get i() { return i; },
    get ix() { return ix; },
    get iy() { return iy; },
    get pc() { return pc; },
    get sp() { return sp; },
    get tStates() { return tStates; },
  };
}
