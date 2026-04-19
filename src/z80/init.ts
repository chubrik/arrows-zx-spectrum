import { xFF } from '../common/constants';
import { cpuX, cpuY } from '../common/state';
import { commitValue, fetchValue, getValuesCacheX, initValues } from '../common/values';
import { getF, getSYS, setF, setSYS } from './flags';
import {
  a, aa, b, ba, c, ca, d, da, e, ea, fa, getR, hla, hlxy, i, ix, iy, pc, setA, setAa, setB, setBa,
  setC, setCa, setD, setDa, setE, setEa, setFa, setHLa, setHLXY, setI, setIX, setIY, setPC, setR,
  setSP, sp
} from './registers';

let inited: boolean;
let regXs: number[];
let regYs: number[];
const cacheXs: number[] = [];

export function initCpu() {
  if (inited) return;
  inited = true;

  initValues();

  //       A  F  B  C  D  E  H  L  [IX]  [SP]  [PC]      Aa Fa Ba Ca Da Ea Ha La [IY]  I  R SYS
  regXs = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,/**/ 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8];
  regYs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 14];

  regXs.forEach((_, i) => {
    regXs[i] += cpuX;
    regYs[i] += cpuY;
    cacheXs[i] = getValuesCacheX(regXs[i], regYs[i]);
  });
}

export function fetchCpu() {
  let i = 0;
  loadCpu(() => fetchValue(regXs[i], regYs[i++]));
}

export function commitCpu() {
  let i = 0;
  saveCpu(value => {
    commitValue(regXs[i], regYs[i], cacheXs[i], value);
    i++;
  });
}

export function clearCpu() {
  const values: number[] = [];
  values.length = 27;
  values.fill(0);
  restoreCpu(values);
}

export function resetCpu() {
  initCpu();
  fetchCpu();
  setPC(0);
  setI(0);
  setR(0);
  setSYS(0);
  commitCpu();
}

export function restoreCpu(values: number[]) {
  initCpu();
  let i = 0;

  loadCpu(() => {
    const value = values[i];
    commitValue(regXs[i], regYs[i], cacheXs[i], value);
    i++;
    return value;
  });
}

function loadCpu(load: () => number) {
  setA(load()); setF(load());
  setB(load()); setC(load());
  setD(load()); setE(load());
  setHLXY((load() << 8) | load());
  setIX((load() << 8) | load());
  setSP((load() << 8) | load());
  setPC((load() << 8) | load());

  setAa(load()); setFa(load());
  setBa(load()); setCa(load());
  setDa(load()); setEa(load());
  setHLa((load() << 8) | load());
  setIY((load() << 8) | load());
  setI(load()); setR(load());
  setSYS(load());
}

function saveCpu(save: (value: number) => void) {
  save(a); save(getF());
  save(b); save(c);
  save(d); save(e);
  save(hlxy >> 8); save(hlxy & xFF);
  save(ix >> 8); save(ix & xFF);
  save(sp >> 8); save(sp & xFF);
  save((pc >> 8) & xFF); save(pc & xFF);

  save(aa); save(fa);
  save(ba); save(ca);
  save(da); save(ea);
  save(hla >> 8); save(hla & xFF);
  save(iy >> 8); save(iy & xFF);
  save(i); save(getR());
  save(getSYS());
}
