import { getMem8, setMem8 } from '../../common/utils';
import { RhlSelect } from '../types';
import { getRegA, getRegBC, getRegDE, getRegI, getRegR, getRegRhl, next16, next8, setRegA, setRegI, setRegR, setRegRhl } from '../utils';

/** 
 * LD r,r'
 * LD r,(HL) | LD r,(IX+d) | LD r,(IY+d)
 * LD (HL),r | LD (IX+d),r | LD (IY+d),r
 */
export function LD_Rhl_Rhl(dest: RhlSelect, src: RhlSelect) {
  const value = getRegRhl(src);
  setRegRhl(dest, value);
}

/**
 * LD r,n
 * LD (HL),n | LD (IX+d),n | LD (IY+d),n
 */
export function LD_Rhl_N(dest: RhlSelect) {
  const n = next8();
  setRegRhl(dest, n);
}

/** LD A,I */
export function LD_A_I() {
  const value = getRegI();
  setRegA(value);
}

/** LD I,A */
export function LD_I_A() {
  const value = getRegA();
  setRegI(value);
}

/** LD A,R */
export function LD_A_R() {
  const value = getRegR();
  setRegA(value);
}

/** LD R,A */
export function LD_R_A() {
  const value = getRegA();
  setRegR(value);
}

/** LD A,(BC) */
export function LD_A_bc() {
  const srcAddr = getRegBC();
  LD_A_mem(srcAddr);
}

/** LD A,(DE) */
export function LD_A_de() {
  const srcAddr = getRegDE();
  LD_A_mem(srcAddr);
}

/** LD A,(nn) */
export function LD_A_nn() {
  const srcAddr = next16();
  LD_A_mem(srcAddr);
}

/** LD (BC),A */
export function LD_bc_A() {
  const destAddr = getRegBC();
  LD_mem_A(destAddr);
}

/** LD (DE),A */
export function LD_de_A() {
  const destAddr = getRegDE();
  LD_mem_A(destAddr);
}

/** LD (nn),A */
export function LD_nn_A() {
  const destAddr = next16();
  LD_mem_A(destAddr);
}

function LD_A_mem(srcAddr: number) {
  const value = getMem8(srcAddr);
  setRegA(value);
}

function LD_mem_A(destAddr: number) {
  const value = getRegA();
  setMem8(destAddr, value);
}
