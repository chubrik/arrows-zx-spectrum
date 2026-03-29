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
  const op = next();
  opsBit[op]();
}

function shiftBit(reg: number, fn: (value: number) => number) {
  if (HLXY === HL) {
    set(reg, fn(get(reg)));
  } else {
    const result = fn(get(bitAddr));
    set(bitAddr, result);
    set(reg, result);
  }
}

function testBit(bit: number, reg: number) {
  if (HLXY === HL) {
    const value = get(reg);
    BIT_b_val(bit, value, value);
  } else {
    BIT_b_val(bit, get(bitAddr), bitAddr >> 8);
  }
}

function testBitHL(bit: number) {
  const f53Src = (HLXY === HL ? getWZ() : bitAddr) >> 8;
  BIT_b_val(bit, get(bitAddr), f53Src);
}

function resBit(bit: number, reg: number) {
  if (HLXY === HL) {
    set(reg, get(reg) & ~bit);
  } else {
    const result = get(bitAddr) & ~bit;
    set(bitAddr, result);
    set(reg, result);
  }
}

function setBit(bit: number, reg: number) {
  if (HLXY === HL) {
    set(reg, get(reg) | bit);
  } else {
    const result = get(bitAddr) | bit;
    set(bitAddr, result);
    set(reg, result);
  }
}

