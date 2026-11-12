// US iced cup capacities verified against the official product response.
// Scale is an illustration of different cup geometry, not a physical volume simulation.
export const icedCupSizes: Record<string, { flOz: number; width: number; height: number }> = {
  Tall: { flOz: 12, width: .78, height: .76 },
  Grande: { flOz: 16, width: .9, height: .88 },
  Venti: { flOz: 24, width: 1, height: 1 },
  Trenta: { flOz: 30, width: 1.07, height: 1.08 },
};
export const cupVisualFor = (size: string, form = 'iced') => {
  if (size === 'Short') return { flOz: 8, width: .7, height: .64 };
  const cup = icedCupSizes[size] || icedCupSizes.Grande;
  return form === 'hot' && size === 'Venti' ? { flOz: 20, width: .96, height: .95 } : cup;
};
