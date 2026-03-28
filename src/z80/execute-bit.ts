import { get, get16, set } from '../common/utils';
import { BIT_b_val } from './op/op-bit';
import { RL_val, RLC_val, RR_val, RRC_val, SLA_val, SLL_val, SRA_val, SRL_val } from './op/op-shift';
import { A, B, C, D, E, H, HL, HLXY, L } from './positions';
import { getAddrXYd, getWZ, next, refresh } from './utils';

const BIT7 = 0x80;
const BIT6 = 0x40;
const BIT5 = 0x20;
const BIT4 = 0x10;
const BIT3 = 0x08;
const BIT2 = 0x04;
const BIT1 = 0x02;
const BIT0 = 0x01;

let bitAddr = 0;

/** Bit Instructions (CB) | IX Bit Instructions (DDCB) | IY Bit Instructions (FDCB) */
export function executeBit() {
  if (HLXY === HL) {
    refresh();
    bitAddr = get16(HL);
  } else {
    bitAddr = getAddrXYd(next());
  }
  opsBit[next()]();
}

type ShiftFn = (value: number) => number;

function shiftReg(reg: number, fn: ShiftFn) {
  if (HLXY === HL) {
    set(reg, fn(get(reg)));
  } else {
    const r = fn(get(bitAddr)); set(bitAddr, r); set(reg, r);
  }
}

function bitReg(mask: number, reg: number) {
  if (HLXY === HL) {
    const v = get(reg); BIT_b_val(mask, v, v);
  } else {
    BIT_b_val(mask, get(bitAddr), bitAddr >> 8);
  }
}

function bitMem(mask: number) {
  const f53 = HLXY === HL ? getWZ() >> 8 : bitAddr >> 8;
  BIT_b_val(mask, get(bitAddr), f53);
}

function resReg(bit: number, reg: number) {
  if (HLXY === HL) {
    set(reg, get(reg) & ~bit);
  } else {
    const r = get(bitAddr) & ~bit; set(bitAddr, r); set(reg, r);
  }
}

function setBitReg(bit: number, reg: number) {
  if (HLXY === HL) {
    set(reg, get(reg) | bit);
  } else {
    const r = get(bitAddr) | bit; set(bitAddr, r); set(reg, r);
  }
}