const opsBit: (() => void)[] = [
  /* 00 RLC B      */ () => shiftBit(B, RLC_val),
  /* 01 RLC C      */ () => shiftBit(C, RLC_val),
  /* 02 RLC D      */ () => shiftBit(D, RLC_val),
  /* 03 RLC E      */ () => shiftBit(E, RLC_val),
  /* 04 RLC H      */ () => shiftBit(H, RLC_val),
  /* 05 RLC L      */ () => shiftBit(L, RLC_val),
  /* 06 RLC (HL)   */ () => set(bitAddr, RLC_val(get(bitAddr))),
  /* 07 RLC A      */ () => shiftBit(A, RLC_val),
  /* 08 RRC B      */ () => shiftBit(B, RRC_val),
  /* 09 RRC C      */ () => shiftBit(C, RRC_val),
  /* 0A RRC D      */ () => shiftBit(D, RRC_val),
  /* 0B RRC E      */ () => shiftBit(E, RRC_val),
  /* 0C RRC H      */ () => shiftBit(H, RRC_val),
  /* 0D RRC L      */ () => shiftBit(L, RRC_val),
  /* 0E RRC (HL)   */ () => set(bitAddr, RRC_val(get(bitAddr))),
  /* 0F RRC A      */ () => shiftBit(A, RRC_val),

  /* 10 RL B       */ () => shiftBit(B, RL_val),
  /* 11 RL C       */ () => shiftBit(C, RL_val),
  /* 12 RL D       */ () => shiftBit(D, RL_val),
  /* 13 RL E       */ () => shiftBit(E, RL_val),
  /* 14 RL H       */ () => shiftBit(H, RL_val),
  /* 15 RL L       */ () => shiftBit(L, RL_val),
  /* 16 RL (HL)    */ () => set(bitAddr, RL_val(get(bitAddr))),
  /* 17 RL A       */ () => shiftBit(A, RL_val),
  /* 18 RR B       */ () => shiftBit(B, RR_val),
  /* 19 RR C       */ () => shiftBit(C, RR_val),
  /* 1A RR D       */ () => shiftBit(D, RR_val),
  /* 1B RR E       */ () => shiftBit(E, RR_val),
  /* 1C RR H       */ () => shiftBit(H, RR_val),
  /* 1D RR L       */ () => shiftBit(L, RR_val),
  /* 1E RR (HL)    */ () => set(bitAddr, RR_val(get(bitAddr))),
  /* 1F RR A       */ () => shiftBit(A, RR_val),

  /* 20 SLA B      */ () => shiftBit(B, SLA_val),
  /* 21 SLA C      */ () => shiftBit(C, SLA_val),
  /* 22 SLA D      */ () => shiftBit(D, SLA_val),
  /* 23 SLA E      */ () => shiftBit(E, SLA_val),
  /* 24 SLA H      */ () => shiftBit(H, SLA_val),
  /* 25 SLA L      */ () => shiftBit(L, SLA_val),
  /* 26 SLA (HL)   */ () => set(bitAddr, SLA_val(get(bitAddr))),
  /* 27 SLA A      */ () => shiftBit(A, SLA_val),
  /* 28 SRA B      */ () => shiftBit(B, SRA_val),
  /* 29 SRA C      */ () => shiftBit(C, SRA_val),
  /* 2A SRA D      */ () => shiftBit(D, SRA_val),
  /* 2B SRA E      */ () => shiftBit(E, SRA_val),
  /* 2C SRA H      */ () => shiftBit(H, SRA_val),
  /* 2D SRA L      */ () => shiftBit(L, SRA_val),
  /* 2E SRA (HL)   */ () => set(bitAddr, SRA_val(get(bitAddr))),
  /* 2F SRA A      */ () => shiftBit(A, SRA_val),

  /* 30 SLL B    * */ () => shiftBit(B, SLL_val),
  /* 31 SLL C    * */ () => shiftBit(C, SLL_val),
  /* 32 SLL D    * */ () => shiftBit(D, SLL_val),
  /* 33 SLL E    * */ () => shiftBit(E, SLL_val),
  /* 34 SLL H    * */ () => shiftBit(H, SLL_val),
  /* 35 SLL L    * */ () => shiftBit(L, SLL_val),
  /* 36 SLL (HL) * */ () => set(bitAddr, SLL_val(get(bitAddr))),
  /* 37 SLL A    * */ () => shiftBit(A, SLL_val),
  /* 38 SRL B      */ () => shiftBit(B, SRL_val),
  /* 39 SRL C      */ () => shiftBit(C, SRL_val),
  /* 3A SRL D      */ () => shiftBit(D, SRL_val),
  /* 3B SRL E      */ () => shiftBit(E, SRL_val),
  /* 3C SRL H      */ () => shiftBit(H, SRL_val),
  /* 3D SRL L      */ () => shiftBit(L, SRL_val),
  /* 3E SRL (HL)   */ () => set(bitAddr, SRL_val(get(bitAddr))),
  /* 3F SRL A      */ () => shiftBit(A, SRL_val),

  /* 40 BIT 0,B    */ () => testBit(BIT0, B),
  /* 41 BIT 0,C    */ () => testBit(BIT0, C),
  /* 42 BIT 0,D    */ () => testBit(BIT0, D),
  /* 43 BIT 0,E    */ () => testBit(BIT0, E),
  /* 44 BIT 0,H    */ () => testBit(BIT0, H),
  /* 45 BIT 0,L    */ () => testBit(BIT0, L),
  /* 46 BIT 0,(HL) */ () => testBitHL(BIT0),
  /* 47 BIT 0,A    */ () => testBit(BIT0, A),
  /* 48 BIT 1,B    */ () => testBit(BIT1, B),
  /* 49 BIT 1,C    */ () => testBit(BIT1, C),
  /* 4A BIT 1,D    */ () => testBit(BIT1, D),
  /* 4B BIT 1,E    */ () => testBit(BIT1, E),
  /* 4C BIT 1,H    */ () => testBit(BIT1, H),
  /* 4D BIT 1,L    */ () => testBit(BIT1, L),
  /* 4E BIT 1,(HL) */ () => testBitHL(BIT1),
  /* 4F BIT 1,A    */ () => testBit(BIT1, A),

  /* 50 BIT 2,B    */ () => testBit(BIT2, B),
  /* 51 BIT 2,C    */ () => testBit(BIT2, C),
  /* 52 BIT 2,D    */ () => testBit(BIT2, D),
  /* 53 BIT 2,E    */ () => testBit(BIT2, E),
  /* 54 BIT 2,H    */ () => testBit(BIT2, H),
  /* 55 BIT 2,L    */ () => testBit(BIT2, L),
  /* 56 BIT 2,(HL) */ () => testBitHL(BIT2),
  /* 57 BIT 2,A    */ () => testBit(BIT2, A),
  /* 58 BIT 3,B    */ () => testBit(BIT3, B),
  /* 59 BIT 3,C    */ () => testBit(BIT3, C),
  /* 5A BIT 3,D    */ () => testBit(BIT3, D),
  /* 5B BIT 3,E    */ () => testBit(BIT3, E),
  /* 5C BIT 3,H    */ () => testBit(BIT3, H),
  /* 5D BIT 3,L    */ () => testBit(BIT3, L),
  /* 5E BIT 3,(HL) */ () => testBitHL(BIT3),
  /* 5F BIT 3,A    */ () => testBit(BIT3, A),

  /* 60 BIT 4,B    */ () => testBit(BIT4, B),
  /* 61 BIT 4,C    */ () => testBit(BIT4, C),
  /* 62 BIT 4,D    */ () => testBit(BIT4, D),
  /* 63 BIT 4,E    */ () => testBit(BIT4, E),
  /* 64 BIT 4,H    */ () => testBit(BIT4, H),
  /* 65 BIT 4,L    */ () => testBit(BIT4, L),
  /* 66 BIT 4,(HL) */ () => testBitHL(BIT4),
  /* 67 BIT 4,A    */ () => testBit(BIT4, A),
  /* 68 BIT 5,B    */ () => testBit(BIT5, B),
  /* 69 BIT 5,C    */ () => testBit(BIT5, C),
  /* 6A BIT 5,D    */ () => testBit(BIT5, D),
  /* 6B BIT 5,E    */ () => testBit(BIT5, E),
  /* 6C BIT 5,H    */ () => testBit(BIT5, H),
  /* 6D BIT 5,L    */ () => testBit(BIT5, L),
  /* 6E BIT 5,(HL) */ () => testBitHL(BIT5),
  /* 6F BIT 5,A    */ () => testBit(BIT5, A),

  /* 70 BIT 6,B    */ () => testBit(BIT6, B),
  /* 71 BIT 6,C    */ () => testBit(BIT6, C),
  /* 72 BIT 6,D    */ () => testBit(BIT6, D),
  /* 73 BIT 6,E    */ () => testBit(BIT6, E),
  /* 74 BIT 6,H    */ () => testBit(BIT6, H),
  /* 75 BIT 6,L    */ () => testBit(BIT6, L),
  /* 76 BIT 6,(HL) */ () => testBitHL(BIT6),
  /* 77 BIT 6,A    */ () => testBit(BIT6, A),
  /* 78 BIT 7,B    */ () => testBit(BIT7, B),
  /* 79 BIT 7,C    */ () => testBit(BIT7, C),
  /* 7A BIT 7,D    */ () => testBit(BIT7, D),
  /* 7B BIT 7,E    */ () => testBit(BIT7, E),
  /* 7C BIT 7,H    */ () => testBit(BIT7, H),
  /* 7D BIT 7,L    */ () => testBit(BIT7, L),
  /* 7E BIT 7,(HL) */ () => testBitHL(BIT7),
  /* 7F BIT 7,A    */ () => testBit(BIT7, A),

  /* 80 RES 0,B    */ () => resBit(BIT0, B),
  /* 81 RES 0,C    */ () => resBit(BIT0, C),
  /* 82 RES 0,D    */ () => resBit(BIT0, D),
  /* 83 RES 0,E    */ () => resBit(BIT0, E),
  /* 84 RES 0,H    */ () => resBit(BIT0, H),
  /* 85 RES 0,L    */ () => resBit(BIT0, L),
  /* 86 RES 0,(HL) */ () => set(bitAddr, get(bitAddr) & ~BIT0),
  /* 87 RES 0,A    */ () => resBit(BIT0, A),
  /* 88 RES 1,B    */ () => resBit(BIT1, B),
  /* 89 RES 1,C    */ () => resBit(BIT1, C),
  /* 8A RES 1,D    */ () => resBit(BIT1, D),
  /* 8B RES 1,E    */ () => resBit(BIT1, E),
  /* 8C RES 1,H    */ () => resBit(BIT1, H),
  /* 8D RES 1,L    */ () => resBit(BIT1, L),
  /* 8E RES 1,(HL) */ () => set(bitAddr, get(bitAddr) & ~BIT1),
  /* 8F RES 1,A    */ () => resBit(BIT1, A),

  /* 90 RES 2,B    */ () => resBit(BIT2, B),
  /* 91 RES 2,C    */ () => resBit(BIT2, C),
  /* 92 RES 2,D    */ () => resBit(BIT2, D),
  /* 93 RES 2,E    */ () => resBit(BIT2, E),
  /* 94 RES 2,H    */ () => resBit(BIT2, H),
  /* 95 RES 2,L    */ () => resBit(BIT2, L),
  /* 96 RES 2,(HL) */ () => set(bitAddr, get(bitAddr) & ~BIT2),
  /* 97 RES 2,A    */ () => resBit(BIT2, A),
  /* 98 RES 3,B    */ () => resBit(BIT3, B),
  /* 99 RES 3,C    */ () => resBit(BIT3, C),
  /* 9A RES 3,D    */ () => resBit(BIT3, D),
  /* 9B RES 3,E    */ () => resBit(BIT3, E),
  /* 9C RES 3,H    */ () => resBit(BIT3, H),
  /* 9D RES 3,L    */ () => resBit(BIT3, L),
  /* 9E RES 3,(HL) */ () => set(bitAddr, get(bitAddr) & ~BIT3),
  /* 9F RES 3,A    */ () => resBit(BIT3, A),

  /* A0 RES 4,B    */ () => resBit(BIT4, B),
  /* A1 RES 4,C    */ () => resBit(BIT4, C),
  /* A2 RES 4,D    */ () => resBit(BIT4, D),
  /* A3 RES 4,E    */ () => resBit(BIT4, E),
  /* A4 RES 4,H    */ () => resBit(BIT4, H),
  /* A5 RES 4,L    */ () => resBit(BIT4, L),
  /* A6 RES 4,(HL) */ () => set(bitAddr, get(bitAddr) & ~BIT4),
  /* A7 RES 4,A    */ () => resBit(BIT4, A),
  /* A8 RES 5,B    */ () => resBit(BIT5, B),
  /* A9 RES 5,C    */ () => resBit(BIT5, C),
  /* AA RES 5,D    */ () => resBit(BIT5, D),
  /* AB RES 5,E    */ () => resBit(BIT5, E),
  /* AC RES 5,H    */ () => resBit(BIT5, H),
  /* AD RES 5,L    */ () => resBit(BIT5, L),
  /* AE RES 5,(HL) */ () => set(bitAddr, get(bitAddr) & ~BIT5),
  /* AF RES 5,A    */ () => resBit(BIT5, A),

  /* B0 RES 6,B    */ () => resBit(BIT6, B),
  /* B1 RES 6,C    */ () => resBit(BIT6, C),
  /* B2 RES 6,D    */ () => resBit(BIT6, D),
  /* B3 RES 6,E    */ () => resBit(BIT6, E),
  /* B4 RES 6,H    */ () => resBit(BIT6, H),
  /* B5 RES 6,L    */ () => resBit(BIT6, L),
  /* B6 RES 6,(HL) */ () => set(bitAddr, get(bitAddr) & ~BIT6),
  /* B7 RES 6,A    */ () => resBit(BIT6, A),
  /* B8 RES 7,B    */ () => resBit(BIT7, B),
  /* B9 RES 7,C    */ () => resBit(BIT7, C),
  /* BA RES 7,D    */ () => resBit(BIT7, D),
  /* BB RES 7,E    */ () => resBit(BIT7, E),
  /* BC RES 7,H    */ () => resBit(BIT7, H),
  /* BD RES 7,L    */ () => resBit(BIT7, L),
  /* BE RES 7,(HL) */ () => set(bitAddr, get(bitAddr) & ~BIT7),
  /* BF RES 7,A    */ () => resBit(BIT7, A),

  /* C0 SET 0,B    */ () => setBit(BIT0, B),
  /* C1 SET 0,C    */ () => setBit(BIT0, C),
  /* C2 SET 0,D    */ () => setBit(BIT0, D),
  /* C3 SET 0,E    */ () => setBit(BIT0, E),
  /* C4 SET 0,H    */ () => setBit(BIT0, H),
  /* C5 SET 0,L    */ () => setBit(BIT0, L),
  /* C6 SET 0,(HL) */ () => set(bitAddr, get(bitAddr) | BIT0),
  /* C7 SET 0,A    */ () => setBit(BIT0, A),
  /* C8 SET 1,B    */ () => setBit(BIT1, B),
  /* C9 SET 1,C    */ () => setBit(BIT1, C),
  /* CA SET 1,D    */ () => setBit(BIT1, D),
  /* CB SET 1,E    */ () => setBit(BIT1, E),
  /* CC SET 1,H    */ () => setBit(BIT1, H),
  /* CD SET 1,L    */ () => setBit(BIT1, L),
  /* CE SET 1,(HL) */ () => set(bitAddr, get(bitAddr) | BIT1),
  /* CF SET 1,A    */ () => setBit(BIT1, A),

  /* D0 SET 2,B    */ () => setBit(BIT2, B),
  /* D1 SET 2,C    */ () => setBit(BIT2, C),
  /* D2 SET 2,D    */ () => setBit(BIT2, D),
  /* D3 SET 2,E    */ () => setBit(BIT2, E),
  /* D4 SET 2,H    */ () => setBit(BIT2, H),
  /* D5 SET 2,L    */ () => setBit(BIT2, L),
  /* D6 SET 2,(HL) */ () => set(bitAddr, get(bitAddr) | BIT2),
  /* D7 SET 2,A    */ () => setBit(BIT2, A),
  /* D8 SET 3,B    */ () => setBit(BIT3, B),
  /* D9 SET 3,C    */ () => setBit(BIT3, C),
  /* DA SET 3,D    */ () => setBit(BIT3, D),
  /* DB SET 3,E    */ () => setBit(BIT3, E),
  /* DC SET 3,H    */ () => setBit(BIT3, H),
  /* DD SET 3,L    */ () => setBit(BIT3, L),
  /* DE SET 3,(HL) */ () => set(bitAddr, get(bitAddr) | BIT3),
  /* DF SET 3,A    */ () => setBit(BIT3, A),

  /* E0 SET 4,B    */ () => setBit(BIT4, B),
  /* E1 SET 4,C    */ () => setBit(BIT4, C),
  /* E2 SET 4,D    */ () => setBit(BIT4, D),
  /* E3 SET 4,E    */ () => setBit(BIT4, E),
  /* E4 SET 4,H    */ () => setBit(BIT4, H),
  /* E5 SET 4,L    */ () => setBit(BIT4, L),
  /* E6 SET 4,(HL) */ () => set(bitAddr, get(bitAddr) | BIT4),
  /* E7 SET 4,A    */ () => setBit(BIT4, A),
  /* E8 SET 5,B    */ () => setBit(BIT5, B),
  /* E9 SET 5,C    */ () => setBit(BIT5, C),
  /* EA SET 5,D    */ () => setBit(BIT5, D),
  /* EB SET 5,E    */ () => setBit(BIT5, E),
  /* EC SET 5,H    */ () => setBit(BIT5, H),
  /* ED SET 5,L    */ () => setBit(BIT5, L),
  /* EE SET 5,(HL) */ () => set(bitAddr, get(bitAddr) | BIT5),
  /* EF SET 5,A    */ () => setBit(BIT5, A),

  /* F0 SET 6,B    */ () => setBit(BIT6, B),
  /* F1 SET 6,C    */ () => setBit(BIT6, C),
  /* F2 SET 6,D    */ () => setBit(BIT6, D),
  /* F3 SET 6,E    */ () => setBit(BIT6, E),
  /* F4 SET 6,H    */ () => setBit(BIT6, H),
  /* F5 SET 6,L    */ () => setBit(BIT6, L),
  /* F6 SET 6,(HL) */ () => set(bitAddr, get(bitAddr) | BIT6),
  /* F7 SET 6,A    */ () => setBit(BIT6, A),
  /* F8 SET 7,B    */ () => setBit(BIT7, B),
  /* F9 SET 7,C    */ () => setBit(BIT7, C),
  /* FA SET 7,D    */ () => setBit(BIT7, D),
  /* FB SET 7,E    */ () => setBit(BIT7, E),
  /* FC SET 7,H    */ () => setBit(BIT7, H),
  /* FD SET 7,L    */ () => setBit(BIT7, L),
  /* FE SET 7,(HL) */ () => set(bitAddr, get(bitAddr) | BIT7),
  /* FF SET 7,A    */ () => setBit(BIT7, A),
];
