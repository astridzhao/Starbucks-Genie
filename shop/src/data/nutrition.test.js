import { standardBuild } from "./drink-recipes";
import {
  calculateNutrition,
  defaultBuild,
  fitnessPresets,
  starbucksOrderUrl,
  orderText,
  reconcileExtras,
  normalizeSavedSyrupAmounts,
  normalizeSavedAppSettings,
} from "./nutrition";
import snapshot from "./starbucks-us.json";

test("uses official base calories for the selected size", () => {
  expect(
    calculateNutrition(standardBuild("americano", "Tall"))
      .calories,
  ).toBe(10);
  expect(
    calculateNutrition(standardBuild("americano", "Grande"))
      .calories,
  ).toBe(15);
});
test("scales syrup pumps and measured milk independently", () => {
  const result = calculateNutrition({
    ...defaultBuild,
    syrup: "111",
    pumps: 2,
    milk: "50",
    milkMl: 60,
  });
  expect(result.calories).toBe(75);
  expect(result.estimated).toBe(true);
  expect(result.complete).toBe(true);
  expect(result.sugar).toBe(13);
});
test("foam uses an explicit nonzero estimate and planning range without invented macros", () => {
  const foam = snapshot.options.find(
    (option) =>
      option.group === "Cold Foam" &&
      option.compatibleBases.includes("cold-brew"),
  );
  const result = calculateNutrition({ ...defaultBuild, foam: foam.id });
  expect(result.complete).toBe(true);
  expect(result.estimated).toBe(true);
  expect(result.lines.at(-1).calories).toBeGreaterThan(0);
  expect(result.low).toBeLessThan(result.calories);
  expect(result.high).toBeGreaterThan(result.calories);
  expect(result.sugar).toBeNull();
  expect(result.protein).toBeNull();
});
test("all fitness presets have complete totals under 100 kcal", () => {
  fitnessPresets.forEach((preset) => {
    const result = calculateNutrition(preset.build);
    expect(result.complete).toBe(true);
    expect(result.high).toBeLessThan(100);
  });
});
test("zero syrup pumps contribute neither calories nor an order instruction", () => {
  const build = { ...defaultBuild, syrup: "111", pumps: 0 };
  expect(calculateNutrition(build).calories).toBe(5);
  expect(orderText(build)).not.toMatch(/Vanilla Syrup/);
});
test("unknown ingredients and invalid sizes cannot enter saved recipes", () => {
  expect(() =>
    calculateNutrition({ ...defaultBuild, syrup: "fake" }),
  ).toThrow();
  expect(() => calculateNutrition({ ...defaultBuild, size: "fake" })).toThrow();
});

test("rejects invalid amounts and ingredients assigned to the wrong category", () => {
  for (const changed of [
    { pumps: -1 },
    { pumps: NaN },
    { milkMl: -30 },
    { syrup: "50" },
    { milk: "111" },
    { foamPortion: "invalid" },
  ]) {
    expect(() => calculateNutrition({ ...defaultBuild, ...changed })).toThrow();
  }
});

test("an exact official chocolate cold foam recipe uses whole-drink nutrition", () => {
  const build = { ...defaultBuild, syrup: "111", pumps: 2, foam: "2123643" };
  const result = calculateNutrition(build);
  expect(result.officialMatch.name).toBe("Chocolate Cream Cold Brew");
  expect(result.calories).toBe(240);
  expect(result.complete).toBe(true);
  expect(result.estimated).toBe(false);
  expect(result.lines.at(-1).status).toBe("estimate");
  expect(result.low).toBe(240);
  expect(result.high).toBe(240);
});

test("altering syrup, milk, size-specific pumps, or foam amount removes the official match", () => {
  const build = { ...defaultBuild, syrup: "111", pumps: 2, foam: "2123643" };
  for (const changed of [
    { pumps: 0 },
    { pumps: 1 },
    { syrup: "109" },
    { milk: "50" },
    { foamPortion: "light" },
  ]) {
    const result = calculateNutrition({ ...build, ...changed });
    expect(result.officialMatch).toBeUndefined();
    expect(result.complete).toBe(true);
    expect(result.estimated).toBe(true);
  }
});

