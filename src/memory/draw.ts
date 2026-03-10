import { getMemPos, set8Core, setMem8 } from "../common/data";
import { Reg } from "../common/types";
import { poses } from "../common/utils";

export function draw() {
    const initPos = getPosition();
    const chunkX = initPos.x - (initPos.x % 16);
    const chunkY = initPos.y - (initPos.y % 16);
    const memX = chunkX + 16;
    const memY = chunkY + 16;

    poses[Reg.Mem0] = { x: memX, y: memY };

    for (let addr = 0; addr <= 0xFFFF; addr++) {
        const memPos = getMemPos(addr);
        set8Core(memPos, 0);
        // set8Core(memPos, Math.floor(Math.random() * 256));
    }
}
