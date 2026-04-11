import { getArrowTypes, getDirect, setDirect } from '../hw/arrows';
import { xFF } from '../hw/constants';
import { cpuX, cpuY } from '../hw/state';
import { getF, getSYS, setF, setSYS } from './flags';
import {
  a, aa, b, ba, c, ca, d, da, e, ea, fa, getH, getHa, getIXh, getIXl, getIYh, getIYl, getL, getLa, getR, i,
  pc, setA, setAa, setB, setBa, setC, setCa, setD, setDa, setE, setEa, setFa, setH, setHa, setI,
  setIXh, setIXl, setIYh, setIYl, setL, setLa, setPC, setR, setSP, sp
} from './registers';

let inited = false;
let cacheX: number[];
let cacheY: number[];
const cacheA: number[][] = [];

export function initCpu() {
  if (inited) return;
  inited = true;

  const x0_ = cpuX;
  const x1_ = x0_ + 8;
  let y = cpuY;
  const O = () => y = cpuY;
  const P = () => y += 2;

  //        A    F    B    C    D    E    H    L    IXh  IXl  SPh  SPl  PCh  PCl  Aa   Fa   Ba   Ca   Da   Ea   Ha   La   IYh  IYl  I    R    SYS
  cacheX = [x0_, x0_, x0_, x0_, x0_, x0_, x0_, x0_, x0_, x0_, x0_, x0_, x0_, x0_, x1_, x1_, x1_, x1_, x1_, x1_, x1_, x1_, x1_, x1_, x1_, x1_, x1_];
  cacheY = [O(), ++y, ++y, ++y, ++y, ++y, ++y, ++y, ++y, ++y, P(), ++y, ++y, ++y, O(), ++y, ++y, ++y, ++y, ++y, ++y, ++y, ++y, ++y, P(), ++y, P()];

  for (let i = 0; i <= cacheX.length; i++)
    cacheA[i] = getArrowTypes(cacheX[i], cacheY[i]);
}

export function fetchCpu() {
  let i = 0;
  loadCpu(() => getDirect(cacheX[i], cacheY[i++]));
}

export function commitCpu() {
  let i = 0;
  saveCpu(value => setDirect(cacheX[i], cacheY[i], cacheA[i++], value));
}

export function clearCpu() {
  const values: number[] = [];
  values.length = 27;
  restoreCpu(values);
}

export function restoreCpu(values: number[]) {
  initCpu();
  let i = 0;

  loadCpu(() => {
    const value = values[i];
    setDirect(cacheX[i], cacheY[i], cacheA[i++], value);
    return value;
  });
}

function loadCpu(load: () => number) {
  setA(load()); setF(load());
  setB(load()); setC(load());
  setD(load()); setE(load());
  setH(load()); setL(load());
  setIXh(load()); setIXl(load());
  setSP((load() << 8) | load());
  setPC((load() << 8) | load());

  setAa(load()); setFa(load());
  setBa(load()); setCa(load());
  setDa(load()); setEa(load());
  setHa(load()); setLa(load());
  setIYh(load()); setIYl(load());
  setI(load()); setR(load());
  setSYS(load());
}

function saveCpu(save: (value: number) => void) {
  save(a); save(getF());
  save(b); save(c);
  save(d); save(e);
  save(getH()); save(getL());
  save(getIXh()); save(getIXl());
  save(sp >> 8); save(sp & xFF);
  save(pc >> 8); save(pc & xFF);

  save(aa); save(fa);
  save(ba); save(ca);
  save(da); save(ea);
  save(getHa()); save(getLa());
  save(getIYh()); save(getIYl());
  save(i); save(getR());
  save(getSYS());
}
