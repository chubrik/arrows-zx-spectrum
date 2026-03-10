import { Reg } from "./types";
import { config, poses } from "./utils";

export function get16(highReg: Reg, lowReg: Reg): number {
    return get16Core(poses[highReg], poses[lowReg]);
}

export function set16(highReg: Reg, lowReg: Reg, data: number) {
    set16Core(poses[highReg], poses[lowReg], data);
}

export function get8(reg: Reg): number {
    return get8Core(poses[reg]);
}

export function set8(reg: Reg, data: number) {
    set8Core(poses[reg], data);
}

export function get1(reg: Reg): boolean {
    return get1Core(poses[reg]);
}

export function set1(reg: Reg, bit: boolean) {
    set1Core(poses[reg], bit);
}

export function getMem16(addr: number): number {
    const lowData = getMem8(addr);
    const highData = getMem8((addr + 1) & 0xFFFF);
    return (highData << 8) | lowData;
}

export function setMem16(addr: number, data: number) {
    setMem8(addr, data & 0xFF);
    setMem8((addr + 1) & 0xFFFF, data >> 8);
}

export function getMem8(addr: number): number {
    const memPos = getMemPos(addr);
    return get8Core(memPos);
}

export function setMem8(addr: number, data: number) {
    if (addr >= config.ramMinAddr && addr <= config.ramMaxAddr) {
        const memPos = getMemPos(addr);
        set8Core(memPos, data);
    }
}

export function getMemPos(addr: number): Position {
    const mem0Pos = poses[Reg.Mem0];
    let x = mem0Pos.x + (addr & 0x1F) * 8;
    let y = mem0Pos.y + (addr >> 11);
    if (addr & 0x8000) x += 272;
    if (addr & 0x4000) y += 16;
    return { x, y };
}

export function get16Core(highPos: Position, lowPos: Position): number {
    const highData = get8Core(highPos);
    const lowData = get8Core(lowPos);
    return (highData << 8) | lowData;
}

export function set16Core(highPos: Position, lowPos: Position, data: number) {
    set8Core(highPos, data >> 8);
    set8Core(lowPos, data & 0xFF);
}

export function get8Core(pos: Position): number {
    let data = 0;
    for (let i = 7; i >= 0; i--) {
        data <<= 1;
        const arrow = world.getArrow(pos.x + i, pos.y);
        if (arrow && arrow.type >= 16)
            data |= 1;
    }
    return data;
}

export function set8Core(pos: Position, data: number) {
    const arrowTypes = getArrowTypes(pos);
    for (let i = 7; i >= 0; i--) {
        const bit = data & 1;
        const arrowType = arrowTypes[bit];
        world.setArrow(pos.x + i, pos.y, arrowType, 0, false);
        data >>= 1;
    }
}

export function get1Core(pos: Position): boolean {
    const arrow = world.getArrow(pos.x, pos.y);
    return !!arrow && arrow.type >= 16;
}

export function set1Core(pos: Position, bit: boolean) {
    const arrowTypes = getArrowTypes(pos);
    const arrowType = arrowTypes[bit ? 1 : 0];
    world.setArrow(pos.x, pos.y, arrowType, 0, false);
}

function getArrowTypes(pos: Position): number[] {
    const xMod = (pos.x % 16) >= 8;
    const yMod = (pos.y % 8) >= 4;
    return xMod === yMod ? arrowTypes1 : arrowTypes2;
}

const arrowTypes1 = [1, 18];
const arrowTypes2 = [10, 25];

// export function get8Core(pos: Position): number {
//     const arrow = world.getArrow(pos.x, pos.y);
//     if (!arrow) return 0;
//     let type = arrow.type;
//     if (type > 30) type--;
//     const typeData = (type - 1) << 3;
//     const rotationData = arrow.rotation << 1;
//     const flipData = arrow.flip ? 1 : 0;
//     const data = typeData | rotationData | flipData;
//     return data;
// }

// export function set8Core(pos: Position, data: number) {
//     let type = 1 + (data >> 3);
//     if (data === 0) type = 0;
//     if (type > 30) type++;
//     const rotation = (data % 8) >> 1;
//     const flip = (data % 2) !== 0;
//     world.setArrow(pos.x, pos.y, type, rotation, flip);
// }
