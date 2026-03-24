import { executeBit } from './execute-bit';
import { executeMisc } from './execute-misc';
import { CALL_cc_NN, CALL_NN, RET, RET_cc, RST_p } from './op/op-call';
import { DI, EI, HALT, NOP } from './op/op-control';
import { EX_AF_AF, EX_DE_HL, EX_sp_HL, EXX } from './op/op-exchange';
import { IN_A_n, OUT_n_A } from './op/op-io';
import { DJNZ_e, JP_cc_NN, JP_hl, JP_NN, JR_cc_e, JR_e } from './op/op-jump';
import { LD_nn_SS, LD_SP_HL, LD_SS_nn, LD_SS_NN, POP_QQ, PUSH_QQ } from './op/op-load-16bit';
import { LD_A_bc, LD_A_de, LD_A_nn, LD_bc_A, LD_de_A, LD_nn_A, LD_Rhl_N, LD_Rhl_Rhl } from './op/op-load-8bit';
import { ADD_HL_SS, DEC_SS, INC_SS } from './op/op-math-16bit';
import { ADC_A_N, ADC_A_Rhl, ADD_A_N, ADD_A_Rhl, AND_N, AND_Rhl, CP_N, CP_Rhl, DEC_Rhl, INC_Rhl, OR_N, OR_Rhl, SBC_A_N, SBC_A_Rhl, SUB_N, SUB_Rhl, XOR_N, XOR_Rhl } from './op/op-math-8bit';
import { CCF, CPL, DAA, SCF } from './op/op-math-etc';
import { RLA, RLCA, RRA, RRCA } from './op/op-shift';
import { HLMode, SSSelect } from './types';
import { getHalt, next8, refresh, setHLMode } from './utils';

/** Main Instructions | IX Instructions (DD) | IY Instructions (FD) */
export function executeMain() {
  refresh();
  if (getHalt()) return;
  const op = next8();
  const b76 = op >> 6;
  const b543 = (op >> 3) & 0x7;
  const b210 = op & 0x7;

  if (b76 === 0) {
    if (b210 === 0) {
      if (b543 === 0) NOP();
      else if (b543 === 1) EX_AF_AF();
      else if (b543 === 2) DJNZ_e();
      else if (b543 === 3) JR_e();
      else JR_cc_e(b543 - 4);
    }
    else if (b210 === 1) {
      if (b543 & 1) ADD_HL_SS(b543 - 1);
      else LD_SS_NN(b543);
    }
    else if (b210 === 2) {
      if (b543 === 0) LD_bc_A();
      else if (b543 === 1) LD_A_bc();
      else if (b543 === 2) LD_de_A();
      else if (b543 === 3) LD_A_de();
      else if (b543 === 4) LD_nn_SS(SSSelect.HL);
      else if (b543 === 5) LD_SS_nn(SSSelect.HL);
      else if (b543 === 6) LD_nn_A();
      else LD_A_nn();
    }
    else if (b210 === 3) {
      if (b543 & 1) DEC_SS(b543 - 1);
      else INC_SS(b543);
    }
    else if (b210 === 4) {
      INC_Rhl(b543);
    }
    else if (b210 === 5) {
      DEC_Rhl(b543);
    }
    else if (b210 === 6) {
      LD_Rhl_N(b543);
    }
    else {
      if (b543 === 0) RLCA();
      else if (b543 === 1) RRCA();
      else if (b543 === 2) RLA();
      else if (b543 === 3) RRA();
      else if (b543 === 4) DAA();
      else if (b543 === 5) CPL();
      else if (b543 === 6) SCF();
      else CCF();
    }
  }
  else if (b76 === 1) {
    if (op === 0x76) HALT();
    else LD_Rhl_Rhl(b543, b210);
  }
  else if (b76 === 2) {
    if (b543 === 0) ADD_A_Rhl(b210);
    else if (b543 === 1) ADC_A_Rhl(b210);
    else if (b543 === 2) SUB_Rhl(b210);
    else if (b543 === 3) SBC_A_Rhl(b210);
    else if (b543 === 4) AND_Rhl(b210);
    else if (b543 === 5) XOR_Rhl(b210);
    else if (b543 === 6) OR_Rhl(b210);
    else CP_Rhl(b210);
  }
  else {
    if (b210 === 0) {
      RET_cc(b543);
    }
    else if (b210 === 1) {
      if (b543 === 1) RET();
      else if (b543 === 3) EXX();
      else if (b543 === 5) JP_hl();
      else if (b543 === 7) LD_SP_HL();
      else POP_QQ(b543);
    }
    else if (b210 === 2) {
      JP_cc_NN(b543);
    }
    else if (b210 === 3) {
      if (b543 === 0) JP_NN();
      else if (b543 === 1) executeBit();
      else if (b543 === 2) OUT_n_A();
      else if (b543 === 3) IN_A_n();
      else if (b543 === 4) EX_sp_HL();
      else if (b543 === 5) EX_DE_HL();
      else if (b543 === 6) DI();
      else EI();
    }
    else if (b210 === 4) {
      CALL_cc_NN(b543);
    }
    else if (b210 === 5) {
      if (b543 === 1) {
        CALL_NN();
      }
      else if (b543 === 3) {
        setHLMode(HLMode.IX);
        executeMain();
        setHLMode(HLMode.HL);
      }
      else if (b543 === 5) {
        executeMisc();
      }
      else if (b543 === 7) {
        setHLMode(HLMode.IY);
        executeMain();
        setHLMode(HLMode.HL);
      }
      else {
        PUSH_QQ(b543);
      }
    }
    else if (b210 === 6) {
      if (b543 === 0) ADD_A_N();
      else if (b543 === 1) ADC_A_N();
      else if (b543 === 2) SUB_N();
      else if (b543 === 3) SBC_A_N();
      else if (b543 === 4) AND_N();
      else if (b543 === 5) XOR_N();
      else if (b543 === 6) OR_N();
      else CP_N();
    }
    else {
      RST_p(b543);
    }
  }
}
