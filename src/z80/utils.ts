import { cpu_mode, next8 } from "./cpu";
import { get16Core, getMemPos } from "./data";
import { Mode, Reg } from "./types";

export const RAM_MIN_ADDR = 0x4000;
export const RAM_MAX_ADDR = 0xFFFF;

export const poses: Position[] = [];

/** B, C, D, E, H, L, (HL/IX+d/IY+d), A */
export const Rhl: (() => Position)[] = [
    () => poses[Reg.B],
    () => poses[Reg.C],
    () => poses[Reg.D],
    () => poses[Reg.E],
    () => {
        return cpu_mode === Mode.IX ? poses[Reg.IXh]
            : cpu_mode === Mode.IY ? poses[Reg.IYh]
                : poses[Reg.H]
    },
    () => {
        return cpu_mode === Mode.IX ? poses[Reg.IXl]
            : cpu_mode === Mode.IY ? poses[Reg.IYl]
                : poses[Reg.L]
    },
    () => {
        let addr = get16Core(Rhl[4](), Rhl[5]()); // HL/IX/IY

        if (cpu_mode !== Mode.Main) {
            let d = next8();
            if (d >= 128) d -= 256;
            addr = (addr + d) & 0xFFFF;
        }
        return getMemPos(addr);
    },
    () => poses[Reg.A],
];

/** BC, DE, HL/IX/IY, AF */
export const QQ: (() => Position)[] = [
    () => poses[Reg.B],
    () => poses[Reg.C],
    () => poses[Reg.D],
    () => poses[Reg.E],
    () => Rhl[4](), // H/IXh/IYh
    () => Rhl[5](), // L/IXl/IYl
    () => poses[Reg.A],
    () => poses[Reg.F],
];

/** BC, DE, HL/IX/IY, SP */
export const SS: (() => Position)[] = [
    () => poses[Reg.B],
    () => poses[Reg.C],
    () => poses[Reg.D],
    () => poses[Reg.E],
    () => Rhl[4](), // H/IXh/IYh
    () => Rhl[5](), // L/IXl/IYl
    () => poses[Reg.SPh],
    () => poses[Reg.SPl],
];
