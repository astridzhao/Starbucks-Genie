import snapshot from './starbucks-us.json';
import { estimateForServing } from './ingredient-estimates';
import type { DrinkBuild } from './nutrition';
export type ExtraPortion = 'light' | 'regular' | 'extra';
export const MAX_MODIFIER_AMOUNT = snapshot.orderingSettings.maximumModifierAmount;
export const optionFor = (id: string) => snapshot.options.find(option => option.id === id);
export const isPortionOption = (id: string) => optionFor(id)?.formCode === 'modifier';
export const portionChoices = (id: string) => (['light', 'regular', 'extra'] as const).filter(code => optionFor(id)?.portions.some(portion => portion.sizeCode === code));
export const extraPortionFor = (build: DrinkBuild, id: string): ExtraPortion => build.extraPortions?.[id] || 'regular';
export function officialExtraLabel(id: string, portion: ExtraPortion = 'regular') {
  const option = optionFor(id);
  return isPortionOption(id) ? option?.portions.find(item => item.sizeCode === portion)?.name || option?.name : option?.name;
}
export function additionalEstimate(id: string, build: DrinkBuild) {
  const estimate = estimateForServing(id, build.size, build.foamPortion);
  if (!estimate || !build.extras?.[id] || !isPortionOption(id)) return estimate;
  const portion = extraPortionFor(build, id);
  // Qualitative options are official; multipliers are internal planning assumptions.
  const factor = { light: .65, regular: 1, extra: 1.5 }[portion];
  return { ...estimate, calories: estimate.calories * factor, low: estimate.low * factor, high: estimate.high * factor,
    sugar: estimate.sugar === null ? null : estimate.sugar * factor,
    unit: portion, basis: `${estimate.basis} Official ${portion} option; an internal ×${factor} portion factor is used for estimation, not an official weight.` };
}
