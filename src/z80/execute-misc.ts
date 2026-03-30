import { get, set } from '../common/utils';
import { sf } from './flags';
import { cpx, ldx } from './op/op-block';
import { IN_c, inx, OUT_c, outx } from './op/op-io';
import { LD_A_I, LD_A_R } from './op/op-load-8bit';
import { ADC_HL, LD_dd_nn, LD_nn_dd, SBC_HL } from './op/op-math-16bit';
import { NEG } from './op/op-math-etc';
import { RLD, RRD } from './op/op-shift';
import { RETI_RETN } from './op/op-stack';
import { A, B, BC, C, D, DE, E, H, HL, I, L, R, SP } from './registers';
import { nop as _, next, nop, refresh } from './utils';

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
  /* ED43 LD (nn),BC   */ () => LD_nn_dd(BC),
  /* ED44 NEG          */ NEG,
  /* ED45 RETN         */ RETI_RETN,
  /* ED46 IM 0         */ () => { sf.im1 = 0; sf.im2 = 0; },
  /* ED47 LD I,A       */ () => set(I, get(A)),
  /* ED48 IN C,(C)     */ () => IN_c(C),
  /* ED49 OUT (C),C    */ () => OUT_c(C),
  /* ED4A ADC HL,BC    */ () => ADC_HL(BC),
  /* ED4B LD BC,(nn)   */ () => LD_dd_nn(BC),
  /* ED4C NEG        * */ NEG,
  /* ED4D RETI         */ RETI_RETN,
  /* ED4E IM 0       * */ () => { sf.im1 = 0; sf.im2 = 0; },
  /* ED4F LD R,A       */ () => set(R, get(A)),

  /* ED50 IN D,(C)     */ () => IN_c(D),
  /* ED51 OUT (C),D    */ () => OUT_c(D),
  /* ED52 SBC HL,DE    */ () => SBC_HL(DE),
  /* ED53 LD (nn),DE   */ () => LD_nn_dd(DE),
  /* ED54 NEG        * */ NEG,
  /* ED55 RETN       * */ RETI_RETN,
  /* ED56 IM 1         */ () => { sf.im1 = 0x10; sf.im2 = 0; },
  /* ED57 LD A,I       */ LD_A_I,
  /* ED58 IN E,(C)     */ () => IN_c(E),
  /* ED59 OUT (C),E    */ () => OUT_c(E),
  /* ED5A ADC HL,DE    */ () => ADC_HL(DE),
  /* ED5B LD DE,(nn)   */ () => LD_dd_nn(DE),
  /* ED5C NEG        * */ NEG,
  /* ED5D RETI       * */ RETI_RETN,
  /* ED5E IM 2         */ () => { sf.im1 = 0; sf.im2 = 0x20; },
  /* ED5F LD A,R       */ LD_A_R,

  /* ED60 IN H,(C)     */ () => IN_c(H),
  /* ED61 OUT (C),H    */ () => OUT_c(H),
  /* ED62 SBC HL,HL    */ () => SBC_HL(HL),
  /* ED63 LD (nn),HL * */ () => LD_nn_dd(HL),
  /* ED64 NEG        * */ NEG,
  /* ED65 RETN       * */ RETI_RETN,
  /* ED66 IM 0       * */ () => { sf.im1 = 0; sf.im2 = 0; },
  /* ED67 RRD          */ RRD,
  /* ED68 IN L,(C)     */ () => IN_c(L),
  /* ED69 OUT (C),L    */ () => OUT_c(L),
  /* ED6A ADC HL,HL    */ () => ADC_HL(HL),
  /* ED6B LD HL,(nn) * */ () => LD_dd_nn(HL),
  /* ED6C NEG        * */ NEG,
  /* ED6D RETI       * */ RETI_RETN,
  /* ED6E IM 0       * */ () => { sf.im1 = 0; sf.im2 = 0; },
  /* ED6F RLD          */ RLD,

  /* ED70 IN (C)     * */ () => IN_c(0),
  /* ED71 OUT (C),0  * */ () => OUT_c(0),
  /* ED72 SBC HL,SP    */ () => SBC_HL(SP),
  /* ED73 LD (nn),SP   */ () => LD_nn_dd(SP),
  /* ED74 NEG        * */ NEG,
  /* ED75 RETN       * */ RETI_RETN,
  /* ED76 IM 1       * */ () => { sf.im1 = 0x10; sf.im2 = 0; },
  /* ED77 ---          */ nop,
  /* ED78 IN A,(C)     */ () => IN_c(A),
  /* ED79 OUT (C),A    */ () => OUT_c(A),
  /* ED7A ADC HL,SP    */ () => ADC_HL(SP),
  /* ED7B LD SP,(nn)   */ () => LD_dd_nn(SP),
  /* ED7C NEG        * */ NEG,
  /* ED7D RETI       * */ RETI_RETN,
  /* ED7E IM 2       * */ () => { sf.im1 = 0; sf.im2 = 0x20; },
  /* ED7F ---          */ nop,

  /* ED80 */ _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
  /* ED90 */ _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,

  /* EDA0 LDI         */ () => ldx(+1),
  /* EDA1 CPI         */ () => cpx(+1),
  /* EDA2 INI         */ () => inx(+1),
  /* EDA3 OUTI        */ () => outx(+1),
  /* EDA4 */ _, _, _, _,
  /* EDA8 LDD         */ () => ldx(-1),
  /* EDA9 CPD         */ () => cpx(-1),
  /* EDAA IND         */ () => inx(-1),
  /* EDAB OUTD        */ () => outx(-1),
  /* EDAC */ _, _, _, _,

  /* EDB0 LDIR        */ () => ldx(+1, 1),
  /* EDB1 CPIR        */ () => cpx(+1, 1),
  /* EDB2 INIR        */ () => inx(+1, 1),
  /* EDB3 OTIR        */ () => outx(+1, 1),
  /* EDB4 */ _, _, _, _,
  /* EDB8 LDDR        */ () => ldx(-1, 1),
  /* EDB9 CPDR        */ () => cpx(-1, 1),
  /* EDBA INDR        */ () => inx(-1, 1),
  /* EDBB OTDR        */ () => outx(-1, 1),
  /* EDBC */ _, _, _, _,

  /* EDC0 */ _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
  /* EDD0 */ _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
  /* EDE0 */ _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
  /* EDF0 */ _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
];
