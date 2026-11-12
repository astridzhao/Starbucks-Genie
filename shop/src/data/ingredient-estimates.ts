import snapshot from "./starbucks-us.json";

export type Estimate = {
  calories: number;
  low: number;
  high: number;
  sugar: number | null;
  unit: string;
  basis: string;
  method: "generic" | "analogy" | "recipe-derived" | "noncaloric";
  confidence: "medium" | "low";
  sources: { title: string; url: string }[];
};
type Option = (typeof snapshot.options)[number];
const sources = {
  energy: {
    title: "FDA: food energy factors (method only)",
    url: "https://www.fda.gov/media/81606/download",
  },
  uk: {
    title: "Starbucks UK ingredient guide — regional analogy only",
    url: "https://www.starbucks.co.uk/sites/starbucks-uk-pwa/files/2026-04/SUM26_UK_AllergenBook_CORE_BEVERAGE_v02.pdf",
  },
  dairy: {
    title: "Darigold 2% milk — generic dairy reference",
    url: "https://www.darigold.com/product/2-reduced-fat-milk/",
  },
  cream: {
    title: "Land O’Lakes whipped cream recipe — generic reference",
    url: "https://www.landolakes.com/recipe/9419/sweetened-whipped-cream/",
  },
};
const controlGroups = new Set([
  "Cup Sizes",
  "Espresso Roast Options",
  "Ristretto or Long Shot",
  "Room",
  "Shot Prep",
  "Other",
  "Milk Foam",
  "Milk Temperature",
  "Caffeine Options",
  "Preparation Method",
]);
export const isPreparation = (option: Option) =>
  controlGroups.has(option.group);
const make = (
  calories: number,
  low: number,
  high: number,
  unit: string,
  basis: string,
  sugar: number | null = null,
  method: Estimate["method"] = "generic",
  refs = [sources.energy],
): Estimate => ({
  calories,
  low,
  high,
  unit,
  basis,
  sugar,
  method,
  confidence: "low",
  sources: refs,
});

