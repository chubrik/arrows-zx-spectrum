import { xFF } from '../common/constants';
import { mem, write88 } from '../common/memory';
import { writePort } from '../common/ports';
import { IFF1, iff2, IM1, IM2, setIFF1, setIM1, setIM2 } from './flags';
import { RLD, RRD } from './op/op-bit';
import { CP_block, IN_block, LD_block, OUT_block } from './op/op-block';
import { IN_c, ld_A_IR } from './op/op-etc';
import { ADC_HL, SBC_HL } from './op/op-math-16bit';
import { NEG } from './op/op-math-etc';
import { RET } from './op/op-stack';
import { A, B, BC, C, cpu, D, DE, E, get16, H, HL, I, L, packR, refresh, set88, setSP, sp, unpackR } from './registers';
import { nop as _, next, next16, nop } from './utils';

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
  /* ED41 OUT (C),B    */ () => writePort(cpu[C], cpu[B], cpu[B]),
  /* ED42 SBC HL,BC    */ () => SBC_HL(get16(BC)),
  /* ED43 LD (nn),BC   */ () => write88(next16(), cpu[C], cpu[B]),
  /* ED44 NEG          */ NEG,
  /* ED45 RETN         */ () => { RET(); setIFF1(iff2 ? IFF1 : 0); },
  /* ED46 IM 0         */ () => { setIM1(0); setIM2(0); },
  /* ED47 LD I,A       */ () => cpu[I] = cpu[A],
  /* ED48 IN C,(C)     */ () => IN_c(C),
  /* ED49 OUT (C),C    */ () => writePort(cpu[C], cpu[B], cpu[C]),
  /* ED4A ADC HL,BC    */ () => ADC_HL(get16(BC)),
  /* ED4B LD BC,(nn)   */ () => { const addr = next16(); set88(BC, mem[addr], mem[addr + 1]); },
  /* ED4C NEG        * */ NEG,
  /* ED4D RETI         */ () => { RET(); setIFF1(iff2 ? IFF1 : 0); },
  /* ED4E IM 0       * */ () => { setIM1(0); setIM2(0); },
  /* ED4F LD R,A       */ () => unpackR(cpu[A]),

  /* ED50 IN D,(C)     */ () => IN_c(D),
  /* ED51 OUT (C),D    */ () => writePort(cpu[C], cpu[B], cpu[D]),
  /* ED52 SBC HL,DE    */ () => SBC_HL(get16(DE)),
  /* ED53 LD (nn),DE   */ () => write88(next16(), cpu[E], cpu[D]),
  /* ED54 NEG        * */ NEG,
  /* ED55 RETN       * */ () => { RET(); setIFF1(iff2 ? IFF1 : 0); },
  /* ED56 IM 1         */ () => { setIM1(IM1); setIM2(0); },
  /* ED57 LD A,I       */ () => ld_A_IR(cpu[I]),
  /* ED58 IN E,(C)     */ () => IN_c(E),
  /* ED59 OUT (C),E    */ () => writePort(cpu[C], cpu[B], cpu[E]),
  /* ED5A ADC HL,DE    */ () => ADC_HL(get16(DE)),
  /* ED5B LD DE,(nn)   */ () => { const addr = next16(); set88(DE, mem[addr], mem[addr + 1]); },
  /* ED5C NEG        * */ NEG,
  /* ED5D RETI       * */ () => { RET(); setIFF1(iff2 ? IFF1 : 0); },
  /* ED5E IM 2         */ () => { setIM1(0); setIM2(IM2); },
  /* ED5F LD A,R       */ () => ld_A_IR(packR()),

  /* ED60 IN H,(C)     */ () => IN_c(H),
  /* ED61 OUT (C),H    */ () => writePort(cpu[C], cpu[B], cpu[H]),
  /* ED62 SBC HL,HL    */ () => SBC_HL(get16(HL)),
  /* ED63 LD (nn),HL * */ () => write88(next16(), cpu[L], cpu[H]),
  /* ED64 NEG        * */ NEG,
  /* ED65 RETN       * */ () => { RET(); setIFF1(iff2 ? IFF1 : 0); },
  /* ED66 IM 0       * */ () => { setIM1(0); setIM2(0); },
  /* ED67 RRD          */ RRD,
  /* ED68 IN L,(C)     */ () => IN_c(L),
  /* ED69 OUT (C),L    */ () => writePort(cpu[C], cpu[B], cpu[L]),
  /* ED6A ADC HL,HL    */ () => ADC_HL(get16(HL)),
  /* ED6B LD HL,(nn) * */ () => { const addr = next16(); set88(HL, mem[addr], mem[addr + 1]); },
  /* ED6C NEG        * */ NEG,
  /* ED6D RETI       * */ () => { RET(); setIFF1(iff2 ? IFF1 : 0); },
  /* ED6E IM 0       * */ () => { setIM1(0); setIM2(0); },
  /* ED6F RLD          */ RLD,

  /* ED70 IN (C)     * */ () => IN_c(),
  /* ED71 OUT (C),0  * */ () => writePort(cpu[C], cpu[B], 0), // NMOS: 0, CMOS: 255 (undocumented)
  /* ED72 SBC HL,SP    */ () => SBC_HL(sp),
  /* ED73 LD (nn),SP   */ () => write88(next16(), sp & xFF, sp >> 8),
  /* ED74 NEG        * */ NEG,
  /* ED75 RETN       * */ () => { RET(); setIFF1(iff2 ? IFF1 : 0); },
  /* ED76 IM 1       * */ () => { setIM1(IM1); setIM2(0); },
  /* ED77 ---          */ nop,
  /* ED78 IN A,(C)     */ () => IN_c(A),
  /* ED79 OUT (C),A    */ () => writePort(cpu[C], cpu[B], cpu[A]),
  /* ED7A ADC HL,SP    */ () => ADC_HL(sp),
  /* ED7B LD SP,(nn)   */ () => { const addr = next16(); setSP(mem[addr] | (mem[addr + 1] << 8)); },
  /* ED7C NEG        * */ NEG,
  /* ED7D RETI       * */ () => { RET(); setIFF1(iff2 ? IFF1 : 0); },
  /* ED7E IM 2       * */ () => { setIM1(0); setIM2(IM2); },
  /* ED7F ---          */ nop,

  /* ED80 */ _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
  /* ED90 */ _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,

  /* EDA0 LDI         */ () => LD_block(+1),
  /* EDA1 CPI         */ () => CP_block(+1),
  /* EDA2 INI         */ () => IN_block(+1),
  /* EDA3 OUTI        */ () => OUT_block(+1),
  /* EDA4 */ _, _, _, _,
  /* EDA8 LDD         */ () => LD_block(-1),
  /* EDA9 CPD         */ () => CP_block(-1),
  /* EDAA IND         */ () => IN_block(-1),
  /* EDAB OUTD        */ () => OUT_block(-1),
  /* EDAC */ _, _, _, _,

  /* EDB0 LDIR        */ () => LD_block(+1, 1),
  /* EDB1 CPIR        */ () => CP_block(+1, 1),
  /* EDB2 INIR        */ () => IN_block(+1, 1),
  /* EDB3 OTIR        */ () => OUT_block(+1, 1),
  /* EDB4 */ _, _, _, _,
  /* EDB8 LDDR        */ () => LD_block(-1, 1),
  /* EDB9 CPDR        */ () => CP_block(-1, 1),
  /* EDBA INDR        */ () => IN_block(-1, 1),
  /* EDBB OTDR        */ () => OUT_block(-1, 1),
  /* EDBC */ _, _, _, _,

  /* EDC0 */ _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
  /* EDD0 */ _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
  /* EDE0 */ _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
  /* EDF0 */ _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
];