const opsBit: (() => void)[] = [
  /* 00 RLC B      */ () => shiftReg(B, RLC_val),
  /* 01 RLC C      */ () => shiftReg(C, RLC_val),
  /* 02 RLC D      */ () => shiftReg(D, RLC_val),
  /* 03 RLC E      */ () => shiftReg(E, RLC_val),
  /* 04 RLC H      */ () => shiftReg(H, RLC_val),
  /* 05 RLC L      */ () => shiftReg(L, RLC_val),
  /* 06 RLC (HL)   */ () => set(bitAddr, RLC_val(get(bitAddr))),
  /* 07 RLC A      */ () => shiftReg(A, RLC_val),
  /* 08 RRC B      */ () => shiftReg(B, RRC_val),
  /* 09 RRC C      */ () => shiftReg(C, RRC_val),
  /* 0A RRC D      */ () => shiftReg(D, RRC_val),
  /* 0B RRC E      */ () => shiftReg(E, RRC_val),
  /* 0C RRC H      */ () => shiftReg(H, RRC_val),
  /* 0D RRC L      */ () => shiftReg(L, RRC_val),
  /* 0E RRC (HL)   */ () => set(bitAddr, RRC_val(get(bitAddr))),
  /* 0F RRC A      */ () => shiftReg(A, RRC_val),

  /* 10 RL B       */ () => shiftReg(B, RL_val),
  /* 11 RL C       */ () => shiftReg(C, RL_val),
  /* 12 RL D       */ () => shiftReg(D, RL_val),
  /* 13 RL E       */ () => shiftReg(E, RL_val),
  /* 14 RL H       */ () => shiftReg(H, RL_val),
  /* 15 RL L       */ () => shiftReg(L, RL_val),
  /* 16 RL (HL)    */ () => set(bitAddr, RL_val(get(bitAddr))),
  /* 17 RL A       */ () => shiftReg(A, RL_val),
  /* 18 RR B       */ () => shiftReg(B, RR_val),
  /* 19 RR C       */ () => shiftReg(C, RR_val),
  /* 1A RR D       */ () => shiftReg(D, RR_val),
  /* 1B RR E       */ () => shiftReg(E, RR_val),
  /* 1C RR H       */ () => shiftReg(H, RR_val),
  /* 1D RR L       */ () => shiftReg(L, RR_val),
  /* 1E RR (HL)    */ () => set(bitAddr, RR_val(get(bitAddr))),
  /* 1F RR A       */ () => shiftReg(A, RR_val),

  /* 20 SLA B      */ () => shiftReg(B, SLA_val),
  /* 21 SLA C      */ () => shiftReg(C, SLA_val),
  /* 22 SLA D      */ () => shiftReg(D, SLA_val),
  /* 23 SLA E      */ () => shiftReg(E, SLA_val),
  /* 24 SLA H      */ () => shiftReg(H, SLA_val),
  /* 25 SLA L      */ () => shiftReg(L, SLA_val),
  /* 26 SLA (HL)   */ () => set(bitAddr, SLA_val(get(bitAddr))),
  /* 27 SLA A      */ () => shiftReg(A, SLA_val),
  /* 28 SRA B      */ () => shiftReg(B, SRA_val),
  /* 29 SRA C      */ () => shiftReg(C, SRA_val),
  /* 2A SRA D      */ () => shiftReg(D, SRA_val),
  /* 2B SRA E      */ () => shiftReg(E, SRA_val),
  /* 2C SRA H      */ () => shiftReg(H, SRA_val),
  /* 2D SRA L      */ () => shiftReg(L, SRA_val),
  /* 2E SRA (HL)   */ () => set(bitAddr, SRA_val(get(bitAddr))),
  /* 2F SRA A      */ () => shiftReg(A, SRA_val),

  /* 30 SLL B    * */ () => shiftReg(B, SLL_val),
  /* 31 SLL C    * */ () => shiftReg(C, SLL_val),
  /* 32 SLL D    * */ () => shiftReg(D, SLL_val),
  /* 33 SLL E    * */ () => shiftReg(E, SLL_val),
  /* 34 SLL H    * */ () => shiftReg(H, SLL_val),
  /* 35 SLL L    * */ () => shiftReg(L, SLL_val),
  /* 36 SLL (HL) * */ () => set(bitAddr, SLL_val(get(bitAddr))),
  /* 37 SLL A    * */ () => shiftReg(A, SLL_val),
  /* 38 SRL B      */ () => shiftReg(B, SRL_val),
  /* 39 SRL C      */ () => shiftReg(C, SRL_val),
  /* 3A SRL D      */ () => shiftReg(D, SRL_val),
  /* 3B SRL E      */ () => shiftReg(E, SRL_val),
  /* 3C SRL H      */ () => shiftReg(H, SRL_val),
  /* 3D SRL L      */ () => shiftReg(L, SRL_val),
  /* 3E SRL (HL)   */ () => set(bitAddr, SRL_val(get(bitAddr))),
  /* 3F SRL A      */ () => shiftReg(A, SRL_val),

  /* 40 BIT 0,B    */ () => bitReg(BIT0, B),
  /* 41 BIT 0,C    */ () => bitReg(BIT0, C),
  /* 42 BIT 0,D    */ () => bitReg(BIT0, D),
  /* 43 BIT 0,E    */ () => bitReg(BIT0, E),
  /* 44 BIT 0,H    */ () => bitReg(BIT0, H),
  /* 45 BIT 0,L    */ () => bitReg(BIT0, L),
  /* 46 BIT 0,(HL) */ () => bitMem(BIT0),
  /* 47 BIT 0,A    */ () => bitReg(BIT0, A),
  /* 48 BIT 1,B    */ () => bitReg(BIT1, B),
  /* 49 BIT 1,C    */ () => bitReg(BIT1, C),
  /* 4A BIT 1,D    */ () => bitReg(BIT1, D),
  /* 4B BIT 1,E    */ () => bitReg(BIT1, E),
  /* 4C BIT 1,H    */ () => bitReg(BIT1, H),
  /* 4D BIT 1,L    */ () => bitReg(BIT1, L),
  /* 4E BIT 1,(HL) */ () => bitMem(BIT1),
  /* 4F BIT 1,A    */ () => bitReg(BIT1, A),

  /* 50 BIT 2,B    */ () => bitReg(BIT2, B),
  /* 51 BIT 2,C    */ () => bitReg(BIT2, C),
  /* 52 BIT 2,D    */ () => bitReg(BIT2, D),
  /* 53 BIT 2,E    */ () => bitReg(BIT2, E),
  /* 54 BIT 2,H    */ () => bitReg(BIT2, H),
  /* 55 BIT 2,L    */ () => bitReg(BIT2, L),
  /* 56 BIT 2,(HL) */ () => bitMem(BIT2),
  /* 57 BIT 2,A    */ () => bitReg(BIT2, A),
  /* 58 BIT 3,B    */ () => bitReg(BIT3, B),
  /* 59 BIT 3,C    */ () => bitReg(BIT3, C),
  /* 5A BIT 3,D    */ () => bitReg(BIT3, D),
  /* 5B BIT 3,E    */ () => bitReg(BIT3, E),
  /* 5C BIT 3,H    */ () => bitReg(BIT3, H),
  /* 5D BIT 3,L    */ () => bitReg(BIT3, L),
  /* 5E BIT 3,(HL) */ () => bitMem(BIT3),
  /* 5F BIT 3,A    */ () => bitReg(BIT3, A),

  /* 60 BIT 4,B    */ () => bitReg(BIT4, B),
  /* 61 BIT 4,C    */ () => bitReg(BIT4, C),
  /* 62 BIT 4,D    */ () => bitReg(BIT4, D),
  /* 63 BIT 4,E    */ () => bitReg(BIT4, E),
  /* 64 BIT 4,H    */ () => bitReg(BIT4, H),
  /* 65 BIT 4,L    */ () => bitReg(BIT4, L),
  /* 66 BIT 4,(HL) */ () => bitMem(BIT4),
  /* 67 BIT 4,A    */ () => bitReg(BIT4, A),
  /* 68 BIT 5,B    */ () => bitReg(BIT5, B),
  /* 69 BIT 5,C    */ () => bitReg(BIT5, C),
  /* 6A BIT 5,D    */ () => bitReg(BIT5, D),
  /* 6B BIT 5,E    */ () => bitReg(BIT5, E),
  /* 6C BIT 5,H    */ () => bitReg(BIT5, H),
  /* 6D BIT 5,L    */ () => bitReg(BIT5, L),
  /* 6E BIT 5,(HL) */ () => bitMem(BIT5),
  /* 6F BIT 5,A    */ () => bitReg(BIT5, A),

  /* 70 BIT 6,B    */ () => bitReg(BIT6, B),
  /* 71 BIT 6,C    */ () => bitReg(BIT6, C),
  /* 72 BIT 6,D    */ () => bitReg(BIT6, D),
  /* 73 BIT 6,E    */ () => bitReg(BIT6, E),
  /* 74 BIT 6,H    */ () => bitReg(BIT6, H),
  /* 75 BIT 6,L    */ () => bitReg(BIT6, L),
  /* 76 BIT 6,(HL) */ () => bitMem(BIT6),
  /* 77 BIT 6,A    */ () => bitReg(BIT6, A),
  /* 78 BIT 7,B    */ () => bitReg(BIT7, B),
  /* 79 BIT 7,C    */ () => bitReg(BIT7, C),
  /* 7A BIT 7,D    */ () => bitReg(BIT7, D),
  /* 7B BIT 7,E    */ () => bitReg(BIT7, E),
  /* 7C BIT 7,H    */ () => bitReg(BIT7, H),
  /* 7D BIT 7,L    */ () => bitReg(BIT7, L),
  /* 7E BIT 7,(HL) */ () => bitMem(BIT7),
  /* 7F BIT 7,A    */ () => bitReg(BIT7, A),

  /* 80 RES 0,B    */ () => resReg(BIT0, B),
  /* 81 RES 0,C    */ () => resReg(BIT0, C),
  /* 82 RES 0,D    */ () => resReg(BIT0, D),
  /* 83 RES 0,E    */ () => resReg(BIT0, E),
  /* 84 RES 0,H    */ () => resReg(BIT0, H),
  /* 85 RES 0,L    */ () => resReg(BIT0, L),
  /* 86 RES 0,(HL) */ () => set(bitAddr, get(bitAddr) & ~BIT0),
  /* 87 RES 0,A    */ () => resReg(BIT0, A),
  /* 88 RES 1,B    */ () => resReg(BIT1, B),
  /* 89 RES 1,C    */ () => resReg(BIT1, C),
  /* 8A RES 1,D    */ () => resReg(BIT1, D),
  /* 8B RES 1,E    */ () => resReg(BIT1, E),
  /* 8C RES 1,H    */ () => resReg(BIT1, H),
  /* 8D RES 1,L    */ () => resReg(BIT1, L),
  /* 8E RES 1,(HL) */ () => set(bitAddr, get(bitAddr) & ~BIT1),
  /* 8F RES 1,A    */ () => resReg(BIT1, A),

  /* 90 RES 2,B    */ () => resReg(BIT2, B),
  /* 91 RES 2,C    */ () => resReg(BIT2, C),
  /* 92 RES 2,D    */ () => resReg(BIT2, D),
  /* 93 RES 2,E    */ () => resReg(BIT2, E),
  /* 94 RES 2,H    */ () => resReg(BIT2, H),
  /* 95 RES 2,L    */ () => resReg(BIT2, L),
  /* 96 RES 2,(HL) */ () => set(bitAddr, get(bitAddr) & ~BIT2),
  /* 97 RES 2,A    */ () => resReg(BIT2, A),
  /* 98 RES 3,B    */ () => resReg(BIT3, B),
  /* 99 RES 3,C    */ () => resReg(BIT3, C),
  /* 9A RES 3,D    */ () => resReg(BIT3, D),
  /* 9B RES 3,E    */ () => resReg(BIT3, E),
  /* 9C RES 3,H    */ () => resReg(BIT3, H),
  /* 9D RES 3,L    */ () => resReg(BIT3, L),
  /* 9E RES 3,(HL) */ () => set(bitAddr, get(bitAddr) & ~BIT3),
  /* 9F RES 3,A    */ () => resReg(BIT3, A),

  /* A0 RES 4,B    */ () => resReg(BIT4, B),
  /* A1 RES 4,C    */ () => resReg(BIT4, C),
  /* A2 RES 4,D    */ () => resReg(BIT4, D),
  /* A3 RES 4,E    */ () => resReg(BIT4, E),
  /* A4 RES 4,H    */ () => resReg(BIT4, H),
  /* A5 RES 4,L    */ () => resReg(BIT4, L),
  /* A6 RES 4,(HL) */ () => set(bitAddr, get(bitAddr) & ~BIT4),
  /* A7 RES 4,A    */ () => resReg(BIT4, A),
  /* A8 RES 5,B    */ () => resReg(BIT5, B),
  /* A9 RES 5,C    */ () => resReg(BIT5, C),
  /* AA RES 5,D    */ () => resReg(BIT5, D),
  /* AB RES 5,E    */ () => resReg(BIT5, E),
  /* AC RES 5,H    */ () => resReg(BIT5, H),
  /* AD RES 5,L    */ () => resReg(BIT5, L),
  /* AE RES 5,(HL) */ () => set(bitAddr, get(bitAddr) & ~BIT5),
  /* AF RES 5,A    */ () => resReg(BIT5, A),

  /* B0 RES 6,B    */ () => resReg(BIT6, B),
  /* B1 RES 6,C    */ () => resReg(BIT6, C),
  /* B2 RES 6,D    */ () => resReg(BIT6, D),
  /* B3 RES 6,E    */ () => resReg(BIT6, E),
  /* B4 RES 6,H    */ () => resReg(BIT6, H),
  /* B5 RES 6,L    */ () => resReg(BIT6, L),
  /* B6 RES 6,(HL) */ () => set(bitAddr, get(bitAddr) & ~BIT6),
  /* B7 RES 6,A    */ () => resReg(BIT6, A),
  /* B8 RES 7,B    */ () => resReg(BIT7, B),
  /* B9 RES 7,C    */ () => resReg(BIT7, C),
  /* BA RES 7,D    */ () => resReg(BIT7, D),
  /* BB RES 7,E    */ () => resReg(BIT7, E),
  /* BC RES 7,H    */ () => resReg(BIT7, H),
  /* BD RES 7,L    */ () => resReg(BIT7, L),
  /* BE RES 7,(HL) */ () => set(bitAddr, get(bitAddr) & ~BIT7),
  /* BF RES 7,A    */ () => resReg(BIT7, A),

  /* C0 SET 0,B    */ () => setBitReg(BIT0, B),
  /* C1 SET 0,C    */ () => setBitReg(BIT0, C),
  /* C2 SET 0,D    */ () => setBitReg(BIT0, D),
  /* C3 SET 0,E    */ () => setBitReg(BIT0, E),
  /* C4 SET 0,H    */ () => setBitReg(BIT0, H),
  /* C5 SET 0,L    */ () => setBitReg(BIT0, L),
  /* C6 SET 0,(HL) */ () => set(bitAddr, get(bitAddr) | BIT0),
  /* C7 SET 0,A    */ () => setBitReg(BIT0, A),
  /* C8 SET 1,B    */ () => setBitReg(BIT1, B),
  /* C9 SET 1,C    */ () => setBitReg(BIT1, C),
  /* CA SET 1,D    */ () => setBitReg(BIT1, D),
  /* CB SET 1,E    */ () => setBitReg(BIT1, E),
  /* CC SET 1,H    */ () => setBitReg(BIT1, H),
  /* CD SET 1,L    */ () => setBitReg(BIT1, L),
  /* CE SET 1,(HL) */ () => set(bitAddr, get(bitAddr) | BIT1),
  /* CF SET 1,A    */ () => setBitReg(BIT1, A),

  /* D0 SET 2,B    */ () => setBitReg(BIT2, B),
  /* D1 SET 2,C    */ () => setBitReg(BIT2, C),
  /* D2 SET 2,D    */ () => setBitReg(BIT2, D),
  /* D3 SET 2,E    */ () => setBitReg(BIT2, E),
  /* D4 SET 2,H    */ () => setBitReg(BIT2, H),
  /* D5 SET 2,L    */ () => setBitReg(BIT2, L),
  /* D6 SET 2,(HL) */ () => set(bitAddr, get(bitAddr) | BIT2),
  /* D7 SET 2,A    */ () => setBitReg(BIT2, A),
  /* D8 SET 3,B    */ () => setBitReg(BIT3, B),
  /* D9 SET 3,C    */ () => setBitReg(BIT3, C),
  /* DA SET 3,D    */ () => setBitReg(BIT3, D),
  /* DB SET 3,E    */ () => setBitReg(BIT3, E),
  /* DC SET 3,H    */ () => setBitReg(BIT3, H),
  /* DD SET 3,L    */ () => setBitReg(BIT3, L),
  /* DE SET 3,(HL) */ () => set(bitAddr, get(bitAddr) | BIT3),
  /* DF SET 3,A    */ () => setBitReg(BIT3, A),

  /* E0 SET 4,B    */ () => setBitReg(BIT4, B),
  /* E1 SET 4,C    */ () => setBitReg(BIT4, C),
  /* E2 SET 4,D    */ () => setBitReg(BIT4, D),
  /* E3 SET 4,E    */ () => setBitReg(BIT4, E),
  /* E4 SET 4,H    */ () => setBitReg(BIT4, H),
  /* E5 SET 4,L    */ () => setBitReg(BIT4, L),
  /* E6 SET 4,(HL) */ () => set(bitAddr, get(bitAddr) | BIT4),
  /* E7 SET 4,A    */ () => setBitReg(BIT4, A),
  /* E8 SET 5,B    */ () => setBitReg(BIT5, B),
  /* E9 SET 5,C    */ () => setBitReg(BIT5, C),
  /* EA SET 5,D    */ () => setBitReg(BIT5, D),
  /* EB SET 5,E    */ () => setBitReg(BIT5, E),
  /* EC SET 5,H    */ () => setBitReg(BIT5, H),
  /* ED SET 5,L    */ () => setBitReg(BIT5, L),
  /* EE SET 5,(HL) */ () => set(bitAddr, get(bitAddr) | BIT5),
  /* EF SET 5,A    */ () => setBitReg(BIT5, A),

  /* F0 SET 6,B    */ () => setBitReg(BIT6, B),
  /* F1 SET 6,C    */ () => setBitReg(BIT6, C),
  /* F2 SET 6,D    */ () => setBitReg(BIT6, D),
  /* F3 SET 6,E    */ () => setBitReg(BIT6, E),
  /* F4 SET 6,H    */ () => setBitReg(BIT6, H),
  /* F5 SET 6,L    */ () => setBitReg(BIT6, L),
  /* F6 SET 6,(HL) */ () => set(bitAddr, get(bitAddr) | BIT6),
  /* F7 SET 6,A    */ () => setBitReg(BIT6, A),
  /* F8 SET 7,B    */ () => setBitReg(BIT7, B),
  /* F9 SET 7,C    */ () => setBitReg(BIT7, C),
  /* FA SET 7,D    */ () => setBitReg(BIT7, D),
  /* FB SET 7,E    */ () => setBitReg(BIT7, E),
  /* FC SET 7,H    */ () => setBitReg(BIT7, H),
  /* FD SET 7,L    */ () => setBitReg(BIT7, L),
  /* FE SET 7,(HL) */ () => set(bitAddr, get(bitAddr) | BIT7),
  /* FF SET 7,A    */ () => setBitReg(BIT7, A),
];
