import { init } from "./z80/init";
import { process } from "./z80/process";

init();
always(process);
