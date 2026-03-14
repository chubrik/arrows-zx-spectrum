export const enum HLMode {
  HL,
  IX,
  IY,
}

/** B, C, D, E, H/IXh/IYh, L/IXl/IYl, (HL/IX+d/IY+d), A */
export const enum RhlSelect {
  B,
  C,
  D,
  E,
  H,  // H/IXh/IYh
  L,  // L/IXl/IYl
  hl, // (HL/IX+d/IY+d)
  A,
}

/** BC, DE, HL/IX/IY, AF */
export const enum QQSelect {
  BC = 0,
  DE = 2,
  HL = 4, // HL/IX/IY
  AF = 6,
}

/** BC, DE, HL/IX/IY, SP */
export const enum SSSelect {
  BC = 0,
  DE = 2,
  HL = 4, // HL/IX/IY
  SP = 6,
}
