/** Progress of a tutorial level */
declare const level: {
  /** Add to the progress; the units are not documented yet */
  addProgress(value: number): void;

  /** Reset the progress */
  clearProgress(): void;
};
