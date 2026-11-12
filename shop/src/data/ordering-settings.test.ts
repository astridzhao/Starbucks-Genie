import { defaultBuild, calculateNutrition, orderText, normalizeSavedMilkPortion } from './nutrition';
import { availableMilkPortions, milkServing } from './milk-splash';
import { MAX_MODIFIER_AMOUNT } from './customization-options';

test('milk offers official splash labels while its nutrition remains an estimate', () => {
  expect(availableMilkPortions('50')).toEqual(['light', 'regular', 'extra']);
  const light = { ...defaultBuild, milk: '50', milkPortion: 'light' as const };
  const extra = { ...light, milkPortion: 'extra' as const };
  expect(orderText(light)).toContain('1/4 Inch Splash');
  expect(orderText(extra)).toContain('3/4 Inch Splash');
  expect(orderText(extra)).not.toContain('mL');
  expect(calculateNutrition(extra).calories).toBeGreaterThan(calculateNutrition(light).calories);
  const restored = normalizeSavedMilkPortion({ ...defaultBuild, milk: '50', milkMl: 60 });
  expect(restored.changed).toBe(true);
  expect(restored.build.milkMl).toBeUndefined();
  expect(milkServing(restored.build).portion).toBe('regular');
});

test('official quantity counts use integer steps and the sourced maximum', () => {
  expect(MAX_MODIFIER_AMOUNT).toBe(12);
  expect(() => calculateNutrition({ ...defaultBuild, syrup: '111', pumps: 12 })).not.toThrow();
  for (const pumps of [2.5, 13]) expect(() => calculateNutrition({ ...defaultBuild, syrup: '111', pumps })).toThrow();
  expect(() => calculateNutrition({ ...defaultBuild, extras: { '96': 1.5 } })).toThrow();
});
