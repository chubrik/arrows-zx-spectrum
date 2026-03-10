import { get8, getMem8, set8 } from "./data";
import { Mode, Reg } from "./types";
import { poses } from "./utils";

export let cpu_cp = 0;
export let cpu_mode = Mode.Main;

export function setCpuCp(addr: number) {
    cpu_cp = addr & 0xFFFF;
}

export function copyCpu() {
    const topLeft = poses[Reg.F];
    const bottomRight = { x: topLeft.x + 15, y: topLeft.y + 15 };
    world.copyRegion(topLeft.x, topLeft.y, bottomRight.x, bottomRight.y, topLeft.x - 32, topLeft.y);
}

export function refresh() {
    const data = get8(Reg.R);
    const incremented = (data & 0x80) | ((data + 1) & 0x7F);
    set8(Reg.R, incremented);
}

export function interrupt() {

}

export function next8(): number {
    const data = getMem8(cpu_cp);
    setCpuCp(cpu_cp + 1);
    return data;
}

export function next16(): number {
    const lowData = next8();
    const highData = next8();
    return (highData << 8) | lowData;
}