// Explicit planning assumptions; none of these are official US modifier labels.
// Range endpoints are scenario bounds, not statistical confidence intervals.
export function estimateIngredient(option: Option): Estimate | null {
  const { id, group, name } = option;
  if (isPreparation(option)) return null;
  if (group === 'Iced Tea') return make(0, 0, 5, 'tea splash', 'Assumes unsweetened brewed tea with trace food energy; adding sweetener is modeled separately.', 0, 'analogy');
  if (group === "Ice" || group === "Water")
    return make(
      0,
      0,
      0,
      "as desired",
      "Water / ice contributes no food energy; it changes dilution and cup volume.",
      0,
      "noncaloric",
    );
  if (group === "Syrups" || group === "Liquid Sweeteners") {
    if (name.includes("Sugar-Free"))
      return make(
        0,
        0,
        5,
        "full pump (~10 mL)",
        "Sugar-free syrup planning model. Trace energy and pump size can vary; zero is a rounded central estimate.",
        0,
        "analogy",
        [sources.uk],
      );
    return make(
      20,
      15,
      30,
      "full pump (~10 mL)",
      "Assumes about 5 g carbohydrate per full pump, at 4 kcal/g. Flavor and dispensing pumps vary; a half pump is not a full pump.",
      5,
      "analogy",
      [sources.energy, sources.uk],
    );
  }
  if (group === "Milk Options") {
    const sourceIds: Record<string, string> = { '63': '50', '67': '51', '61': '199', '65': '198', '66': '53', '2121965': '2121966', '2122556': '2123466', '64': '52', '1306': '873068665', '2123684': '2121866', '2123875': '2123906' };
    const creamer = snapshot.options.find(option => option.id === sourceIds[id]);
    if (creamer) return estimateIngredient(creamer);
    if (name.includes('Protein')) return make(65, 45, 100, '100 mL', 'Unverified protein-enriched milk density assumption. Used only for a scenario estimate; no protein grams inferred from the name.');
    return null;
  }
  if (group === "Creamer") {
    const milk: Record<string, [number, number, number, number | null]> = {
      "50": [50, 40, 65, 5],
      "51": [62, 55, 75, 5],
      "199": [35, 30, 45, 5],
      "198": [130, 110, 160, 4],
      "53": [340, 300, 400, 3],
      "2121966": [25, 15, 45, 1.25],
      "2123466": [50, 40, 75, null],
      "52": [55, 35, 80, null],
      "873068665": [35, 20, 70, null],
      "2121866": [230, 150, 320, null],
      "2123906": [170, 100, 260, null],
    };
    const values = milk[id];
    if (!values) return null;
    return make(
      values[0],
      values[1],
      values[2],
      "100 mL",
      "Generic milk / creamer energy-density assumption, scaled by measured mL. Not a verified Starbucks brand label; a cafe splash is not a fixed mL serving.",
      values[3],
      "generic",
      [sources.dairy, sources.cream],
    );
  }
  if (group.includes("Cold Foam")) {
    const anchor = snapshot.standardRecipes.find(
      (recipe) => recipe.build.foam === id && recipe.build.size === "Grande",
    );
    if (anchor) {
      const base = snapshot.bases.find(
        (base) => base.id === anchor.build.base,
      )!;
      const kcal = base.sizes.find((size) => size.name === "Grande")!.nutrition
        .calories;
      const residual =
        anchor.nutrition.calories - kcal - anchor.build.pumps * 20;
      return make(
        residual,
        Math.max(0, residual * 0.75 - 10),
        residual * 1.25 + 10,
        "regular Grande foam portion",
        `Residual model: official ${anchor.nutrition.calories} kcal whole drink minus ${kcal} kcal base and ${anchor.build.pumps} × estimated 20 kcal vanilla pumps. Foam itself is not separately measured. Bounds include syrup and serving uncertainty.`,
        null,
        "recipe-derived",
        [
          {
            title: "US standard drink used in residual model",
            url: anchor.source,
          },
          sources.energy,
        ],
      );
    }
    const protein = group.startsWith("Protein");
    const nondairy = group.startsWith("Nondairy");
    const vanilla = name.includes("Vanilla");
    const calories = protein
      ? 210
      : nondairy
        ? vanilla
          ? 115
          : 135
        : name.includes("Mascarpone")
          ? 180
          : vanilla
            ? 135
            : 155;
    return make(
      calories,
      Math.max(0, calories * 0.6),
      calories * 1.5,
      "regular Grande foam portion",
      `Low-confidence ${protein ? "protein cream" : nondairy ? "nondairy cream" : "sweet cream"} family model. Assumes a regular Grande foam serving; flavor solids, cream content, aeration and the pour are unverified. ${protein ? "The model includes additional energy for protein-containing ingredients; no protein grams are inferred from the name." : ""}`,
      null,
      "analogy",
      [sources.uk, sources.cream],
    );
  }
  if (group === "Sauces") {
    const rich = id === "112" || id === "2122694";
    return make(
      rich ? 60 : 35,
      rich ? 35 : 20,
      rich ? 85 : 55,
      "sauce portion (~15 g)",
      "Assumed 15 g sauce portion. White chocolate / dark caramel use a richer family model. Cafe pump weight is unverified.",
      null,
      "analogy",
      [sources.uk, sources.energy],
    );
  }
  if (group === "Drizzle" || group === "Line the Cup") {
    const lined = group === "Line the Cup";
    return make(
      lined ? 45 : 15,
      lined ? 20 : 5,
      lined ? 80 : 30,
      lined ? "cup lining (~15 g)" : "drizzle (~5 g)",
      "Assumed sauce weight, not a standardized Starbucks pour. A heavier coating changes the result.",
      null,
      "analogy",
      [sources.uk],
    );
  }
  if (
    group === "Powders" ||
    group === "Tea Powders" ||
    group === "Topping Options"
  ) {
    const spice = /Cinnamon Powder|Pumpkin Spice/.test(name);
    const matcha = group === "Tea Powders";
    const grams = spice ? 0.5 : matcha ? 2 : 5;
    return make(
      spice ? 1 : matcha ? 5 : 20,
      spice ? 0 : matcha ? 2 : 10,
      spice ? 3 : matcha ? 10 : 35,
      `${grams} g portion`,
      "Generic powder / topping model with an explicit assumed weight. Sugar, fat and scoop sizes differ; not a verified cafe serving.",
      null,
      "analogy",
      [sources.uk, sources.energy],
    );
  }
  if (group === "Sweetener Packets") {
    if (id === "56" || id === "2123370")
      return make(
        2,
        0,
        5,
        "packet (~1 g)",
        "Generic tabletop sweetener packet, including possible carrier calories. Retail rounding may show zero.",
        0,
      );
    if (id === "55")
      return make(
        21,
        15,
        30,
        "honey packet (~7 g)",
        "Assumes 7 g honey per packet; brand and packet weight are unverified.",
        null,
      );
    return make(
      16,
      12,
      20,
      "sugar packet (~4 g)",
      "Assumes 4 g sugar per packet at 4 kcal/g.",
      4,
    );
  }
  if (group === "Espresso Shots")
    return make(
      5,
      0,
      10,
      "espresso shot",
      "Coffee energy planning estimate per espresso shot. Roast and extraction do not identify an exact nutrient value.",
    );
  if (group === "Whipped Cream")
    return make(
      50,
      25,
      100,
      "topping (~30 mL whipped)",
      "Assumes about 2 tablespoons of whipped topping; the reference home recipe has 25 kcal/tablespoon. Cafe recipe and overrun may differ.",
      null,
      "analogy",
      [sources.cream],
    );
  if (group === "Chai Teas")
    return make(
      20,
      10,
      35,
      "concentrate portion (~10 mL)",
      "Sweetened chai concentrate planning model. Cafe concentrate dilution and pump size are unverified.",
      null,
    );
  if (group === "Fruit Add-Ins")
    return name.includes("Puree")
      ? make(
          20,
          10,
          40,
          "puree portion (~30 mL)",
          "Generic sweetened fruit puree assumption; no verified cafe scoop size.",
          null,
        )
      : make(
          10,
          5,
          20,
          "fruit inclusion portion (~2 g)",
          "Generic dried fruit assumption with an explicit 2 g portion; scoop volume is unverified.",
          null,
        );
  if (group === "Flavored Pearls")
    return make(
      40,
      20,
      80,
      "pearls portion (~30 g)",
      "Generic sweetened fruit pearls model; syrup carry-over and scoop weight are unverified.",
      null,
    );
  if (group === "Juice Options" || group === "Lemonade")
    return make(
      50,
      30,
      80,
      "100 mL",
      "Generic sweetened juice-blend energy density, not a Starbucks juice label.",
      null,
    );
  if (group === "Starbucks Refreshers Bases" || group === "Extra Starbucks Refreshers Bases")
    return make(
      80,
      40,
      140,
      "100 mL concentrate",
      "Very low-confidence sweetened concentrate model before dilution. Do not apply to 100 mL of a finished Refresher.",
      null,
    );
  return null; // Unknown future categories must not silently become zero.
}

