import snapshot from './starbucks-us.json';
import { estimateForServing } from './ingredient-estimates';

export type Splash = 'light' | 'regular' | 'extra';
type MilkBuild = { milk: string; milkMl?: number; milkPortion?: Splash; size: string };
export const splashLabels = { light: '1/4 Inch Splash', regular: '1/2 Inch Splash', extra: '3/4 Inch Splash' };
// Internal planning assumptions only; Starbucks publishes height, not measured mL.
const volumeModels = { light: [30, 15, 45], regular: [60, 30, 90], extra: [90, 45, 135] };
export function milkServing(build: MilkBuild) {
  if (!build.milkPortion && typeof build.milkMl === 'number') {
    return { portion: (build.milkMl <= 30 ? 'light' : build.milkMl <= 60 ? 'regular' : 'extra') as Splash,
      volume: build.milkMl, lowVolume: build.milkMl, highVolume: build.milkMl, legacy: true };
  }
  const portion = build.milkPortion || 'regular';
  const [volume, lowVolume, highVolume] = volumeModels[portion];
  return { portion, volume, lowVolume, highVolume, legacy: false };
}
export function availableMilkPortions(id: string) {
  const option = snapshot.options.find(option => option.id === id);
  return (['light', 'regular', 'extra'] as const).filter(portion => option?.portions.some(item => item.sizeCode === portion));
}
export function estimateMilkSplash(id: string, build: MilkBuild) {
  const density = estimateForServing(id, build.size);
  if (!density) return null;
  const serving = milkServing(build);
  return { ...density, calories: density.calories * serving.volume / 100,
    low: density.low * serving.lowVolume / 100, high: density.high * serving.highVolume / 100,
    sugar: density.sugar === null ? null : density.sugar * serving.volume / 100,
    unit: splashLabels[serving.portion],
    basis: `${density.basis} ${splashLabels[serving.portion]} uses an internal approximate ${serving.volume} mL assumption (scenario ${serving.lowVolume}–${serving.highVolume} mL); Starbucks does not publish a fixed mL pour for a splash.` };
}
