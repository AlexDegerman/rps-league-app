export const toMs = (timestamp: number): number =>
  timestamp < 10_000_000_000 ? timestamp * 1000 : timestamp
