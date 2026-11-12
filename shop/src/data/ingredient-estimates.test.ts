import {
  ingredientCatalog,
  ingredientEstimates,
  estimateIngredient,
  estimateForServing,
} from "./ingredient-estimates";
import snapshot from "./starbucks-us.json";
import { calculateNutrition, defaultBuild } from "./nutrition";

test("every current option is modeled or explicitly a preparation setting", () => {
  expect(ingredientCatalog).toHaveLength(snapshot.options.length);
  expect(ingredientCatalog.filter((row) => row.estimate)).toHaveLength(
    ingredientCatalog.filter((row) => !row.preparation).length,
  );
  for (const row of ingredientCatalog) {
    if (row.preparation) {
      expect(row.estimate).toBeNull();
      continue;
    }
    const estimate = row.estimate!;
    expect(estimate).not.toBeNull();
    expect(estimate.low).toBeGreaterThanOrEqual(0);
    expect(estimate.low).toBeLessThanOrEqual(estimate.calories);
    expect(estimate.high).toBeGreaterThanOrEqual(estimate.calories);
    expect(estimate.basis.length).toBeGreaterThan(20);
    expect(estimate.sources.length).toBeGreaterThan(0);
  }
});

test("foam residual uses each size-specific standard recipe, including its syrup", () => {
  expect(estimateForServing("2123643", "Grande")!.calories).toBe(
    240 - 5 - 2 * 20,
  );
  expect(estimateForServing("2123643", "Tall")!.calories).toBe(190 - 5 - 20);
  expect(
    estimateForServing("2123643", "Grande", "light")!.calories,
  ).toBeCloseTo(195 * 0.65);
  expect(
    estimateForServing("2123643", "Grande", "extra")!.calories,
  ).toBeCloseTo(195 * 1.5);
});

test("milk mL and syrup pump counts scale both endpoints of the total range", () => {
  const result = calculateNutrition({
    ...defaultBuild,
    milk: "50",
    milkMl: 60,
    syrup: "111",
    pumps: 2,
  });
  expect(result.low).toBeCloseTo(5 + 40 * 0.6 + 15 * 2);
  expect(result.high).toBeCloseTo(5 + 65 * 0.6 + 30 * 2);
});

test("unknown future food categories have no silent default estimate", () => {
  const example = ingredientCatalog[0];
  expect(
    estimateIngredient({
      ...example,
      id: "new",
      group: "Unrecognized Food",
      name: "Future food",
    }),
  ).toBeNull();
  expect(estimateForServing("unrecognized", "Grande")).toBeNull();
});

test("sugar-free trace calories have a nonzero upper scenario bound and controls have no additive estimate", () => {
  expect(ingredientEstimates["109"].high).toBeGreaterThan(0);
  expect(ingredientEstimates["1143"]).toBeUndefined();
  expect(ingredientEstimates["41"].calories).toBe(0);
  expect(ingredientEstimates["42"].calories).toBe(0);
});
