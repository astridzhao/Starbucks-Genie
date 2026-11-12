import { standardBuild, isMilkDrink, assumedRecipeMilkMl } from "./drink-recipes";
import snapshot from "./starbucks-us.json";
import { MAX_MODIFIER_AMOUNT, isPortionOption, optionFor, portionChoices, extraPortionFor, officialExtraLabel, additionalEstimate } from "./customization-options";
import type { ExtraPortion } from "./customization-options";
import { milkServing, estimateMilkSplash, splashLabels } from "./milk-splash";
import type { Splash } from "./milk-splash";
import { estimateForServing } from "./ingredient-estimates";

// Planning assumptions, NOT official Starbucks modifier nutrition.
// One full syrup pump is modeled as 10 mL. Cold-bar/half pumps may differ.
// Milk uses generic unsweetened beverage values per 100 mL; cafe brands vary.
export interface DrinkBuild {
  recipeVersion?: 2;
  base: string;
  size: string;
  syrup: string;
  pumps: number;
  milk: string;
  milkMl?: number; // Legacy saved recipes only.
  milkPortion?: Splash;
  foam: string;
  foamPortion: "light" | "regular" | "extra";
  extras?: Record<string, number>;
  extraPortions?: Record<string, ExtraPortion>;
  roast?: string;
  shotStyle?: string;
}
interface NutritionLine {
  name: string;
  calories: number | null;
  low: number | null;
  high: number | null;
  confidence?: string;
  method?: string;
  sources?: { title: string; url: string }[];
  sugar: number | null;
  status: "official" | "estimate" | "unknown";
  quantity: number;
  unit: string;
  source: string;
  basis?: string;
}
export { ingredientEstimates as estimates } from "./ingredient-estimates";

export const defaultBuild: DrinkBuild = standardBuild("cold-brew");
export const fitnessPresets: {
  id: string;
  name: string;
  note: string;
  build: DrinkBuild;
}[] = [
  {
    id: "black",
    name: "Clean Cold Brew",
    note: "No added sugar. A simple, low calorie coffee.",
    build: { ...defaultBuild },
  },
  {
    id: "vanilla",
    name: "Vanilla, Light",
    note: "Sugar-free vanilla with a light splash of almond beverage. Contains almond.",
    build: { ...defaultBuild, syrup: "109", milk: "2121966", milkPortion: "light" },
  },
  {
    id: "americano",
    name: "Caramel Lean Americano",
    note: "One caramel pump and a light splash of nonfat milk. A lighter, sweet espresso option.",
    build: { ...standardBuild("americano"), syrup: "91", milk: "199", milkPortion: "light" },
  },
  {
    id: "tea",
    name: "Hazelnut Oat Cold Brew",
    note: "One hazelnut pump and a light splash of oat beverage. Creamy with a measured sweetness.",
    build: { ...defaultBuild, syrup: "96", milk: "2123466", milkPortion: "light" },
  },
];

export function compatibleOptions(
  base: string,
  group: (group: string) => boolean,
) {
  return snapshot.options.filter(
    (option) =>
      option.compatibleBases.includes(base) &&
      option.availability === "Available" &&
      group(option.group),
  );
}

export const extraGroups = new Set([
  "Syrups",
  "Sauces",
  "Liquid Sweeteners",
  "Sweetener Packets",
  "Powders",
  "Tea Powders",
  "Topping Options",
  "Drizzle",
  "Line the Cup",
  "Espresso Shots",
  "Whipped Cream",
  "Fruit Add-Ins",
  "Chai Teas",
  "Juice Options",
  "Starbucks Refreshers Bases",
  "Flavored Pearls",
  "Extra Starbucks Refreshers Bases",
  "Lemonade",
]);
export function availableExtras(base: string) {
  return compatibleOptions(base, (group) => extraGroups.has(group));
}
export function reconcileExtras(
  extras: Record<string, number> | undefined,
  base: string,
  syrup = "",
) {
  const allowed = new Set(availableExtras(base).map((option) => option.id));
  return Object.fromEntries(
    Object.entries(extras || {}).filter(
      ([id, quantity]) => allowed.has(id) && id !== syrup && quantity > 0,
    ),
  );
}
export function extraQuantityStep(_id: string) { return 1; }
const activeExtras = (build: DrinkBuild) =>
  Object.entries(build.extras || {}).filter(([, quantity]) => quantity > 0);

export const officialFoamPresets = snapshot.standardRecipes.filter(
  (recipe) => recipe.build.size === "Grande",
);

