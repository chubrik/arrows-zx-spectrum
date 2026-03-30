import { read, write88 } from '../common/memory';
import { IFF1, iff2, IM1, IM2, setIFF1, setIM1, setIM2 } from './flags';
import { RLD, RRD } from './op/op-shift';
import { cpBlock, inBlock, ldBlock, outBlock } from './op/op-block';
import { IN_c, ld_A_IR, OUT_c } from './op/op-etc';
import { ADC_HL, SBC_HL } from './op/op-math-16bit';
import { NEG } from './op/op-math-etc';
import { pop16 } from './op/op-stack';
import { A, B, BC, C, D, DE, E, H, HL, I, L, PC, R, regs, set88, SP, SPh, SPl } from './registers';
import { nop as _, next, next16, nop, refresh } from './utils';

export function executeMisc() {
  refresh();
  const op = next();
  opsMisc[op]();
}

const opsMisc = [
  /* ED00 */ _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
  /* ED10 */ _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
  /* ED20 */ _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
  /* ED30 */ _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,

  /* ED40 IN B,(C)     */ () => IN_c(B),
  /* ED41 OUT (C),B    */ () => OUT_c(B),
  /* ED42 SBC HL,BC    */ () => SBC_HL(BC),
  /* ED43 LD (nn),BC   */ () => write88(next16(), regs[C], regs[B]),
  /* ED44 NEG          */ NEG,
  /* ED45 RETN         */ () => { pop16(PC); setIFF1(iff2 ? IFF1 : 0); },
  /* ED46 IM 0         */ () => { setIM1(0); setIM2(0); },
  /* ED47 LD I,A       */ () => regs[I] = regs[A],
  /* ED48 IN C,(C)     */ () => IN_c(C),
  /* ED49 OUT (C),C    */ () => OUT_c(C),
  /* ED4A ADC HL,BC    */ () => ADC_HL(BC),
  /* ED4B LD BC,(nn)   */ () => { const addr = next16(); set88(BC, read(addr), read(addr + 1)); },
  /* ED4C NEG        * */ NEG,
  /* ED4D RETI         */ () => { pop16(PC); setIFF1(iff2 ? IFF1 : 0); },
  /* ED4E IM 0       * */ () => { setIM1(0); setIM2(0); },
  /* ED4F LD R,A       */ () => regs[R] = regs[A],

  /* ED50 IN D,(C)     */ () => IN_c(D),
  /* ED51 OUT (C),D    */ () => OUT_c(D),
  /* ED52 SBC HL,DE    */ () => SBC_HL(DE),
  /* ED53 LD (nn),DE   */ () => write88(next16(), regs[E], regs[D]),
  /* ED54 NEG        * */ NEG,
  /* ED55 RETN       * */ () => { pop16(PC); setIFF1(iff2 ? IFF1 : 0); },
  /* ED56 IM 1         */ () => { setIM1(IM1); setIM2(0); },
  /* ED57 LD A,I       */ () => ld_A_IR(regs[I]),
  /* ED58 IN E,(C)     */ () => IN_c(E),
  /* ED59 OUT (C),E    */ () => OUT_c(E),
  /* ED5A ADC HL,DE    */ () => ADC_HL(DE),
  /* ED5B LD DE,(nn)   */ () => { const addr = next16(); set88(DE, read(addr), read(addr + 1)); },
  /* ED5C NEG        * */ NEG,
  /* ED5D RETI       * */ () => { pop16(PC); setIFF1(iff2 ? IFF1 : 0); },
  /* ED5E IM 2         */ () => { setIM1(0); setIM2(IM2); },
  /* ED5F LD A,R       */ () => ld_A_IR(regs[R]),

  /* ED60 IN H,(C)     */ () => IN_c(H),
  /* ED61 OUT (C),H    */ () => OUT_c(H),
  /* ED62 SBC HL,HL    */ () => SBC_HL(HL),
  /* ED63 LD (nn),HL * */ () => write88(next16(), regs[L], regs[H]),
  /* ED64 NEG        * */ NEG,
  /* ED65 RETN       * */ () => { pop16(PC); setIFF1(iff2 ? IFF1 : 0); },
  /* ED66 IM 0       * */ () => { setIM1(0); setIM2(0); },
  /* ED67 RRD          */ RRD,
  /* ED68 IN L,(C)     */ () => IN_c(L),
  /* ED69 OUT (C),L    */ () => OUT_c(L),
  /* ED6A ADC HL,HL    */ () => ADC_HL(HL),
  /* ED6B LD HL,(nn) * */ () => { const addr = next16(); set88(HL, read(addr), read(addr + 1)); },
  /* ED6C NEG        * */ NEG,
  /* ED6D RETI       * */ () => { pop16(PC); setIFF1(iff2 ? IFF1 : 0); },
  /* ED6E IM 0       * */ () => { setIM1(0); setIM2(0); },
  /* ED6F RLD          */ RLD,

  /* ED70 IN (C)     * */ () => IN_c(),
  /* ED71 OUT (C),0  * */ () => OUT_c(),
  /* ED72 SBC HL,SP    */ () => SBC_HL(SP),
  /* ED73 LD (nn),SP   */ () => write88(next16(), regs[SPl], regs[SPh]),
  /* ED74 NEG        * */ NEG,
  /* ED75 RETN       * */ () => { pop16(PC); setIFF1(iff2 ? IFF1 : 0); },
  /* ED76 IM 1       * */ () => { setIM1(IM1); setIM2(0); },
  /* ED77 ---          */ nop,
  /* ED78 IN A,(C)     */ () => IN_c(A),
  /* ED79 OUT (C),A    */ () => OUT_c(A),
  /* ED7A ADC HL,SP    */ () => ADC_HL(SP),
  /* ED7B LD SP,(nn)   */ () => { const addr = next16(); set88(SP, read(addr), read(addr + 1)); },
  /* ED7C NEG        * */ NEG,
  /* ED7D RETI       * */ () => { pop16(PC); setIFF1(iff2 ? IFF1 : 0); },
  /* ED7E IM 2       * */ () => { setIM1(0); setIM2(IM2); },
  /* ED7F ---          */ nop,

  /* ED80 */ _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
  /* ED90 */ _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,

  /* EDA0 LDI         */ () => ldBlock(+1),
  /* EDA1 CPI         */ () => cpBlock(+1),
  /* EDA2 INI         */ () => inBlock(+1),
  /* EDA3 OUTI        */ () => outBlock(+1),
  /* EDA4 */ _, _, _, _,
  /* EDA8 LDD         */ () => ldBlock(-1),
  /* EDA9 CPD         */ () => cpBlock(-1),
  /* EDAA IND         */ () => inBlock(-1),
  /* EDAB OUTD        */ () => outBlock(-1),
  /* EDAC */ _, _, _, _,

  /* EDB0 LDIR        */ () => ldBlock(+1, 1),
  /* EDB1 CPIR        */ () => cpBlock(+1, 1),
  /* EDB2 INIR        */ () => inBlock(+1, 1),
  /* EDB3 OTIR        */ () => outBlock(+1, 1),
  /* EDB4 */ _, _, _, _,
  /* EDB8 LDDR        */ () => ldBlock(-1, 1),
  /* EDB9 CPDR        */ () => cpBlock(-1, 1),
  /* EDBA INDR        */ () => inBlock(-1, 1),
  /* EDBB OTDR        */ () => outBlock(-1, 1),
  /* EDBC */ _, _, _, _,

  /* EDC0 */ _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
  /* EDD0 */ _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
  /* EDE0 */ _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
  /* EDF0 */ _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
];
