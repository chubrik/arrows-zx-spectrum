import { get8, set8 } from '../../common/utils';
import { RhlSelect } from '../types';
import { bitFC, bitFH, bitFN, bitFPV, bitFS, bitFZ, flagsSZ53, flagsSZ53P, getA, getFC, getPosRhl, getRhl, maskF53, next8, setA, setF } from '../utils';

/** ADD A,r | ADD A,(HL) | ADD A,(IX+d) | ADD A,(IY+d) */
export function ADD_A_Rhl(select: RhlSelect) {
  const operand = getRhl(select);
  add(operand, 0);
}

/** ADD A,n */
export function ADD_A_N() {
  const operand = next8();
  add(operand, 0);
}

/** ADC A,r | ADC A,(HL) | ADC A,(IX+d) | ADC A,(IY+d) */
export function ADC_A_Rhl(select: RhlSelect) {
  const operand = getRhl(select);
  const carry = getFC();
  add(operand, carry);
}

/** ADC A,n */
export function ADC_A_N() {
  const operand = next8();
  const carry = getFC();
  add(operand, carry);
}

/** SUB r | SUB (HL) | SUB (IX+d) | SUB (IY+d) */
export function SUB_Rhl(select: RhlSelect) {
  const operand = getRhl(select);
  sub(operand, 0);
}

/** SUB n */
export function SUB_N() {
  const operand = next8();
  sub(operand, 0);
}

/** SBC A,r | SBC A,(HL) | SBC A,(IX+d) | SBC A,(IY+d) */
export function SBC_A_Rhl(select: RhlSelect) {
  const operand = getRhl(select);
  const carry = getFC();
  sub(operand, carry);
}

/** SBC A,n */
export function SBC_A_N() {
  const operand = next8();
  const carry = getFC();
  sub(operand, carry);
}

/** AND r | AND (HL) | AND (IX+d) | AND (IY+d) */
export function AND_Rhl(select: RhlSelect) {
  const a = getA();
  const operand = getRhl(select);
  logic(a & operand, bitFH);
}

/** AND n */
export function AND_N() {
  const a = getA();
  const operand = next8();
  logic(a & operand, bitFH);
}

/** OR r | OR (HL) | OR (IX+d) | OR (IY+d) */
export function OR_Rhl(select: RhlSelect) {
  const a = getA();
  const operand = getRhl(select);
  logic(a | operand, 0);
}

/** OR n */
export function OR_N() {
  const a = getA();
  const operand = next8();
  logic(a | operand, 0);
}

/** XOR r | XOR (HL) | XOR (IX+d) | XOR (IY+d) */
export function XOR_Rhl(select: RhlSelect) {
  const a = getA();
  const operand = getRhl(select);
  logic(a ^ operand, 0);
}

/** XOR n */
export function XOR_N() {
  const a = getA();
  const operand = next8();
  logic(a ^ operand, 0);
}

/** CP r | CP (HL) | CP (IX+d) | CP (IY+d) */
export function CP_Rhl(select: RhlSelect) {
  const operand = getRhl(select);
  cp(operand);
}

/** CP n */
export function CP_N() {
  const operand = next8();
  cp(operand);
}

/** INC r | INC (HL) | INC (IX+d) | INC (IY+d) */
export function INC_Rhl(select: RhlSelect) {
  const pos = getPosRhl(select);
  const value = get8(pos);
  const result = (value + 1) & 0xFF;
  set8(pos, result);

  setF(
    flagsSZ53(result)
    | (!(result & 0x0F) ? bitFH : 0)
    | (value === 0x7F ? bitFPV : 0)
    | getFC()
  );
}

/** DEC r | DEC (HL) | DEC (IX+d) | DEC (IY+d) */
export function DEC_Rhl(select: RhlSelect) {
  const pos = getPosRhl(select);
  const value = get8(pos);
  const result = (value - 1) & 0xFF;
  set8(pos, result);

  setF(
    flagsSZ53(result)
    | (!(value & 0x0F) ? bitFH : 0)
    | (value === 0x80 ? bitFPV : 0)
    | getFC()
    | bitFN
  );
}

function add(operand: number, carry: number) {
  const a = getA();
  const sum = a + operand + carry;
  const result = sum & 0xFF;
  setA(result);

  setF(
    flagsSZ53(result)
    | ((a ^ operand ^ result) & bitFH)
    | (((a ^ ~operand) & (a ^ result) & 0x80) >> 5)
    | ((sum >> 8) & bitFC)
  );
}

function sub(operand: number, carry: number) {
  const a = getA();
  const diff = a - operand - carry;
  const result = diff & 0xFF;
  setA(result);

  setF(
    flagsSZ53(result)
    | ((a ^ operand ^ result) & bitFH)
    | (((a ^ operand) & (a ^ result) & 0x80) >> 5)
    | ((diff >> 8) & bitFC)
    | bitFN
  );
}

function cp(operand: number) {
  const a = getA();
  const diff = a - operand;
  const result = diff & 0xFF;

  setF(
    (result & bitFS) | (result ? 0 : bitFZ) | (operand & maskF53)
    | ((a ^ operand ^ result) & bitFH)
    | (((a ^ operand) & (a ^ result) & 0x80) >> 5)
    | ((diff >> 8) & bitFC)
    | bitFN
  );
}

function logic(result: number, fH: number) {
  setA(result);
  setF(flagsSZ53P(result) | fH);
}
