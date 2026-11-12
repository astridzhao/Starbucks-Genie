import snapshot from './starbucks-us.json';
import type { DrinkBuild } from './nutrition';

export function standardBuild(baseId: string, sizeName = 'Grande'): DrinkBuild {
  const base = snapshot.bases.find(base => base.id === baseId);
  if (!base) throw new Error('Unknown drink');
  const size = base.sizes.find(size => size.name === sizeName) || base.sizes.find(size => size.name === 'Grande') || base.sizes[0];
  return { ...structuredClone(size.defaultBuild), recipeVersion: 2 } as DrinkBuild;
}
export function resizeBuild(build: DrinkBuild, sizeName: string): DrinkBuild {
  const before = standardBuild(build.base, build.size), after = standardBuild(build.base, sizeName);
  const next = { ...build, size: after.size, extras: { ...build.extras }, extraPortions: { ...build.extraPortions } };
  for (const field of ['syrup', 'pumps', 'milk', 'foam', 'foamPortion', 'roast', 'shotStyle'] as const) {
    if (build[field] === before[field]) Object.assign(next, { [field]: after[field] });
  }
  for (const id of new Set([...Object.keys(before.extras || {}), ...Object.keys(after.extras || {})])) {
    if ((build.extras?.[id] || 0) === (before.extras?.[id] || 0)) {
      if (after.extras?.[id]) next.extras[id] = after.extras[id];
      else { delete next.extras[id]; delete next.extraPortions[id]; }
    }
  }
  return next;
}
export const isMilkDrink = (baseId: string) => snapshot.options.some(option => option.group === 'Milk Options' && option.compatibleBases.includes(baseId));
// Whole-drink milk volume is not exposed by Starbucks. Use broad internal scenarios
// only when estimating the change from the official default milk to another milk.
export function assumedRecipeMilkMl(baseId: string, sizeName: string) {
  const base = snapshot.bases.find(base => base.id === baseId)!;
  const size = base.sizes.find(size => size.name === sizeName)!;
  const flOz = Number(size.servingSize.match(/[\d.]+/)?.[0]) || 16;
  const factor = baseId === 'shaken-espresso' ? .15 : baseId === 'pink-drink' ? .4 : baseId === 'cappuccino' ? .45 : base.form === 'hot' ? .8 : .55;
  return flOz * 29.5735 * factor;
}
