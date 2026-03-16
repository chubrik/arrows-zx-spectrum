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
  const srcAddr = getBC();
  LD_A_addr(srcAddr);
}

/** LD A,(DE) */
export function LD_A_de() {
  const srcAddr = getDE();
  LD_A_addr(srcAddr);
}

/** LD A,(nn) */
export function LD_A_nn() {
  const srcAddr = next16();
  LD_A_addr(srcAddr);
}

/** LD (BC),A */
export function LD_bc_A() {
  const destAddr = getBC();
  LD_addr_A(destAddr);
}

/** LD (DE),A */
export function LD_de_A() {
  const destAddr = getDE();
  LD_addr_A(destAddr);
}

/** LD (nn),A */
export function LD_nn_A() {
  const destAddr = next16();
  LD_addr_A(destAddr);
}

function LD_A_addr(srcAddr: number) {
  const value = getMem8(srcAddr);
  setA(value);
}

function LD_addr_A(destAddr: number) {
  const value = getA();
  setMem8(destAddr, value);
}
