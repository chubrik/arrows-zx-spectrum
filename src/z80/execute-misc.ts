import { xFF } from '../hw/constants';
import { mem, write16 } from '../hw/mem-state';
import { writePort } from '../hw/ports';
import { IFF1, iff2, IM1, IM2, setIFF1, setIM1, setIM2 } from './flags';
import { RLD, RRD } from './op/op-bit';
import { CP_block, IN_block, LD_block, OUT_block } from './op/op-block';
import { in_port, ld_A_IR } from './op/op-etc';
import { ADC_HL, SBC_HL } from './op/op-math-16bit';
import { NEG } from './op/op-math-etc';
import { RET } from './op/op-stack';
import { a, b, c, d, e, getBC, getDE, getH, getHL, getL, getR, i, refresh, setA, setB, setC, setD, setE, setH, setI, setL, setR, setSP, sp } from './registers';
import { nop as _, next, next16, nop } from './utils';

export function executeMisc() {
  refresh();
  opsMisc[next()]();
}

const opsMisc = [
  /* ED00 */ _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
  /* ED10 */ _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
  /* ED20 */ _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
  /* ED30 */ _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,

  /* ED40 IN B,(C)     */ () => setB(in_port()),
  /* ED41 OUT (C),B    */ () => writePort(c, b, b),
  /* ED42 SBC HL,BC    */ () => SBC_HL(getBC()),
  /* ED43 LD (nn),BC   */ () => write16(next16(), c, b),
  /* ED44 NEG          */ NEG,
  /* ED45 RETN         */ () => { RET(); setIFF1(iff2 ? IFF1 : 0); },
  /* ED46 IM 0         */ () => { setIM1(0); setIM2(0); },
  /* ED47 LD I,A       */ () => setI(a),
  /* ED48 IN C,(C)     */ () => setC(in_port()),
  /* ED49 OUT (C),C    */ () => writePort(c, b, c),
  /* ED4A ADC HL,BC    */ () => ADC_HL(getBC()),
  /* ED4B LD BC,(nn)   */ () => { const nn = next16(); setC(mem[nn]); setB(mem[nn + 1]); },
  /* ED4C NEG        * */ NEG,
  /* ED4D RETI         */ () => { RET(); setIFF1(iff2 ? IFF1 : 0); },
  /* ED4E IM 0       * */ () => { setIM1(0); setIM2(0); },
  /* ED4F LD R,A       */ () => setR(a),

  /* ED50 IN D,(C)     */ () => setD(in_port()),
  /* ED51 OUT (C),D    */ () => writePort(c, b, d),
  /* ED52 SBC HL,DE    */ () => SBC_HL(getDE()),
  /* ED53 LD (nn),DE   */ () => write16(next16(), e, d),
  /* ED54 NEG        * */ NEG,
  /* ED55 RETN       * */ () => { RET(); setIFF1(iff2 ? IFF1 : 0); },
  /* ED56 IM 1         */ () => { setIM1(IM1); setIM2(0); },
  /* ED57 LD A,I       */ () => ld_A_IR(i),
  /* ED58 IN E,(C)     */ () => setE(in_port()),
  /* ED59 OUT (C),E    */ () => writePort(c, b, e),
  /* ED5A ADC HL,DE    */ () => ADC_HL(getDE()),
  /* ED5B LD DE,(nn)   */ () => { const nn = next16(); setE(mem[nn]); setD(mem[nn + 1]); },
  /* ED5C NEG        * */ NEG,
  /* ED5D RETI       * */ () => { RET(); setIFF1(iff2 ? IFF1 : 0); },
  /* ED5E IM 2         */ () => { setIM1(0); setIM2(IM2); },
  /* ED5F LD A,R       */ () => ld_A_IR(getR()),

  /* ED60 IN H,(C)     */ () => setH(in_port()),
  /* ED61 OUT (C),H    */ () => writePort(c, b, getH()),
  /* ED62 SBC HL,HL    */ () => SBC_HL(getHL()),
  /* ED63 LD (nn),HL * */ () => write16(next16(), getL(), getH()),
  /* ED64 NEG        * */ NEG,
  /* ED65 RETN       * */ () => { RET(); setIFF1(iff2 ? IFF1 : 0); },
  /* ED66 IM 0       * */ () => { setIM1(0); setIM2(0); },
  /* ED67 RRD          */ RRD,
  /* ED68 IN L,(C)     */ () => setL(in_port()),
  /* ED69 OUT (C),L    */ () => writePort(c, b, getL()),
  /* ED6A ADC HL,HL    */ () => ADC_HL(getHL()),
  /* ED6B LD HL,(nn) * */ () => { const nn = next16(); setL(mem[nn]); setH(mem[nn + 1]); },
  /* ED6C NEG        * */ NEG,
  /* ED6D RETI       * */ () => { RET(); setIFF1(iff2 ? IFF1 : 0); },
  /* ED6E IM 0       * */ () => { setIM1(0); setIM2(0); },
  /* ED6F RLD          */ RLD,

  /* ED70 IN (C)     * */ () => { in_port(); },
  /* ED71 OUT (C),0  * */ () => writePort(c, b, 0), // NMOS: 0, CMOS: 255 (undocumented)
  /* ED72 SBC HL,SP    */ () => SBC_HL(sp),
  /* ED73 LD (nn),SP   */ () => write16(next16(), sp & xFF, sp >> 8),
  /* ED74 NEG        * */ NEG,
  /* ED75 RETN       * */ () => { RET(); setIFF1(iff2 ? IFF1 : 0); },
  /* ED76 IM 1       * */ () => { setIM1(IM1); setIM2(0); },
  /* ED77 ---          */ nop,
  /* ED78 IN A,(C)     */ () => setA(in_port()),
  /* ED79 OUT (C),A    */ () => writePort(c, b, a),
  /* ED7A ADC HL,SP    */ () => ADC_HL(sp),
  /* ED7B LD SP,(nn)   */ () => { const nn = next16(); setSP(mem[nn] | (mem[nn + 1] << 8)); },
  /* ED7C NEG        * */ NEG,
  /* ED7D RETI       * */ () => { RET(); setIFF1(iff2 ? IFF1 : 0); },
  /* ED7E IM 2       * */ () => { setIM1(0); setIM2(IM2); },
  /* ED7F ---          */ nop,

  /* ED80 */ _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
  /* ED90 */ _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,

  /* EDA0 LDI         */ () => LD_block(1),
  /* EDA1 CPI         */ () => CP_block(1),
  /* EDA2 INI         */ () => IN_block(+1),
  /* EDA3 OUTI        */ () => OUT_block(+1),
  /* EDA4 */ _, _, _, _,
  /* EDA8 LDD         */ () => LD_block(0),
  /* EDA9 CPD         */ () => CP_block(0),
  /* EDAA IND         */ () => IN_block(-1),
  /* EDAB OUTD        */ () => OUT_block(-1),
  /* EDAC */ _, _, _, _,

  /* EDB0 LDIR        */ () => LD_block(1, 1),
  /* EDB1 CPIR        */ () => CP_block(1, 1),
  /* EDB2 INIR        */ () => IN_block(+1, 1),
  /* EDB3 OTIR        */ () => OUT_block(+1, 1),
  /* EDB4 */ _, _, _, _,
  /* EDB8 LDDR        */ () => LD_block(0, 1),
  /* EDB9 CPDR        */ () => CP_block(0, 1),
  /* EDBA INDR        */ () => IN_block(-1, 1),
  /* EDBB OTDR        */ () => OUT_block(-1, 1),
  /* EDBC */ _, _, _, _,

  /* EDC0 */ _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
  /* EDD0 */ _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
  /* EDE0 */ _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
  /* EDF0 */ _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
];
