import { readBuilderDraft, saveBuilderDraft } from "../../data/builder-draft";
import { standardBuild, resizeBuild, isMilkDrink } from "../../data/drink-recipes";
import { readSavedOrders, writeSavedOrders } from "../../data/saved-orders";
import DrinkStarter from "./DrinkStarter";
import React, { useState, useRef, useEffect } from "react";
import { milkServing, estimateMilkSplash, availableMilkPortions, splashLabels } from "../../data/milk-splash";
import type { Splash } from "../../data/milk-splash";
import { MAX_MODIFIER_AMOUNT } from "../../data/customization-options";
import type { ExtraPortion } from "../../data/customization-options";
import { cupVisualFor } from "../../data/cup-size";
import type { DrinkBuild } from "../../data/nutrition";
import toast from "react-hot-toast";
import snapshot from "../../data/starbucks-us.json";
import {
  calculateNutrition,
  compatibleOptions,
  defaultBuild,
  fitnessPresets,
  orderText,
  officialFoamPresets,
  starbucksOrderUrl,
  reconcileExtras,
  normalizeSavedSyrupAmounts,
  normalizeSavedMilkPortion,
  normalizeSavedAppSettings,
} from "../../data/nutrition";
import DrinkAnimation from "./DrinkAnimation";
import ExtraCustomizations from "./ExtraCustomizations";
import MobileExtraSheet from "./MobileExtraSheet";
import ColdFoamSelector from "./ColdFoamSelector";
import IngredientLibrary from "./IngredientLibrary";
import { estimateForServing } from "../../data/ingredient-estimates";

type IngredientNode = { name: string; children?: IngredientNode[] };
const flattenIngredients = (nodes: IngredientNode[]): string =>
  nodes
    .map(
      (node) =>
        node.name +
        (node.children?.length
          ? ` (${flattenIngredients(node.children)})`
          : ""),
    )
    .join(", ");
const rounded = (value: number) => Math.round(value * 10) / 10;

