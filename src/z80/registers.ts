import { BIT7, xFF, xFFFF } from '../hw/constants';

export let a = 0;
export let b = 0;
export let c = 0;
export let d = 0;
export let e = 0;
export let sp = 0;
export let pc = 0;
export let aa = 0;
export let fa = 0;
export let ba = 0;
export let ca = 0;
export let da = 0;
export let ea = 0;
export let hla = 0;
export let i = 0;

export function setA(value: number) { /*!inline*/ a = value; }
export function setB(value: number) { /*!inline*/ b = value; }
export function setC(value: number) { /*!inline*/ c = value; }
export function setD(value: number) { /*!inline*/ d = value; }
export function setE(value: number) { /*!inline*/ e = value; }

export function setAa(value: number) { /*!inline*/ aa = value; }
export function setFa(value: number) { /*!inline*/ fa = value; }
export function setBa(value: number) { /*!inline*/ ba = value; }
export function setCa(value: number) { /*!inline*/ ca = value; }
export function setDa(value: number) { /*!inline*/ da = value; }
export function setEa(value: number) { /*!inline*/ ea = value; }
export function setHLa(value: number) { /*!inline*/ hla = value; }

export function getBC() { /*!inline*/ return c | (b << 8); }
export function setBC(value: number) { /*!inline*/ c = value & xFF; b = value >> 8; }
export function incBC() { /*!inline*/ if (++c > xFF) { c = 0; b = (b + 1) & xFF; } }
export function decBC() { /*!inline*/ if (--c < 0) { c = xFF; b = (b - 1) & xFF; } }

export function getDE() { /*!inline*/ return e | (d << 8); }
export function setDE(value: number) { /*!inline*/ e = value & xFF; d = value >> 8; }
export function incDE() { /*!inline*/ if (++e > xFF) { e = 0; d = (d + 1) & xFF; } }
export function decDE() { /*!inline*/ if (--e < 0) { e = xFF; d = (d - 1) & xFF; } }

export function setSP(value: number) { /*!inline*/ sp = value; }
export function incSP() { /*!inline*/ sp = (sp + 1) & xFFFF; }
export function decSP() { /*!inline*/ sp = (sp - 1) & xFFFF; }
export function inc2SP() { /*!inline*/ sp = (sp + 2) & xFFFF; }
export function dec2SP() { /*!inline*/ sp = (sp - 2) & xFFFF; }

// PC is not masked with & 0xFFFF to save operations. Instead, the mem[] array mirrors the first
// 8 bytes of ROM at addresses 0x10000–0x10007, so reading mem[pc] works correctly even when PC
// crosses the 0xFFFF boundary. In places where the PC value is exposed externally (stack push
// in CALL/RST, state save), the & 0xFFFF mask is applied explicitly.
export function setPC(value: number) { /*!inline*/ pc = value; }
export function incPC() { /*!inline*/ return pc++; }
export function decPC() { /*!inline*/ pc--; }
export function inc2PC() { /*!inline*/ pc += 2; }
export function dec2PC() { /*!inline*/ pc -= 2; }

export function setI(value: number) { /*!inline*/ i = value; }

export let r7 = 0;
export let ri = 0;
export function getR() { /*!inline*/ return (r7 & BIT7) | (ri &= 0x7F); }
export function setR(value: number) { /*!inline*/ r7 = ri = value; }
export function refresh() { /*!inline*/ ri++; }

export let eiDelay: 0 | 1 = 0;
export function setEIDelay(value: 0 | 1) { /*!inline*/ eiDelay = value; }

//todo: Register WZ is not realized in the CPU state, but is used in some FUSE tests
export let wzh = 0;
let wzl = 0;
export function setWZ(value: number) { wzl = value & xFF; wzh = value >> 8; }

//#region HL / IX / IY

const enum HLMode {
  HL,
  IX,
  IY,
}

export let xyMode = HLMode.HL;
export let hlxy = 0;
let hl = 0;
export let ix = 0;
export let iy = 0;

export function setHLMode() {
  /*!inline*/
  if (xyMode === HLMode.IX) ix = hlxy;
  else if (xyMode === HLMode.IY) iy = hlxy;
  hlxy = hl;
  xyMode = HLMode.HL;
}

export function setIXMode() {
  /*!inline*/
  if (xyMode === HLMode.HL) hl = hlxy;
  else if (xyMode === HLMode.IY) iy = hlxy;
  hlxy = ix;
  xyMode = HLMode.IX;
}

export function setIYMode() {
  /*!inline*/
  if (xyMode === HLMode.HL) hl = hlxy;
  else if (xyMode === HLMode.IX) ix = hlxy;
  hlxy = iy;
  xyMode = HLMode.IY;
}

export function setHLXY(value: number) { /*!inline*/ hlxy = value; }
export function setIX(value: number) { /*!inline*/ ix = value; }
export function setIY(value: number) { /*!inline*/ iy = value; }
export function incHLXY() { /*!inline*/ hlxy = (hlxy + 1) & xFFFF; }
export function decHLXY() { /*!inline*/ hlxy = (hlxy - 1) & xFFFF; }

export function getHXY() { /*!inline*/ return hlxy >> 8; }
export function getLXY() { /*!inline*/ return hlxy & xFF; }
export function setHXY(value: number) { /*!inline*/ hlxy = (hlxy & xFF) | (value << 8); }
export function setLXY(value: number) { /*!inline*/ hlxy = (hlxy & 0xFF00) | value; }

export function getH() { /*!inline*/ return hl >> 8; }
export function getL() { /*!inline*/ return hl & xFF; }
export function setH(value: number) { /*!inline*/ hl = (hl & xFF) | (value << 8); }
export function setL(value: number) { /*!inline*/ hl = (hl & 0xFF00) | value; }

//#endregion
