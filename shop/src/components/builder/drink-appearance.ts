import snapshot from '../../data/starbucks-us.json';
import type { DrinkBuild } from '../../data/nutrition';
import { cupVisualFor } from '../../data/cup-size';
import { isMilkDrink } from '../../data/drink-recipes';
import { milkServing } from '../../data/milk-splash';

export function drinkAppearance(build: DrinkBuild) {
  const base = snapshot.bases.find(base => base.id === build.base)!;
  const extras = Object.entries(build.extras || {}).flatMap(([id, amount]) => {
    const option = snapshot.options.find(option => option.id === id);
    return option && amount > 0 ? [{ ...option, amount: amount * ({ light: .65, regular: 1, extra: 1.5 }[build.extraPortions?.[id] || 'regular']) }] : [];
  });
  const has = (group: string) => extras.some(option => option.group === group);
  const milkDrink = isMilkDrink(build.base);
  const matcha = has('Tea Powders') || build.base.includes('matcha');
  const chocolate = extras.some(option => option.group === 'Sauces' && /Mocha|Chocolate/.test(option.name));
  const milkName = snapshot.options.find(option => option.id === build.milk)?.name || '';
  const foamName = snapshot.options.find(option => option.id === build.foam)?.name || '';
  const cup = cupVisualFor(build.size, base.form);
  const syrupDoses: Record<string, number> = {};
  if (build.syrup && build.pumps) syrupDoses[build.syrup] = build.pumps;
  extras.filter(option => option.group === 'Syrups' || option.group === 'Liquid Sweeteners').forEach(option => { syrupDoses[option.id] = option.amount; });
  const milkFraction = !build.milk ? 0 : milkDrink ? .78 : Math.min(.48, milkServing(build).volume / (cup.flOz * 29.57 * .62));
  // Match the warm coffee/latte tones in the official US product photographs.
  // Blend display colors perceptually rather than adding linear white (which looked gray).
  const coffeeColor = matcha ? '#3a6424' : chocolate ? '#371b0d' : build.base.includes('chai') ? '#8a4d21' : base.category === 'Refreshers' ? '#c54664' : base.category === 'Tea' ? base.color : '#381708';
  const milkTarget = matcha ? '#b4c68b' : base.category === 'Refreshers' ? '#e8b3ba' : build.base.includes('chai') ? '#d7ac79' : '#d2a56d';
  const parse = (color: string) => [1,3,5].map(offset => parseInt(color.slice(offset,offset+2),16));
  const a = parse(coffeeColor), b = parse(milkTarget), factor = milkFraction ? Math.pow(milkFraction,.62) : 0;
  const settledColor = '#' + a.map((channel,index) => Math.round(channel*(1-factor)+b[index]*factor).toString(16).padStart(2,'0')).join('');
  return {
    settledColor,
    key: JSON.stringify(build), base: build.base, milk: build.milk, milkDrink, cup,
    hot: base.form === 'hot', ice: base.hasIce,
    coffeeColor,
    milkColor: /Oat|Almond/.test(milkName) ? '#e9dbc4' : '#f2e8d7', milkFraction,
    foam: build.foam ? ({ light: .08, regular: .15, extra: .22 }[build.foamPortion]) : 0,
    foamColor: /Chocolate|Mocha/.test(foamName) ? '#c4a18a' : /Matcha|Pistachio/.test(foamName) ? '#cbd2a8' : /Strawberry/.test(foamName) ? '#edc5cf' : '#f5ecdc',
    syrupDoses, primarySyrup: build.syrup, whipped: has('Whipped Cream'),
    drizzle: extras.find(option => option.group === 'Drizzle')?.name || '',
    lining: extras.find(option => option.group === 'Line the Cup')?.name || '',
    toppingCount: Math.min(60, Math.round(extras.filter(option => ['Topping Options', 'Powders'].includes(option.group)).reduce((n, option) => n + option.amount * 18, 0))),
    fruitCount: Math.min(22, Math.round(extras.filter(option => ['Fruit Add-Ins', 'Flavored Pearls'].includes(option.group)).reduce((n, option) => n + option.amount * 6, 0))),
    pearls: has('Flavored Pearls'),
  };
}
export type DrinkAppearance = ReturnType<typeof drinkAppearance>;
