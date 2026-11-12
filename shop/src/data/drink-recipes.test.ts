import { calculateNutrition, orderText, normalizeSavedAppSettings, defaultBuild } from './nutrition';
import { standardBuild, resizeBuild } from './drink-recipes';
import snapshot from './starbucks-us.json';

test('every starter and size loads its official defaults without double-counting', () => {
  for (const base of snapshot.bases) for (const size of base.sizes) {
    const result = calculateNutrition(standardBuild(base.id, size.name));
    expect(result.calories, `${base.name} ${size.name}`).toBe(size.nutrition.calories);
    expect(result.lines).toHaveLength(1);
    expect(result.estimated).toBe(false);
    expect(result.caffeine).toBe(size.nutrition.caffeine ?? null);
  }
});
test('Latte milk replaces the existing milk, and extra syrup only adds its own calories', () => {
  const latte = standardBuild('iced-latte');
  expect(latte.milk).toBe('63');
  expect(latte.extras?.['82']).toBe(2);
  expect(calculateNutrition({ ...latte, syrup: '111', pumps: 2 }).calories).toBe(170);
  const almond = calculateNutrition({ ...latte, milk: '2121965' });
  expect(almond.estimated).toBe(true);
  expect(almond.calories).toBeLessThan(130);
  expect(almond.low).toBeLessThanOrEqual(almond.calories);
  expect(almond.high).toBeGreaterThanOrEqual(almond.calories);
  expect(orderText({ ...latte, milk: '2121965' })).toContain('Almondmilk');
  expect(orderText(latte)).not.toContain('Splash');
  expect(() => calculateNutrition({ ...latte, milk: '' })).toThrow();
});
test('removing standard Mocha sauce or whipped cream subtracts instead of adding', () => {
  const mocha = standardBuild('iced-mocha');
  const extras = { ...mocha.extras }; delete extras['650']; delete extras['125'];
  const build = { ...mocha, extras, extraPortions: {} };
  const result = calculateNutrition(build);
  expect(result.calories).toBeLessThan(350);
  expect(result.lines.filter(line => line.name.startsWith('Remove')).length).toBe(2);
  expect(orderText(build)).toContain('No Mocha Sauce');
  expect(orderText(build)).toContain('No Whipped Cream');
});
test('size switches update untouched defaults and preserve intentional overrides', () => {
  const grande = standardBuild('iced-macchiato');
  const tall = resizeBuild(grande, 'Tall');
  expect(tall.pumps).toBe(standardBuild('iced-macchiato', 'Tall').pumps);
  expect(tall.extras?.['82']).toBe(standardBuild('iced-macchiato', 'Tall').extras?.['82']);
  const custom = resizeBuild({ ...grande, pumps: 1, milk: '2122556', extras: { ...grande.extras, '82': 4 } }, 'Tall');
  expect(custom.pumps).toBe(1);
  expect(custom.milk).toBe('2122556');
  expect(custom.extras?.['82']).toBe(4);
});
test('old saved Americano extra shots migrate from added to total shot counts once', () => {
  const legacy = { ...defaultBuild, base: 'americano', extras: { '82': 2 } }; delete legacy.recipeVersion;
  const migrated = normalizeSavedAppSettings(legacy);
  expect(migrated.build.extras['82']).toBe(5);
  expect(calculateNutrition(migrated.build).calories).toBe(25);
  expect(normalizeSavedAppSettings(migrated.build).changed).toBe(false);
});
