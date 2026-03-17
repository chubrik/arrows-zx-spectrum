import { getMem8, setMem8 } from '../../common/utils';
import { RhlSelect } from '../types';
import { getA, getBC, getDE, getI, getR, getRhl, next16, next8, setA, setI, setR, setRhl } from '../utils';

/** 
 * LD r,r'
 * LD r,(HL) | LD r,(IX+d) | LD r,(IY+d)
 * LD (HL),r | LD (IX+d),r | LD (IY+d),r
 */
export function LD_Rhl_Rhl(dest: RhlSelect, src: RhlSelect) {
  const value = getRhl(src);
  setRhl(dest, value);
}

/**
 * LD r,n
 * LD (HL),n | LD (IX+d),n | LD (IY+d),n
 */
export function LD_Rhl_N(dest: RhlSelect) {
  const n = next8();
  setRhl(dest, n);
}

/** LD A,I */
export function LD_A_I() {
  const value = getI();
  setA(value);
}

/** LD I,A */
export function LD_I_A() {
  const value = getA();
  setI(value);
}

/** LD A,R */
export function LD_A_R() {
  const value = getR();
  setA(value);
}

/** LD R,A */
export function LD_R_A() {
  const value = getA();
  setR(value);
}

/** LD A,(BC) */
export function LD_A_bc() {
  const addr = getBC();
  ld_A_addr(addr);
}

/** LD A,(DE) */
export function LD_A_de() {
  const addr = getDE();
  ld_A_addr(addr);
}

/** LD A,(nn) */
export function LD_A_nn() {
  const addr = next16();
  ld_A_addr(addr);
}

/** LD (BC),A */
export function LD_bc_A() {
  const addr = getBC();
  ld_addr_A(addr);
}

/** LD (DE),A */
export function LD_de_A() {
  const addr = getDE();
  ld_addr_A(addr);
}

/** LD (nn),A */
export function LD_nn_A() {
  const addr = next16();
  ld_addr_A(addr);
}

function ld_A_addr(addr: number) {
  const value = getMem8(addr);
  setA(value);
}

function ld_addr_A(addr: number) {
  const value = getA();
  setMem8(addr, value);
}
