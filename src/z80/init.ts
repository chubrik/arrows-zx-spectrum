import { Reg } from "./types";
import { poses } from "./utils";

export function init() {
    const initPos = getPosition();
    const chunkX = initPos.x - (initPos.x % 16);
    const chunkY = initPos.y - (initPos.y % 16);
    const cpuX = chunkX + 16;
    const cpuY = chunkY;
    const memX = chunkX + 48;
    const memY = chunkY - 512;

    poses[Reg.F] = getPos(cpuX + 0, cpuY + 0);
    poses[Reg.A] = getPos(cpuX + 0, cpuY + 1);
    poses[Reg.B] = getPos(cpuX + 0, cpuY + 2);
    poses[Reg.C] = getPos(cpuX + 0, cpuY + 3);
    poses[Reg.D] = getPos(cpuX + 0, cpuY + 4);
    poses[Reg.E] = getPos(cpuX + 0, cpuY + 5);
    poses[Reg.H] = getPos(cpuX + 0, cpuY + 6);
    poses[Reg.L] = getPos(cpuX + 0, cpuY + 7);

    poses[Reg.Fa] = getPos(cpuX + 8, cpuY + 0);
    poses[Reg.Aa] = getPos(cpuX + 8, cpuY + 1);
    poses[Reg.Ba] = getPos(cpuX + 8, cpuY + 2);
    poses[Reg.Ca] = getPos(cpuX + 8, cpuY + 3);
    poses[Reg.Da] = getPos(cpuX + 8, cpuY + 4);
    poses[Reg.Ea] = getPos(cpuX + 8, cpuY + 5);
    poses[Reg.Ha] = getPos(cpuX + 8, cpuY + 6);
    poses[Reg.La] = getPos(cpuX + 8, cpuY + 7);

    poses[Reg.IXh] = getPos(cpuX + 0, cpuY + 8);
    poses[Reg.IXl] = getPos(cpuX + 0, cpuY + 9);
    poses[Reg.IYh] = getPos(cpuX + 0, cpuY + 10);
    poses[Reg.IYl] = getPos(cpuX + 0, cpuY + 11);
    poses[Reg.SPh] = getPos(cpuX + 0, cpuY + 12);
    poses[Reg.SPl] = getPos(cpuX + 0, cpuY + 13);
    poses[Reg.PCh] = getPos(cpuX + 0, cpuY + 14);
    poses[Reg.PCl] = getPos(cpuX + 0, cpuY + 15);

    poses[Reg.I] = getPos(cpuX + 8, cpuY + 8);
    poses[Reg.R] = getPos(cpuX + 8, cpuY + 9);

    poses[Reg.Hlt] = getPos(cpuX + 8, cpuY + 10);

    poses[Reg.Mem0] = getPos(memX, memY);
}

function getPos(x: number, y: number): Position {
    return { x, y };
}