export function findOfficialRecipe(build: DrinkBuild) {
  return snapshot.standardRecipes.find(
    ({ build: recipe }) =>
      build.base === recipe.base &&
      build.size === recipe.size &&
      !build.milk &&
      activeExtras(build).length === 0 &&
      build.syrup === recipe.syrup &&
      build.pumps === recipe.pumps &&
      build.foam === recipe.foam &&
      build.foamPortion === recipe.foamPortion,
  );
}

export function starbucksOrderUrl(build: DrinkBuild) {
  return (
    findOfficialRecipe(build)?.source ||
    snapshot.bases.find((base) => base.id === build.base)!.source
  );
}

export function normalizeSavedSyrupAmounts(build: DrinkBuild) {
  let changed = false;
  const next = { ...build, extras: { ...build.extras } };
  if (
    typeof build.pumps === "number" &&
    Number.isFinite(build.pumps) &&
    build.pumps >= 0 &&
    build.pumps <= MAX_MODIFIER_AMOUNT &&
    !Number.isInteger(build.pumps)
  ) {
    next.pumps = Math.round(build.pumps);
    changed = true;
  }
  for (const [id, quantity] of Object.entries(build.extras || {})) {
    const group = snapshot.options.find((option) => option.id === id)?.group;
    if (
      (group === "Syrups" || group === "Liquid Sweeteners") &&
      typeof quantity === "number" &&
      Number.isFinite(quantity) &&
      quantity >= 0 &&
      quantity <= MAX_MODIFIER_AMOUNT &&
      !Number.isInteger(quantity)
    ) {
      next.extras[id] = Math.round(quantity);
      changed = true;
    }
  }
  return { build: next, changed };
}

export function normalizeSavedMilkPortion(build: DrinkBuild) {
  if (!build.milk || build.milkPortion || typeof build.milkMl !== 'number' || !Number.isFinite(build.milkMl) || build.milkMl <= 0 || build.milkMl > 240) return { build, changed: false };
  const next = { ...build, milkPortion: milkServing(build).portion };
  delete next.milkMl;
  return { build: next, changed: true };
}

export function normalizeSavedAppSettings(build: DrinkBuild) {
  const next = { ...build, extras: { ...build.extras }, extraPortions: { ...build.extraPortions } };
  let changed = false;
  if (build.recipeVersion !== 2 && snapshot.bases.some(base => base.id === build.base)) {
    const defaults = standardBuild(build.base, build.size);
    for (const [id, quantity] of Object.entries(defaults.extras || {})) next.extras[id] = (next.extras[id] || 0) + quantity;
    next.recipeVersion = 2;
    if (!next.roast && next.extras['82']) next.roast = defaults.roast;
    changed = true;
  }
  for (const [id, quantity] of Object.entries(build.extras || {})) {
    if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity <= 0 || quantity > MAX_MODIFIER_AMOUNT) continue;
    if (isPortionOption(id) && quantity !== 1) {
      next.extraPortions[id] = quantity < 1 ? 'light' : 'extra'; next.extras[id] = 1; changed = true;
    } else if (optionFor(id)?.formCode === 'qty' && !Number.isInteger(quantity)) {
      next.extras[id] = Math.round(quantity); changed = true;
    }
  }
  return { build: next, changed };
}

