import { CCF, CPL, DAA, HALT, NOP, SCF } from './ops/ops-control';
import { EX_AF } from './ops/ops-ex';
import { DJNZ, JR, JR_c, JR_nc, JR_nz, JR_z } from './ops/ops-jump';
import { LD_nn_SS, LD_SS_nn, LD_SS_NN } from './ops/ops-ld-16bit';
import { LD_A_bc, LD_A_de, LD_A_nn, LD_bc_A, LD_de_A, LD_nn_A, LD_Rhl_N, LD_Rhl_Rhl } from './ops/ops-ld-8bit';
import { ADC_A_Rhl, ADD_A_Rhl, CP_Rhl, DEC_Rhl, INC_Rhl, OR_Rhl, SBC_Rhl, SUB_Rhl, XOR_Rhl } from './ops/ops-math-8bit';
import { RLA, RLCA, RRA, RRCA } from './ops/ops-shift';
import { SSSelect } from './types';
import { commitRegs, fetchRegs, getRegHlt, nextPC8, refresh } from './utils';

export function process() {
  copyCPU();
  fetchRegs();
  refresh();

  if (!getRegHlt())
    executeMain();

  commitRegs();
  interrupt();
}

export function executeMain() {
  const op = nextPC8();
  const b76 = op >> 6;
  const b543 = (op >> 3) & 0x07;
  const b210 = op & 0x07;

  if (b76 === 0) {
    if (b210 === 0) {
      if (b543 === 0) NOP();
      else if (b543 === 1) EX_AF();
      else if (b543 === 2) DJNZ();
      else if (b543 === 3) JR();
      else if (b543 === 4) JR_nz();
      else if (b543 === 5) JR_z();
      else if (b543 === 6) JR_nc();
      else JR_c();
    }
    else if (b210 === 1) {
      if (b543 % 2) { /* TODO */ }
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
      if (b543 % 2) { /* TODO */ }
      else { /* TODO */ }
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
    else if (b210 === 7) {
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
    else if (b543 === 3) SBC_Rhl(b210);
    else if (b543 === 4) { /* TODO */ }
    else if (b543 === 5) XOR_Rhl(b210);
    else if (b543 === 6) OR_Rhl(b210);
    else CP_Rhl(b210);
  }
  else {
    if (b210 === 0) { /* TODO */ }
    else if (b210 === 1) { /* TODO */ }
    else if (b210 === 2) { /* TODO */ }
    else if (b210 === 3) { /* TODO */ }
    else if (b210 === 4) { /* TODO */ }
    else if (b210 === 5) { /* TODO */ }
    else if (b210 === 6) { /* TODO */ }
    else { /* TODO */ }
  }
}

function copyCPU() {
  //todo
  // const topLeft = { x: 0, y: 0 };
  // const bottomRight = { x: topLeft.x + 15, y: topLeft.y + 15 };
  // world.copyRegion(topLeft.x, topLeft.y, bottomRight.x, bottomRight.y, topLeft.x - 32, topLeft.y);
}

function interrupt() {
  //todo
}
