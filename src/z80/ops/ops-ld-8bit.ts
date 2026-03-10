import { next16, next8 } from "../cpu";
import { get16, get8Core, getMem8, set8Core, setMem8 } from "../data";
import { Reg } from "../types";
import { poses, Rhl } from "../utils";

/** 
 * LD r,r'
 * LD r,(HL) | LD r,(IX+d) | LD r,(IY+d)
 * LD (HL),r | LD (IX+d),r | LD (IY+d),r
 */
export function LD_Rhl_Rhl(b543: number, b210: number) {
    const destPos = Rhl[b543]();
    const srcPos = Rhl[b210]();
    const data = get8Core(srcPos);
    set8Core(destPos, data);
}

/**
 * LD r,n
 * LD (HL),n | LD (IX+d),n | LD (IY+d),n
 */
export function LD_Rhl_N(b543: number) {
    const destPos = Rhl[b543]();
    const n = next8();
    set8Core(destPos, n);
}

/** LD A,I | LD I,A | LD A,R | LD R,A */
export function LD_reg_reg(destReg: Reg, srcReg: Reg) {
    const destPos = poses[destReg];
    const srcPos = poses[srcReg];
    const data = get8Core(srcPos);
    set8Core(destPos, data);
}

/** LD A,(BC) */
export function LD_A_bc() { 
    const srcAddr = get16(Reg.B, Reg.C);
    LD_A_addr(srcAddr);
}

/** LD A,(DE) */
export function LD_A_de() {
    const srcAddr = get16(Reg.D, Reg.E);
    LD_A_addr(srcAddr);
}

/** LD A,(nn) */
export function LD_A_nn() {
    const srcAddr = next16();
    LD_A_addr(srcAddr);
}

/** LD (BC),A */
export function LD_bc_A() {
    const destAddr = get16(Reg.B, Reg.C);
    LD_addr_A(destAddr);
}

/** LD (DE),A */
export function LD_de_A() {
    const destAddr = get16(Reg.D, Reg.E);
    LD_addr_A(destAddr);
}

/** LD (nn),A */
export function LD_nn_A() {
    const destAddr = next16();
    LD_addr_A(destAddr);
}

function LD_A_addr(srcAddr: number) {
    const destPos = poses[Reg.A];
    const data = getMem8(srcAddr);
    set8Core(destPos, data);
}

function LD_addr_A(destAddr: number) {
    const srcPos = poses[Reg.A];
    const data = get8Core(srcPos);
    setMem8(destAddr, data);
}