export function calculateNutrition(build: DrinkBuild) {
  if (
    !Number.isFinite(build.pumps) ||
    !Number.isInteger(build.pumps) ||
    build.pumps < 0 ||
    build.pumps > MAX_MODIFIER_AMOUNT ||
    (build.milkMl !== undefined && (!Number.isFinite(build.milkMl) || build.milkMl <= 0 || build.milkMl > 240)) ||
    (build.milkPortion !== undefined && !['light', 'regular', 'extra'].includes(build.milkPortion)) ||
    !["light", "regular", "extra"].includes(build.foamPortion)
  ) {
    throw new Error("Invalid ingredient quantity");
  }
  if (
    build.extras !== undefined &&
    (!build.extras ||
      typeof build.extras !== "object" ||
      Array.isArray(build.extras))
  ) {
    throw new Error("Invalid extra ingredients");
  }
  for (const [id, quantity] of Object.entries(build.extras || {})) {
    const option = availableExtras(build.base).find(
      (option) => option.id === id,
    );
    if (
      !option ||
      id === build.syrup ||
      !Number.isFinite(quantity) ||
      !Number.isInteger(quantity / extraQuantityStep(id)) ||
      quantity < 0 ||
      quantity > MAX_MODIFIER_AMOUNT ||
      (option && option.formCode !== "qty" && quantity > 1)
    ) {
      throw new Error("Invalid extra ingredient or quantity");
    }
  }
  if (build.extraPortions !== undefined && (!build.extraPortions || typeof build.extraPortions !== 'object' || Array.isArray(build.extraPortions))) throw new Error('Invalid ingredient portions');
  for (const [id, portion] of Object.entries(build.extraPortions || {})) {
    if (!build.extras?.[id] || !isPortionOption(id) || !portionChoices(id).includes(portion)) throw new Error('Unsupported ingredient portion');
  }
  const oneGroups = new Set<string>();
  for (const [id, quantity] of Object.entries(build.extras || {})) {
    const option = optionFor(id);
    if (quantity > 0 && option?.formCode === 'one') {
      if (oneGroups.has(option.group)) throw new Error('Choose one option in this group');
      oneGroups.add(option.group);
    }
  }
  for (const [id, group] of [
    [build.roast, "Espresso Roast Options"],
    [build.shotStyle, "Ristretto or Long Shot"],
  ]) {
    if (
      id &&
      (!(build.extras?.["82"] || 0) ||
        !compatibleOptions(build.base, (name) => name === group).some(
          (option) => option.id === id,
        ))
    ) {
      throw new Error(
        "Espresso preparation requires added shots and a supported option",
      );
    }
  }
  const groups: [string, (group: string) => boolean][] = [
    [build.syrup, (group) => group === "Syrups" || group === "Liquid Sweeteners"],
    [build.milk, (group) => group === (isMilkDrink(build.base) ? "Milk Options" : "Creamer")],
    [build.foam, (group) => group.includes("Cold Foam")],
  ];
  for (const [id, allowed] of groups) {
    if (
      id &&
      !snapshot.options.some(
        (option) => option.id === id && allowed(option.group),
      )
    ) {
      throw new Error("Ingredient is in the wrong category");
    }
  }

  const base = snapshot.bases.find((item) => item.id === build.base)!;
  const size = base?.sizes.find((item) => item.name === build.size);
  if (!size) throw new Error("Choose an available base and size");
  const lines: NutritionLine[] = [
    {
      name: `${size.name} ${base.name}`,
      calories: size.nutrition.calories,
      low: size.nutrition.calories,
      high: size.nutrition.calories,
      sugar: size.nutrition.sugars ?? null,
      status: "official",
      quantity: 1,
      unit: "drink",
      source: base.source,
    },
  ];
  const defaults = standardBuild(build.base, build.size);
  if (isMilkDrink(build.base) && !build.milk) throw new Error('Choose a milk for this drink');
  const contributionLines = (recipe: DrinkBuild): Map<string, NutritionLine> => {
    const additions: [string, number, string][] = [
      [recipe.syrup, recipe.pumps, 'pump(s)'],
      [recipe.milk, 1, isMilkDrink(recipe.base) ? 'milk choice' : splashLabels[milkServing(recipe).portion]],
      [recipe.foam, 1, recipe.foamPortion],
      ...activeExtras(recipe).map(([id, quantity]): [string, number, string] => [id, quantity, optionFor(id)?.unit || 'serving(s)']),
    ];
    const result = new Map<string, NutritionLine>();
    for (const [id, quantity, unit] of additions) {
      if (!id || quantity === 0) continue;
      const option = optionFor(id);
      if (!option || !option.compatibleBases.includes(recipe.base) || option.availability !== 'Available') throw new Error('This ingredient is not available for the selected base');
      let estimate = id === recipe.milk && !isMilkDrink(recipe.base) ? estimateMilkSplash(id, recipe) : additionalEstimate(id, recipe);
      if (estimate && id === recipe.milk && isMilkDrink(recipe.base)) {
        const volume = assumedRecipeMilkMl(recipe.base, recipe.size);
        estimate = { ...estimate, calories: estimate.calories * volume / 100,
          low: estimate.low * volume * .65 / 100, high: estimate.high * volume * 1.35 / 100,
          sugar: estimate.sugar === null ? null : estimate.sugar * volume / 100,
          basis: `${estimate.basis} Milk substitution uses an internal ${Math.round(volume)} mL whole-drink model (65–135% volume scenarios), not an official Starbucks pour or a splash.` };
      }
      result.set(id, { name: option.name, calories: estimate ? estimate.calories * quantity : null,
        low: estimate ? estimate.low * quantity : null, high: estimate ? estimate.high * quantity : null,
        confidence: estimate?.confidence, method: estimate?.method, sources: estimate?.sources,
        sugar: estimate?.sugar != null ? estimate.sugar * quantity : null,
        status: estimate ? 'estimate' : 'unknown', quantity,
        unit: isPortionOption(id) && recipe.extras?.[id] ? extraPortionFor(recipe, id) : unit,
        basis: estimate?.basis, source: option.source });
    }
    return result;
  };
  const original = contributionLines(defaults), customized = contributionLines(build);
  for (const id of new Set([...original.keys(), ...customized.keys()])) {
    const before = original.get(id), after = customized.get(id);
    if (before && after && before.quantity === after.quantity && before.unit === after.unit && before.calories === after.calories) continue;
    const ref = after || before!;
    const known = (!before || before.calories !== null) && (!after || after.calories !== null);
    const delta = known ? (after?.calories || 0) - (before?.calories || 0) : null;
    // Same-ingredient uncertainty is correlated; scale its estimate by the change.
    const correlated = before && after && before.calories && after.calories && before.unit === after.unit;
    const ratio = correlated ? delta! / before.calories! : 0;
    let low = known ? (after?.low || 0) - (before?.high || 0) : null;
    let high = known ? (after?.high || 0) - (before?.low || 0) : null;
    if (correlated) { low = Math.min(before.low! * ratio, before.high! * ratio); high = Math.max(before.low! * ratio, before.high! * ratio); }
    lines.push({ ...ref, name: `${after ? before ? 'Adjust' : 'Add' : 'Remove'} ${ref.name}`,
      quantity: Math.abs((after?.quantity || 0) - (before?.quantity || 0)) || 1,
      calories: delta, low, high,
      sugar: (!before || before.sugar !== null) && (!after || after.sugar !== null) ? (after?.sugar || 0) - (before?.sugar || 0) : null,
      basis: `${ref.basis || 'No ingredient estimate.'} This line is a change relative to the official standard recipe, whose default ingredients are already included in its calories.` });
  }
  const officialMatch = findOfficialRecipe(build);
  const unknown = lines.filter((line) => line.calories === null);
  return {
    lines,
    officialMatch,
    low:
      officialMatch?.nutrition.calories ??
      Math.max(0, lines.reduce((sum, line) => sum + (line.low ?? 0), 0)),
    high:
      officialMatch?.nutrition.calories ??
      Math.max(0, lines.reduce((sum, line) => sum + (line.high ?? 0), 0)),
    complete: Boolean(officialMatch) || unknown.length === 0,
    calories:
      officialMatch?.nutrition.calories ??
      Math.max(0, lines.reduce((sum, line) => sum + (line.calories ?? 0), 0)),
    sugar: officialMatch
      ? (officialMatch.nutrition.sugars ?? null)
      : lines.every((line) => line.sugar !== null)
        ? Math.max(0, lines.reduce((sum, line) => sum + (line.sugar ?? 0), 0))
        : null,
    estimated:
      !officialMatch && lines.some((line) => line.status === "estimate"),
    caffeine:
      lines.length > 1 || build.roast !== defaults.roast || build.shotStyle !== defaults.shotStyle
        ? null
        : officialMatch
          ? (officialMatch.nutrition.caffeine ?? null)
          : (size.nutrition.caffeine ?? null),
    protein: officialMatch
      ? (officialMatch.nutrition.protein ?? null)
      : lines.length === 1
        ? size.nutrition.protein
        : null,
  };
}