export const ingredientCatalog = snapshot.options.map((option) => ({
  ...option,
  preparation: isPreparation(option),
  estimate: estimateIngredient(option),
}));
export const ingredientEstimates = Object.fromEntries(
  ingredientCatalog
    .filter((row) => row.estimate)
    .map((row) => [row.id, row.estimate!]),
) as Record<string, Estimate>;

export function estimateForServing(
  id: string,
  size: string,
  portion = "regular",
): Estimate | null {
  const estimate = ingredientEstimates[id];
  if (!estimate) return null;
  const option = snapshot.options.find((option) => option.id === id)!;
  if (!option.group.includes("Cold Foam")) return estimate;
  const anchor = snapshot.standardRecipes.find(
    (recipe) => recipe.build.foam === id && recipe.build.size === size,
  );
  const portionFactor = (
    { light: 0.65, regular: 1, extra: 1.5 } as Record<string, number>
  )[portion];
  if (!portionFactor) return null;
  let result = { ...estimate };
  if (anchor) {
    const base = snapshot.bases.find((base) => base.id === anchor.build.base)!;
    const baseCalories = base.sizes.find((s) => s.name === size)!.nutrition
      .calories;
    const residual =
      anchor.nutrition.calories - baseCalories - anchor.build.pumps * 20;
    result = {
      ...result,
      calories: residual,
      low: Math.max(0, residual * 0.75 - 10),
      high: residual * 1.25 + 10,
      basis: `For ${size}: ${anchor.nutrition.calories} kcal official whole drink − ${baseCalories} kcal base − ${anchor.build.pumps} × assumed 20 kcal syrup. Foam calories are a residual estimate, not an official modifier value.`,
    };
  } else {
    const factor = (
      { Short: 0.6, Tall: 0.8, Grande: 1, Venti: 1.2, Trenta: 1.4 } as Record<
        string,
        number
      >
    )[size];
    if (!factor) return null;
    result = {
      ...result,
      calories: result.calories * factor,
      low: result.low * factor,
      high: result.high * factor,
      basis: `${result.basis} Assumed ${size} multiplier ×${factor}; no verified size-specific foam weight.`,
    };
  }
  return {
    ...result,
    calories: result.calories * portionFactor,
    low: result.low * portionFactor,
    high: result.high * portionFactor,
    unit: `${portion} ${size} foam portion`,
    basis: `${result.basis} ${portion} portion uses heuristic ×${portionFactor}.`,
  };
}
