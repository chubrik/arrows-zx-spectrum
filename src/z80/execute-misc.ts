import { CPD, CPDR, CPI, CPIR, LDD, LDDR, LDI, LDIR } from './op/op-block';
import { RETI, RETN } from './op/op-call';
import { IM } from './op/op-control';
import { IN_R_c, IND, INDR, INI, INIR, OTDR, OTIR, OUT_c_R, OUTD, OUTI } from './op/op-io';
import { LD_nn_SS, LD_SS_nn } from './op/op-load-16bit';
import { LD_A_I, LD_A_R, LD_I_A, LD_R_A } from './op/op-load-8bit';
import { ADC_HL_SS, SBC_HL_SS } from './op/op-math-16bit';
import { NEG } from './op/op-math-etc';
import { RLD, RRD } from './op/op-shift';
import { next8, refresh, splitOp } from './utils';

/** Misc. Instructions (ED) */
export function executeMisc() {
  refresh();
  const op = next8();
  const { b76, b543, b210 } = splitOp(op);

  if (b76 === 1) {
    if (b210 === 0) {
      if (b543 === 6) { /* TODO */ }
      else IN_R_c(b543);
    }
    else if (b210 === 1) {
      if (b543 === 6) { /* TODO */ }
      else OUT_c_R(b543);
    }
    else if (b210 === 2) {
      if (b543 & 1) ADC_HL_SS(b543 - 1);
      else SBC_HL_SS(b543);
    }
    else if (b210 === 3) {
      if (b543 & 1) LD_SS_nn(b543 - 1);
      else LD_nn_SS(b543);
    }
    else if (b210 === 7) {
      if (b543 === 0) LD_I_A();
      else if (b543 === 1) LD_R_A();
      else if (b543 === 2) LD_A_I();
      else if (b543 === 3) LD_A_R();
      else if (b543 === 4) RRD();
      else if (b543 === 5) RLD();
    }
    else {
      if (op === 0x44) NEG();
      else if (op === 0x45) RETN();
      else if (op === 0x4D) RETI();
      else if (op === 0x46) IM(0);
      else if (op === 0x56) IM(1);
      else if (op === 0x5E) IM(2);
    }
  }
  else {
    if (b543 & 1) {
      if (op === 0xA8) LDD();
      else if (op === 0xB8) LDDR();
      else if (op === 0xA9) CPD();
      else if (op === 0xB9) CPDR();
      else if (op === 0xAA) IND();
      else if (op === 0xBA) INDR();
      else if (op === 0xAB) OUTD();
      else if (op === 0xBB) OTDR();
    }
    else {
      if (op === 0xA0) LDI();
      else if (op === 0xB0) LDIR();
      else if (op === 0xA1) CPI();
      else if (op === 0xB1) CPIR();
      else if (op === 0xA2) INI();
      else if (op === 0xB2) INIR();
      else if (op === 0xA3) OUTI();
      else if (op === 0xB3) OTIR();
    }
  }
}