export function orderText(build: DrinkBuild) {
  const base = snapshot.bases.find((item) => item.id === build.base)!;
  const name = (id: string) =>
    snapshot.options.find((option) => option.id === id)?.name;
  return [
    `${build.size} ${base.name}`,
    build.syrup &&
      build.pumps > 0 &&
      `${build.pumps} full pump(s) ${name(build.syrup)}`,
    build.milk && (isMilkDrink(build.base) ? name(build.milk) : `${splashLabels[milkServing(build).portion]} of ${name(build.milk)?.replace(/^Splash of /, "")}`),
    build.foam && `${build.foamPortion} ${name(build.foam)}`,
    ...activeExtras(build).map(([id, quantity]) => {
      const option = optionFor(id)!;
      return option.group === 'Espresso Shots' ? `Shots: ${quantity} total` : option.formCode === 'qty' ? `${quantity} × ${option.name}${option.unit ? ` (${option.unit})` : ''}` : officialExtraLabel(id, extraPortionFor(build, id));
    }),
    build.roast && `Espresso roast: ${name(build.roast)}`,
    build.shotStyle && `Espresso extraction: ${name(build.shotStyle)}`,
    ...Object.keys(standardBuild(build.base, build.size).extras || {}).filter(id => !build.extras?.[id]).map(id => `No ${name(id)}`),
    standardBuild(build.base, build.size).syrup && (build.syrup !== standardBuild(build.base, build.size).syrup || build.pumps === 0) && `No ${name(standardBuild(build.base, build.size).syrup)}`,
    `${base.hasIce ? 'Iced' : base.form === 'hot' ? 'Hot' : 'No ice'}; confirm ingredients and portions with your barista.`,
  ]
    .filter(Boolean)
    .join("\n");
}
