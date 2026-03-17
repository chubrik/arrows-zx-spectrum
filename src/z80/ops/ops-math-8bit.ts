import { get8, set8 } from '../../common/utils';
import { RhlSelect } from '../types';
import { f53, fC, fH, flagsSZ53, fN, fPV, fS, fZ, getA, getFC, getPosRhl, getRhl, next8, flagP, setA, setF } from '../utils';

/** ADD A,r | ADD A,(HL) | ADD A,(IX+d) | ADD A,(IY+d) */
export function ADD_A_Rhl(src: RhlSelect) {
  const operand = getRhl(src);
  add(operand, 0);
}

/** ADD A,n */
export function ADD_A_N() {
  const operand = next8();
  add(operand, 0);
}

/** ADC A,r | ADC A,(HL) | ADC A,(IX+d) | ADC A,(IY+d) */
export function ADC_A_Rhl(src: RhlSelect) {
  const operand = getRhl(src);
  const c = getFC();
  add(operand, c);
}

/** ADC A,n */
export function ADC_A_N() {
  const operand = next8();
  const c = getFC();
  add(operand, c);
}

/** SUB r | SUB (HL) | SUB (IX+d) | SUB (IY+d) */
export function SUB_Rhl(src: RhlSelect) {
  const operand = getRhl(src);
  sub(operand, 0);
}

/** SUB n */
export function SUB_N() {
  const operand = next8();
  sub(operand, 0);
}

/** SBC A,r | SBC A,(HL) | SBC A,(IX+d) | SBC A,(IY+d) */
export function SBC_Rhl(src: RhlSelect) {
  const operand = getRhl(src);
  const c = getFC();
  sub(operand, c);
}

/** SBC A,n */
export function SBC_N() {
  const operand = next8();
  const c = getFC();
  sub(operand, c);
}

/** AND r | AND (HL) | AND (IX+d) | AND (IY+d) */
export function AND_Rhl(src: RhlSelect) {
  const a = getA();
  const operand = getRhl(src);
  logic(a & operand, fH);
}

/** AND n */
export function AND_N() {
  const a = getA();
  const operand = next8();
  logic(a & operand, fH);
}

/** OR r | OR (HL) | OR (IX+d) | OR (IY+d) */
export function OR_Rhl(src: RhlSelect) {
  const a = getA();
  const operand = getRhl(src);
  logic(a | operand, 0);
}

/** OR n */
export function OR_N() {
  const a = getA();
  const operand = next8();
  logic(a | operand, 0);
}

/** XOR r | XOR (HL) | XOR (IX+d) | XOR (IY+d) */
export function XOR_Rhl(src: RhlSelect) {
  const a = getA();
  const operand = getRhl(src);
  logic(a ^ operand, 0);
}

/** XOR n */
export function XOR_N() {
  const a = getA();
  const operand = next8();
  logic(a ^ operand, 0);
}

/** CP r | CP (HL) | CP (IX+d) | CP (IY+d) */
export function CP_Rhl(src: RhlSelect) {
  const operand = getRhl(src);
  cp(operand);
}

/** CP n */
export function CP_N() {
  const operand = next8();
  cp(operand);
}

/** INC r | INC (HL) | INC (IX+d) | INC (IY+d) */
export function INC_Rhl(src: RhlSelect) {
  const pos = getPosRhl(src);
  const value = get8(pos);
  const result = (value + 1) & 0xFF;
  set8(pos, result);

  setF(
    flagsSZ53(result)
    | (!(result & 0x0F) ? fH : 0)
    | (value === 0x7F ? fPV : 0)
    | getFC()
  );
}

/** DEC r | DEC (HL) | DEC (IX+d) | DEC (IY+d) */
export function DEC_Rhl(src: RhlSelect) {
  const pos = getPosRhl(src);
  const value = get8(pos);
  const result = (value - 1) & 0xFF;
  set8(pos, result);

  setF(
    flagsSZ53(result)
    | (!(value & 0x0F) ? fH : 0)
    | (value === 0x80 ? fPV : 0)
    | getFC()
    | fN
  );
}

function add(operand: number, carry: number) {
  const a = getA();
  const sum = a + operand + carry;
  const result = sum & 0xFF;
  setA(result);

  setF(
    flagsSZ53(result)
    | ((a ^ operand ^ result) & fH)
    | (((a ^ ~operand) & (a ^ result) & 0x80) >> 5)
    | ((sum >> 8) & fC)
  );
}

function sub(operand: number, carry: number) {
  const a = getA();
  const diff = a - operand - carry;
  const result = diff & 0xFF;
  setA(result);

  setF(
    flagsSZ53(result)
    | ((a ^ operand ^ result) & fH)
    | (((a ^ operand) & (a ^ result) & 0x80) >> 5)
    | ((diff >> 8) & fC)
    | fN
  );
}

function cp(operand: number) {
  const a = getA();
  const diff = a - operand;
  const result = diff & 0xFF;

  setF(
    (result & fS) | (result ? 0 : fZ) | (operand & f53)
    | ((a ^ operand ^ result) & fH)
    | (((a ^ operand) & (a ^ result) & 0x80) >> 5)
    | ((diff >> 8) & fC)
    | fN
  );
}

function logic(result: number, h: number) {
  setA(result);
  setF(flagsSZ53(result) | flagP(result) | h);
}