export default function DrinkBuilder() {
  const [initialDraft] = useState(readBuilderDraft);
  const [build, setBuild] = useState<DrinkBuild>(initialDraft.build);
  const [saved, setSaved] = useState(false);
  const [savedOrders, setSavedOrders] = useState(readSavedOrders);
  const [orderName, setOrderName] = useState(initialDraft.name);
  useEffect(() => saveBuilderDraft(build, orderName), [build, orderName]);
  const ingredientRef = useRef<HTMLElement>(null);
  const chooseDrink = (next: DrinkBuild) => {
    setBuild(next); setSaved(false); setOrderName('');
    requestAnimationFrame(() => ingredientRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const [syrupReplay, setSyrupReplay] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const recipeRef = useRef<HTMLElement>(null);
  const [readingOrder, setReadingOrder] = useState(false);
  useEffect(() => {
    if (!recipeRef.current || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setReadingOrder(entry.isIntersecting));
    observer.observe(recipeRef.current);
    return () => observer.disconnect();
  }, []);
  const base = snapshot.bases.find((item) => item.id === build.base)!;
  const size = base.sizes.find((item) => item.name === build.size)!;
  const nutrition = calculateNutrition(build);
  const syrups = compatibleOptions(build.base, (group) => group === "Syrups" || group === "Liquid Sweeteners");
  const fullMilk = isMilkDrink(build.base);
  const milks = compatibleOptions(build.base, (group) => group === (fullMilk ? "Milk Options" : "Creamer"));
  const age = Math.floor(
    (Date.now() - Date.parse(snapshot.fetchedAt)) / 86400000,
  );

  const update = <K extends keyof DrinkBuild>(key: K, value: DrinkBuild[K]) => {
    setSaved(false);
    if (key === "base") setOrderName("");
    setBuild((previous) => {
      const next = { ...previous, [key]: value };
      if (key === 'base') return standardBuild(value as string, previous.size);
      if (key === 'size') return resizeBuild(previous, value as string);
      if (key === "base" || key === "syrup") {
        next.extras = reconcileExtras(previous.extras, next.base, next.syrup);
        next.extraPortions = Object.fromEntries(Object.entries(previous.extraPortions || {}).filter(([id]) => next.extras?.[id]));
        if (!next.extras["82"]) {
          next.roast = "";
          next.shotStyle = "";
        }
        for (const field of ["roast", "shotStyle"] as const) {
          if (
            next[field] &&
            !snapshot.options
              .find((option) => option.id === next[field])
              ?.compatibleBases.includes(next.base)
          )
            next[field] = "";
        }
      }
      if (key === 'milk') { next.milkPortion = previous.milk ? milkServing(previous).portion : 'regular'; delete next.milkMl; }
      if (key === 'milkPortion') delete next.milkMl;
      if (key === "foam") next.foamPortion = "regular";
      return next;
    });
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(orderText(build));
      toast.success("Order copied.");
    } catch {
      toast.error(
        "Clipboard unavailable. Select and copy the order text below.",
      );
    }
  };
  const save = () => {
    try {
      const name = orderName.trim() || `${build.size} ${base.name}`;
      const same = savedOrders.find(order => JSON.stringify(order.build) === JSON.stringify(build));
      const nextOrders = [{ id: same?.id || crypto.randomUUID(), name, build: structuredClone(build), createdAt: new Date().toISOString() }, ...savedOrders.filter(order => order.id !== same?.id)];
      writeSavedOrders(nextOrders);
      localStorage.setItem("genie-last-recipe", JSON.stringify(build));
      setSavedOrders(nextOrders);
      setSaved(true);
      toast.success("Order saved on this device. It is not saved to Starbucks.");
    } catch {
      toast.error("Storage unavailable. You can copy the order instead.");
    }
  };
  const restore = (selectedBuild?: DrinkBuild) => {
    try {
      const stored = selectedBuild || JSON.parse(
        localStorage.getItem("genie-last-recipe") || "null",
      );
      if (!stored) {
        toast.error("No saved recipe yet.");
        return;
      }
      const restored = normalizeSavedSyrupAmounts(stored);
      const restoredMilk = normalizeSavedMilkPortion(restored.build);
      const restoredSettings = normalizeSavedAppSettings(restoredMilk.build);
      const parsed = restoredSettings.build;
      if (
        !Number.isFinite(parsed.pumps) ||
        !Number.isInteger(parsed.pumps) ||
        parsed.pumps < 0 ||
        parsed.pumps > MAX_MODIFIER_AMOUNT ||
        !["light", "regular", "extra"].includes(parsed.foamPortion)
      )
        throw new Error("Invalid recipe");
      calculateNutrition(parsed);
      setBuild(parsed);
      setSaved(!restored.changed && !restoredMilk.changed && !restoredSettings.changed);
      if (restoredSettings.changed) toast("Saved recipe updated to the current standard recipe and portion settings. Review before saving.");
      if (restoredMilk.changed) toast("Saved milk amount converted to a splash size. Review before saving.");
      if (restored.changed)
        toast(
          "Saved syrup amounts rounded to whole pumps. Review before saving.",
        );
    } catch {
      toast.error(
        "Saved recipe is no longer available. Please build a new one.",
      );
    }
  };
  const optionLabel = (option: { id: string; name: string }, unit: string) => {
    const estimate = estimateForServing(
      option.id,
      build.size,
      option.id === build.foam ? build.foamPortion : "regular",
    );
    return `${option.name}${estimate ? ` · ~${Math.round(estimate.calories)} kcal/${unit}` : " · no estimate"}`;
  };

  const changeExtras = (extras: Record<string, number>) => {
    setSaved(false);
    setBuild((previous) => ({
      ...previous,
      extras,
      extraPortions: Object.fromEntries(Object.entries(previous.extraPortions || {}).filter(([id]) => extras[id])),
      roast: extras["82"] ? previous.roast : "",
      shotStyle: extras["82"] ? previous.shotStyle : "",
    }));
  };
  const changeExtraPortion = (id: string, portion: ExtraPortion) => { setSaved(false); setBuild(previous => ({ ...previous, extraPortions: { ...previous.extraPortions, [id]: portion } })); };
  const prepareExtra = (key: "roast" | "shotStyle", value: string) =>
    update(key, value);
  const calorieLabel = nutrition.complete
    ? `${nutrition.estimated ? "~" : ""}${Math.round(nutrition.calories)}`
    : `${Math.round(nutrition.calories)} + ?`;
  const selectedCount = Object.values(build.extras || {}).filter(
    (quantity) => quantity > 0,
  ).length;
  const viewRecipe = () => {
    recipeRef.current?.focus({ preventScroll: true });
    recipeRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  };
  return (
    <>
      <div className="builder-heading">
        <div>
          <span className="eyebrow">MIX SOMETHING THAT FITS YOU</span>
          <h1>Your cup, your way.</h1>
          <p className="muted">
            Build it. Watch it pour. See what goes into every sip.
          </p>
        </div>
        <span className="source-pill">
          US menu · checked {snapshot.fetchedAt.slice(0, 10)}
        </span>
      </div>
      {age > 7 && (
        <p role="status" className="notice">
          This menu snapshot is {age} days old. Check current availability at
          your local store.
        </p>
      )}
      <DrinkStarter selected={build.base} onChoose={chooseDrink} />
      <section className="preset-section" aria-label="Low calorie recipe ideas">
        <h2>Start light</h2>
        <p className="muted">
          Four lighter starting points, with quantities you can adjust.
        </p>
        <div className="preset-grid">
          {fitnessPresets.map((preset) => {
            const result = calculateNutrition(preset.build);
            return (
              <button
                key={preset.id}
                className="preset-card"
                onClick={() => {
                  setBuild({ ...preset.build });
                  setSaved(false);
                }}
              >
                <strong>{preset.name}</strong>
                <span>
                  {result.estimated ? "~" : ""}
                  {Math.round(result.calories)} kcal
                </span>
                <small>{preset.note}</small>
              </button>
            );
          })}
        </div>
      </section>
      <details className="official-foam-section">
        <summary>Try a verified cold foam recipe</summary>
        <p className="muted">
          Official totals apply to the complete recipe, including its default
          vanilla syrup.
        </p>
        <div className="preset-grid">
          {officialFoamPresets.map((recipe) => (
            <button
              key={recipe.id}
              className="preset-card"
              onClick={() => {
                setBuild({ ...recipe.build } as DrinkBuild);
                setSaved(false);
              }}
            >
              <strong>{recipe.name}</strong>
              <span>{recipe.nutrition.calories} kcal</span>
              <small>
                {recipe.build.size} · {recipe.build.pumps} vanilla pumps ·
                regular foam
              </small>
            </button>
          ))}
        </div>
      </details>
      <IngredientLibrary />
      <div className={`builder-grid${readingOrder ? " reading-order" : ""}`}>
        <section
          ref={ingredientRef}
          className="panel ingredient-panel"
          aria-label="Customize ingredients"
        >
          <div className="panel-heading">
            <h2>Make it yours</h2>
            <button
              className="text-button"
              onClick={() => {
                setBuild(standardBuild(build.base, build.size));
                setSaved(false);
              }}
            >
              Reset
            </button>
          </div>
          <div className="field-row">
            <label>
              Base
              <select
                value={build.base}
                onChange={(event) => update("base", event.target.value)}
              >
                {['Coffee & espresso', 'Tea', 'Refreshers'].map(category => <optgroup label={category} key={category}>{snapshot.bases.filter(item => item.category === category).map(item => <option value={item.id} key={item.id}>{item.name}{item.form === 'hot' ? ' · Hot' : ''}</option>)}</optgroup>)}
              </select>
            </label>
            <label>
              Size
              <select
                value={build.size}
                onChange={(event) => update("size", event.target.value)}
              >
                {base.sizes.map((item) => (
                  <option key={item.name} value={item.name}>{item.name} · {cupVisualFor(item.name, base.form).flOz} fl oz</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Syrup
            <select
              value={build.syrup}
              onChange={(event) => update("syrup", event.target.value)}
            >
              <option value="">No syrup</option>
              {syrups.map((item) => (
                <option key={item.id} value={item.id}>
                  {optionLabel(item, "full pump")}
                </option>
              ))}
            </select>
          </label>
          {build.syrup && <div className="primary-pump-control" role="group" aria-label="Syrup pump count"><span>Syrup pumps</span><div className="pump-buttons"><button aria-label="Decrease syrup pumps" disabled={build.pumps === 0} onClick={() => update('pumps', build.pumps - 1)}>−</button><output aria-label="Syrup pumps">{build.pumps}</output><button aria-label="Increase syrup pumps" disabled={build.pumps >= MAX_MODIFIER_AMOUNT} onClick={() => update('pumps', build.pumps + 1)}>+</button></div></div>}
          {build.syrup && build.pumps > 0 && (
            <button type="button" className="replay-syrup-button" onClick={() => setSyrupReplay((value) => value + 1)}>
              Replay syrup animation
            </button>
          )}
          <label>
            {fullMilk ? "Milk" : "Milk / creamer"}
            <select
              value={build.milk}
              onChange={(event) => update("milk", event.target.value)}
            >
              {!fullMilk && <option value="">No milk</option>}
              {milks.map((item) => (
                <option key={item.id} value={item.id}>
                  {fullMilk ? item.name : `${item.name} · ~${Math.round(estimateMilkSplash(item.id, { ...build, milk: item.id, milkMl: undefined, milkPortion: build.milk ? milkServing(build).portion : "regular" })?.calories || 0)} kcal / splash`}
                </option>
              ))}
            </select>
          </label>
          {build.milk && !fullMilk && (
            <label>
              Milk amount
              <select
                value={milkServing(build).portion}
                onChange={(event) =>
                  update("milkPortion", event.target.value as Splash)
                }
              >
                {availableMilkPortions(build.milk).map(portion => <option value={portion} key={portion}>{splashLabels[portion]}</option>)}
              </select>
            </label>
          )}
          <p className="muted small standard-recipe-note">The standard {base.name} recipe is included. Change its milk, syrup, shots, and toppings below; standard ingredients are not counted twice.</p>
          <ColdFoamSelector
            build={build}
            onFoamChange={(value) => update("foam", value)}
            onPortionChange={(value) => update("foamPortion", value)}
          />
          <div className="desktop-extra-picker">
            <ExtraCustomizations
              key={build.base}
              build={build}
              onChange={changeExtras}
        onPortionChange={changeExtraPortion}
              onPreparation={prepareExtra}
            />
          </div>
          <button
            className="mobile-extra-launcher"
            onClick={() => setPickerOpen(true)}
          >
            <span>
              <strong>Flavors & toppings</strong>
              <small>
                {selectedCount
                  ? `${selectedCount} extras in your cup`
                  : "Sauces, espresso, fruit & more"}
              </small>
            </span>
            <span className="launcher-plus" aria-hidden="true">
              +
            </span>
          </button>
          <p className="muted small">{fullMilk ? 'Milk replaces the drink’s standard milk; it is not an extra splash. Nutrition changes use approximate ingredient portions and a broad milk-volume model. The unchanged standard recipe keeps its official total.' : 'Estimates use full syrup pumps and splash choices. Foam sizes, splash volumes, and light / extra multipliers are assumptions. Store pours and half pumps differ.'} Confirm the final recipe and portions in Starbucks.</p>
        </section>
        <section className="panel preview-panel" aria-label="Drink preview">
          <DrinkAnimation build={build} replaySyrup={syrupReplay} />
          <div className="nutrition-summary" aria-live="polite">
            <strong>
              {nutrition.complete
                ? nutrition.estimated
                  ? `~${Math.round(nutrition.calories)}`
                  : Math.round(nutrition.calories)
                : `${Math.round(nutrition.calories)} + ?`}
              <span> kcal</span>
            </strong>
            <p>
              {nutrition.complete
                ? nutrition.estimated
                  ? "Estimated total"
                  : nutrition.officialMatch
                    ? "Official matched recipe"
                    : "Official standard recipe"
                : "Incomplete total · some additions have no calorie data"}
            </p>
            {nutrition.estimated && (
              <p className="estimate-range">
                Planning range: {Math.floor(nutrition.low)}–
                {Math.ceil(nutrition.high)} kcal
                {!nutrition.complete ? " + unmodeled additions" : ""}
              </p>
            )}
            <div className="macro-row">
              <span>
                Sugar{" "}
                {nutrition.sugar === null
                  ? "unknown"
                  : `${nutrition.estimated ? "~" : ""}${rounded(nutrition.sugar)} g`}
              </span>
              <span>
                Caffeine{" "}
                {nutrition.caffeine === null
                  ? "unknown"
                  : `${nutrition.caffeine} mg`}
              </span>
            </div>
          </div>
          {nutrition.officialMatch && (
            <p className="muted small">
              Matches {nutrition.officialMatch.name}, including{" "}
              {nutrition.officialMatch.build.pumps} vanilla pumps. Changing the
              recipe removes this official total.
            </p>
          )}
          {!nutrition.complete && (
            <p className="notice" role="status">
              Unknown does not mean zero. Some additions have no estimation
              model yet. The displayed range excludes them.
            </p>
          )}
        </section>
        <section
          className="panel recipe-panel"
          ref={recipeRef}
          tabIndex={-1}
          aria-label="Your recipe"
        >
          <h2>Your order</h2>
          <pre className="order-text">{orderText(build)}</pre>
          <label className="order-name">Order name (optional)<input value={orderName} maxLength={80} onChange={event => { setOrderName(event.target.value); setSaved(false); }} placeholder={`${build.size} ${base.name}`} /></label>
          <div className="actions">
            <button className="primary-button" onClick={copy}>
              Copy order
            </button>
            <a
              className="secondary-button"
              href={starbucksOrderUrl(build)}
              target="_blank"
              rel="noreferrer"
            >
              Open Starbucks menu
            </a>
            <button className="secondary-button" onClick={save}>
              {saved ? "Saved ✓" : "Save order"}
            </button>
            <button className="text-button" onClick={() => restore()}>
              Load saved
            </button>
          </div>
          <p className="muted small">Save order keeps a copy on this device. Open Starbucks menu opens the drink’s official page; it does not transfer customizations or save a Starbucks favorite. Copy the order, then apply your choices in Starbucks.</p>
          {!!savedOrders.length && <details className="saved-orders"><summary>Saved orders · {savedOrders.length}</summary><ul>{savedOrders.map(order => <li key={order.id}><button className="text-button" onClick={() => { restore(order.build); setOrderName(order.name); }}>{order.name}</button><button className="text-button" aria-label={`Delete saved order ${order.name}`} onClick={() => { try { const next = savedOrders.filter(item => item.id !== order.id); writeSavedOrders(next); setSavedOrders(next); setSaved(false); } catch { toast.error('Could not update saved orders.'); } }}>Remove</button></li>)}</ul></details>}
          <h3>
            {nutrition.officialMatch
              ? "Ingredient reference"
              : "Calorie breakdown"}
          </h3>
          {nutrition.officialMatch && (
            <p className="muted small">
              The total comes from the official whole drink, not the sum of
              these component estimates. Individual foam calories remain
              unverified.
            </p>
          )}
          {nutrition.lines.length > 1 && <p className="muted small">The official standard drink is the starting total. Lines below show only your additions, removals, or substitutions.</p>}
          <ul className="calorie-list">
            {nutrition.lines.map((line) => (
              <li key={line.name}>
                <span>
                  {line.name}
                  {line.status !== "official" && (
                    <small>
                      {line.quantity} × {line.unit}
                    </small>
                  )}
                  <small>
                    {line.status === "official"
                      ? "Official · selected size"
                      : line.status === "estimate"
                        ? "Estimate · low confidence"
                        : "No verified portion data"}
                  </small>
                </span>
                <strong>
                  {line.calories === null
                    ? "?"
                    : `${line.status === "estimate" ? "~" : ""}${rounded(line.calories)}`}{" "}
                  kcal
                  {line.status === "estimate" &&
                    line.low !== null &&
                    line.high !== null && (
                      <small>
                        {Math.floor(line.low)}–{Math.ceil(line.high)}
                      </small>
                    )}
                </strong>
              </li>
            ))}
          </ul>
          <details>
            <summary>Ingredients, sources & assumptions</summary>
            <p>
              <a
                href={nutrition.officialMatch?.source || base.source}
                target="_blank"
                rel="noreferrer"
              >
                Official Starbucks product & nutrition
              </a>{" "}
              · US · snapshot {snapshot.fetchedAt.slice(0, 10)}
            </p>
            <p>
              <strong>
                {nutrition.officialMatch
                  ? "Matched drink ingredient declaration:"
                  : "Base ingredient declaration:"}
              </strong>{" "}
              {flattenIngredients(
                nutrition.officialMatch?.ingredients || size.ingredients,
              ) || "Not provided"}
            </p>
            {size.allergens?.text && <p>{size.allergens.text}</p>}
            {nutrition.lines
              .filter((line) => line.status !== "official")
              .map((line) => (
                <p key={line.name}>
                  <strong>{line.name}:</strong>{" "}
                  {line.basis || "No verified nutrition estimate."}
                  {line.sources?.map((source) => (
                    <a
                      className="estimate-source"
                      key={source.url}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {source.title}
                    </a>
                  ))}{" "}
                  The official option response does not provide a separate
                  ingredient declaration; check the current product page or ask
                  your barista.
                </p>
              ))}
            <p>
              Milk and foam may contain dairy, nuts, soy, or other allergens.
              This calculator cannot determine allergen safety. Protein foam
              names are official menu labels; this app does not infer protein
              macros from names.
            </p>
            <p>
              Menu availability varies by store. The preview is illustrative and
              does not represent actual portions. Estimates are planning
              assumptions, not official Starbucks custom recipe nutrition.
            </p>
          </details>
        </section>
      </div>
      <div className="mobile-build-bar" aria-label="Drink actions">
        <div className="bar-nutrition" aria-live="polite">
          <strong>
            {calorieLabel}
            <span> kcal</span>
          </strong>
          <small>{nutrition.estimated ? "Estimated" : "Official"}</small>
        </div>
        <button
          className="secondary-button"
          onClick={() => setPickerOpen(true)}
        >
          Add extras{selectedCount ? ` · ${selectedCount}` : ""}
        </button>
        <button className="primary-button" onClick={viewRecipe}>
          View recipe
        </button>
      </div>
      <MobileExtraSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        build={build}
        onChange={changeExtras}
        onPortionChange={changeExtraPortion}
        onPreparation={prepareExtra}
        calorieLabel={calorieLabel}
        estimated={nutrition.estimated}
      />
    </>
  );
}