test("Starbucks handoff opens the matched product or the base, without fabricated customization parameters", () => {
  expect(starbucksOrderUrl(defaultBuild)).toBe(
    "https://www.starbucks.com/menu/product/2121255/iced",
  );
  expect(
    starbucksOrderUrl({
      ...defaultBuild,
      syrup: "111",
      pumps: 2,
      foam: "2123643",
    }),
  ).toBe("https://www.starbucks.com/menu/product/2123644/iced");
});

test("multiple extra flavors scale calories and range and enter the copied order", () => {
  const build = { ...defaultBuild, extras: { 650: 2, 96: 1 } };
  const result = calculateNutrition(build);
  expect(result.calories).toBe(95);
  expect(result.low).toBe(60);
  expect(result.high).toBe(145);
  expect(result.caffeine).toBeNull();
  expect(orderText(build)).toContain("2 × Mocha Sauce");
  expect(orderText(build)).toContain("1 × Hazelnut Syrup");
});

test("syrups and liquid sweeteners use whole pumps; espresso and packets use whole servings", () => {
  for (const pumps of [0.5, 2.5])
    expect(() =>
      calculateNutrition({ ...defaultBuild, syrup: "111", pumps }),
    ).toThrow();
  expect(
    calculateNutrition({ ...defaultBuild, syrup: "111", pumps: 2 }).calories,
  ).toBe(45);
  expect(() =>
    calculateNutrition({ ...defaultBuild, extras: { 96: 2.5 } }),
  ).toThrow();
  expect(() =>
    calculateNutrition({ ...defaultBuild, extras: { 94: 0.5 } }),
  ).toThrow();
  expect(() =>
    calculateNutrition({ ...defaultBuild, extras: { 82: 0.5 } }),
  ).toThrow();
});

test("added espresso allows its own roast and extraction without inventing caffeine", () => {
  const build = {
    ...standardBuild("americano"),
    extras: { 82: 5 },
    roast: "2122222",
    shotStyle: "2123218",
  };
  expect(calculateNutrition(build).calories).toBe(25);
  expect(calculateNutrition(build).caffeine).toBeNull();
  expect(orderText(build)).toContain("Blonde Espresso");
  expect(orderText(build)).toContain("Ristretto");
  expect(() =>
    calculateNutrition({ ...defaultBuild, roast: "2122222" }),
  ).toThrow();
});

test("preparation settings, duplicate primary flavors, invalid counts and incompatible extras are rejected", () => {
  for (const extras of [
    { 1143: 1 },
    { 50: 1 },
    { 2122719: 1 },
    { 650: -1 },
    { 650: 100 },
    { 650: 0.25 },
  ]) {
    expect(() => calculateNutrition({ ...defaultBuild, extras })).toThrow();
  }
  expect(() =>
    calculateNutrition({ ...defaultBuild, syrup: "111", extras: { 111: 1 } }),
  ).toThrow();
});

test("any active extra ingredient invalidates the official whole-drink match", () => {
  const result = calculateNutrition({
    ...defaultBuild,
    syrup: "111",
    pumps: 2,
    foam: "2123643",
    extras: { 126: 1 },
  });
  expect(result.officialMatch).toBeUndefined();
  expect(result.estimated).toBe(true);
  expect(result.calories).toBe(255);
});

test("base changes preserve only compatible extras and remove a duplicate primary syrup", () => {
  expect(
    reconcileExtras({ 650: 1, 96: 1, 2122719: 1 }, "green-tea", "96"),
  ).toEqual({ 2122719: 1 });
});

test("legacy fractional syrup amounts normalize explicitly while preserving the recipe", () => {
  const result = normalizeSavedSyrupAmounts({
    ...defaultBuild,
    syrup: "111",
    pumps: 2.5,
    extras: { 96: 1.5, 650: 0.5 },
  });
  expect(result.changed).toBe(true);
  expect(result.build.pumps).toBe(3);
  expect(result.build.extras).toEqual({ 96: 2, 650: 0.5 });
  expect(() => calculateNutrition(normalizeSavedAppSettings(result.build).build)).not.toThrow();
  expect(normalizeSavedSyrupAmounts(defaultBuild).changed).toBe(false);
});
