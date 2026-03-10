import { get16Core, getMem16, set16Core, setMem16 } from "../../common/data";
import { Reg } from "../../common/types";
import { poses } from "../../common/utils";
import { next16 } from "../cpu";
import { SS } from "../utils";

/** LD (nn),dd | LD (nn),HL | LD (nn),IX | LD (nn),IY */
export function LD_nn_SS(b543: number) {
    const destAddr = next16();
    const srcHighPos = SS[b543]();
    const srcLowPos = SS[b543 + 1]();
    const data = get16Core(srcHighPos, srcLowPos);
    setMem16(destAddr, data);
}

/** LD dd,(nn) | LD HL,(nn) | LD IX,(nn) | LD IY,(nn) */
export function LD_SS_nn(b543: number) {
    const highDest = SS[b543]();
    const lowDest = SS[b543 + 1]();
    const srcAddr = next16();
    const data = getMem16(srcAddr);
    set16Core(highDest, lowDest, data);
}

/** LD dd,nn | LD IX,nn | LD IY,nn */
export function LD_SS_NN(b543: number) {
    const highDest = SS[b543]();
    const lowDest = SS[b543 + 1]();
    const n = next16();
    set16Core(highDest, lowDest, n);
}

/** LD SP,HL | LD SP,IX | LD SP,IY */
export function LD_SP_HL() {
    const data = get16Core(poses[Reg.H], poses[Reg.L]);
    set16Core(poses[Reg.SPh], poses[Reg.SPl], data);
}
