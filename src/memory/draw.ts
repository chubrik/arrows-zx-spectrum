import { getMemPos, set8Core } from "../common/data";
import { Reg } from "../common/types";
import { poses, unicodeToBytes } from "../common/utils";
import { romEncoded } from "../../rom/48";

export function draw() {
    const initPos = getPosition();
    const chunkX = initPos.x - (initPos.x % 16);
    const chunkY = initPos.y - (initPos.y % 16);
    const memX = chunkX + 16;
    const memY = chunkY + 16;

    const rom = unicodeToBytes(romEncoded);

    poses[Reg.Mem0] = { x: memX, y: memY };

    for (let addr = 0; addr <= 0xFFFF; addr++) {
        const memPos = getMemPos(addr);
        const data = addr < rom.length ? rom[addr] : 0;
        set8Core(memPos, data);
    }
}
