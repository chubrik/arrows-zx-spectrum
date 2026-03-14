import { get8, getMem8, set8, setMem8 } from '../../common/data';
import { RhlSelect } from '../types';
import { getRegA, getRegBC, getRegDE, getRegRhl, nextPC16, nextPC8, setRegA, setRegRhl } from '../utils';

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
  const n = nextPC8();
  setRegRhl(dest, n);
}

/** LD A,I | LD I,A | LD A,R | LD R,A */
export function LD_reg_reg(dest: Position, src: Position) {
  const value = get8(src);
  set8(dest, value);
}

/** LD A,(BC) */
export function LD_A_bc() {
  const srcAddr = getRegBC();
  LD_A_addr(srcAddr);
}

/** LD A,(DE) */
export function LD_A_de() {
  const srcAddr = getRegDE();
  LD_A_addr(srcAddr);
}

/** LD A,(nn) */
export function LD_A_nn() {
  const srcAddr = nextPC16();
  LD_A_addr(srcAddr);
}

/** LD (BC),A */
export function LD_bc_A() {
  const destAddr = getRegBC();
  LD_addr_A(destAddr);
}

/** LD (DE),A */
export function LD_de_A() {
  const destAddr = getRegDE();
  LD_addr_A(destAddr);
}

/** LD (nn),A */
export function LD_nn_A() {
  const destAddr = nextPC16();
  LD_addr_A(destAddr);
}

function LD_A_addr(srcAddr: number) {
  const value = getMem8(srcAddr);
  setRegA(value);
}

function LD_addr_A(destAddr: number) {
  const value = getRegA();
  setMem8(destAddr, value);
}
