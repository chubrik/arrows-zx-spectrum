# <a href="ru/README.md"><img src="https://raw.githubusercontent.com/chubrik/LogicArrows/refs/heads/main/img/arrowcat-red.svg" width="30"></a> ZX Spectrum on Logic Arrows
<sub>[![LogicArrows](https://img.shields.io/badge/logic--arrows-steam-blue?logo=data:image/svg%2Bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cGF0aCBmaWxsPSIjNTAwIiBkPSJtOTkgMWMtMC44Ny0wLjg3LTIuMi0xLjMtMy42LTAuODJsLTc3IDI1Yy00LjkgMS43LTYuMyA3LjgtMi43IDExbDE1IDE1LTI5IDI5Yy0yLjcgMi43LTIuNyA3LjEgMCA5LjhsNyA3YzIuNyAyLjcgNy4xIDIuNyA5LjggMGwyOS0yOSAxNSAxNWMzLjcgMy43IDkuOCAyLjIgMTEtMi43bDI1LTc3YzAuNDktMS4zIDAuMDQ1LTIuNy0wLjgyLTMuNnoiIHN0cm9rZS13aWR0aD0iMS43Ii8+PC9zdmc+)](https://store.steampowered.com/app/4210250/Logic_Arrows/)</sub>
&nbsp;&nbsp;&nbsp;
🌐 English | [Русский](ru/README.md)

An emulator of the ZX Spectrum — the legendary home computer of the 1980s. It runs in real time
inside [“Logic Arrows”](https://store.steampowered.com/app/4210250/Logic_Arrows/) — a programmable
cellular automaton. The emulator plays real Spectrum games right on the map: the screen, the memory,
the keyboard, and even the sound — everything is made of arrows. The project targets the new version
of Logic Arrows, whose demo is already out on Steam. Add Logic Arrows to your
[wishlist](https://store.steampowered.com/app/4210250/Logic_Arrows/) so you don’t miss the full
release.

- [Games](#games)
- [How it works](#how-it-works)
- [Build and test](#build)
- [Links](#links)
<br><br>


## <a name="games"></a>Games

<table>
  <thead>
    <tr>
      <td valign="top" width="33%">
        <img src="img/target-renegade.jpg" alt="Target: Renegade"><br>
        <b>Target: Renegade</b><br><br>
      </td>
      <td valign="top" width="33%">
        <img src="img/r-type.jpg" alt="R-Type"><br>
        <b>R-Type</b><br><br>
      </td>
      <td valign="top" width="33%">
        <img src="img/myth.jpg" alt="Myth: History in the Making"><br>
        <b>Myth: History in the Making</b><br><br>
      </td>
    </tr>
    <tr>
      <td valign="top">
        <img src="img/nebulus.jpg" alt="Nebulus"><br>
        <b>Nebulus</b><br><br>
      </td>
      <td valign="top">
        <img src="img/star-raiders-ii.jpg" alt="Star Raiders II"><br>
        <b>Star Raiders II</b><br><br>
      </td>
      <td valign="top">
        <img src="img/stop-the-express.jpg" alt="Stop the Express"><br>
        <b>Stop the Express</b><br><br>
      </td>
    </tr>
  </thead>
</table>
<br><br>


## <a name="how-it-works"></a>How it works

The emulator is written in TypeScript and compiled into code for in-game command blocks. Running a
game takes just five blocks: the CPU, the ROM initializer, and three blocks with a RAM snapshot.

- **CPU.** The complete Z80 instruction set, including undocumented instructions and flags.
  Correctness is verified by the test suite of the
  [FUSE](https://fuse-emulator.sourceforge.net/) emulator: all 1356 tests pass — both on the
  TypeScript source and on the final packed build. Timing is cycle-accurate: 69888 T-states per
  frame, 50 frames per second.
- **Speed.** The emulator runs in real time. Two extra modes are available: single-step and
  unlimited speed.
- **Memory.** 16K of ROM and 48K of RAM. The whole memory fits on the screen at once, down to the
  last bit, and changes right before your eyes: you can watch the stack at work, the buffers being
  updated, and the sprites being prepared before they appear on the screen.
- **Screen.** 256×192 pixels, border and FLASH attributes. The display area is committed to the
  map row by row, following the beam just like on a real TV.
- **Keyboard.** The 8×5 half-row matrix of the Spectrum keyboard is read directly from signals
  on the map.
- **Sound.** The beeper is translated into the game’s music arrows.
- **Packing.** The build pipeline squeezes the whole CPU into a single command block of about
  6 000 characters (24 KB): esbuild → custom function inliner → three Terser passes → arrow-function
  conversion → a self-extracting packed string.
- **Games.** Games are loaded from `.z80` snapshots. Each snapshot is packed into three command
  blocks — 16K of RAM each — plus the CPU registers and the border color.
<br><br>


## <a name="build"></a>Build and test

```sh
npm install
npm run build
npm test
```

Requires Node.js 22.18 or newer. The build automatically downloads the original ROM and the
FUSE test files, verifying their SHA256. Games are built from `.z80` snapshots placed into the
`resources/` folder (not included in the repository). The results go to `dist/`: the packed CPU,
the ROM initializer, and three RAM blocks per game — ready to be pasted into command blocks on
the map. `npm run dev` rebuilds the CPU only.
<br><br>


## <a name="links"></a>Links

- [Logic Arrows on Steam](https://store.steampowered.com/app/4210250/Logic_Arrows/) – the
  new version of the game, with a demo already available
- [Logic Arrows in the browser](https://logic-arrows.io/) – the browser version of the game
- [Logic Arrows maps](https://github.com/chubrik/LogicArrows) – a collection of maps: computers,
  programs, and documentation
- [Arrows Compiler](https://github.com/chubrik/arrows-compiler) – online compiler for the
  in-game computers
- [Discord server](https://discord.gg/8FMuQuMFCN) – player community on Discord
- [Telegram channel](https://t.me/logic_arrows) – player community on Telegram
