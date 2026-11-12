import React, { useState, useRef } from "react";
import type { DrinkBuild } from "../../data/nutrition";
import {
  availableExtras,
  compatibleOptions,
  extraQuantityStep,
} from "../../data/nutrition";
import { estimateForServing } from "../../data/ingredient-estimates";
import snapshot from "../../data/starbucks-us.json";
import { MAX_MODIFIER_AMOUNT, isPortionOption, portionChoices, extraPortionFor } from "../../data/customization-options";
import type { ExtraPortion } from "../../data/customization-options";

type Props = {
  build: DrinkBuild;
  onChange: (extras: Record<string, number>) => void;
  onPortionChange: (id: string, portion: ExtraPortion) => void;
  onPreparation: (key: "roast" | "shotStyle", value: string) => void;
};
const categories = [
  { label: "Syrups", groups: ["Syrups"] },
  { label: "Sauces", groups: ["Sauces"] },
  { label: "Toppings", groups: ["Topping Options"] },
  { label: "Drizzle", groups: ["Drizzle"] },
  { label: "Powders", groups: ["Powders"] },
  { label: "Whipped cream", groups: ["Whipped Cream"] },
  { label: "Line the cup", groups: ["Line the Cup"] },
  { label: "Espresso", groups: ["Espresso Shots"] },
  { label: "Fruit add-ins", groups: ["Fruit Add-Ins"] },
  { label: "Pearls", groups: ["Flavored Pearls"] },
  { label: "Juice", groups: ["Juice Options", "Lemonade"] },
  { label: "Chai", groups: ["Chai Teas"] },
  { label: "Tea powders", groups: ["Tea Powders"] },
  { label: "Refresher bases", groups: ["Starbucks Refreshers Bases", "Extra Starbucks Refreshers Bases"] },
  { label: "Liquid sweeteners", groups: ["Liquid Sweeteners"] },
  { label: "Sweetener packets", groups: ["Sweetener Packets"] },
];
const quickPicks = [
  "650",
  "126",
  "82",
  "207",
  "96",
  "2122694",
  "2122719",
  "2121344",
  "2123075",
  "47",
  "55",
];

export default function ExtraCustomizations({
  build,
  onChange,
  onPreparation,
  onPortionChange,
}: Props) {
  const [search, setSearch] = useState("");
  const tabsRef = useRef<HTMLDivElement>(null);
  const [category, setCategory] = useState("All");
  const [editingPortion, setEditingPortion] = useState("");
  const [expanded, setExpanded] = useState(false);
  const all = availableExtras(build.base).filter(
    (option) => option.id !== build.syrup,
  );
  const extras = Object.entries(build.extras || {}).filter(
    ([, quantity]) => quantity > 0,
  );
  const offeredCategories = categories.filter((category) =>
    all.some((option) => category.groups.includes(option.group)),
  );
  const currentCategory =
    (category === "Selected" && extras.length > 0) ||
    offeredCategories.some((item) => item.label === category)
      ? category
      : "All";
  const query = search.trim().toLowerCase();
  const matches = all.filter((option) => {
    const inCategory =
      currentCategory === "All" ||
      (currentCategory === "Selected"
        ? (build.extras?.[option.id] || 0) > 0
        : categories
            .find((category) => category.label === currentCategory)
            ?.groups.includes(option.group));
    const keywords = /Mocha|Chocolate/.test(option.name) ? " chocolate" : "";
    return (
      inCategory &&
      `${option.name} ${option.group}${keywords}`.toLowerCase().includes(query)
    );
  });
  const showQuickPicks = currentCategory === "All" && !query && !expanded;
  const visible = showQuickPicks
    ? [...matches]
        .sort((a, b) => {
          const left = quickPicks.indexOf(a.id),
            right = quickPicks.indexOf(b.id);
          return (left < 0 ? 999 : left) - (right < 0 ? 999 : right);
        })
        .slice(0, 6)
    : matches;
  const setQuantity = (id: string, quantity: number) => {
    const next = { ...build.extras };
    const option = snapshot.options.find(item => item.id === id);
    if (quantity > 0 && option?.formCode === 'one') {
      for (const key of Object.keys(next)) if (key !== id && snapshot.options.find(item => item.id === key)?.group === option.group) delete next[key];
    }
    if (quantity <= 0) delete next[id];
    else next[id] = quantity;
    onChange(next);
  };
  const chooseCategory = (name: string) => {
    setCategory(name);
    setSearch("");
    setExpanded(name !== "All");
  };
  const roasts = compatibleOptions(
    build.base,
    (name) => name === "Espresso Roast Options",
  );
  const styles = compatibleOptions(
    build.base,
    (name) => name === "Ristretto or Long Shot",
  );

  return (
    <section className="extra-customizations" aria-label="Extra customizations">
      <div className="extra-picker-heading">
        <h3>More flavors & toppings</h3>
        <span>{all.length} options</span>
      </div>
      <div className="extra-search">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m16 16 5 5" />
        </svg>
        <input
          type="search"
          aria-label="Search extra ingredients"
          value={search}
          placeholder="Search mocha, caramel, pearls…"
          onChange={(event) => {
            setSearch(event.target.value);
            setCategory("All");
            setExpanded(true);
            if (tabsRef.current) tabsRef.current.scrollLeft = 0;
          }}
        />
        {search && (
          <button
            aria-label="Clear ingredient search"
            onClick={() => setSearch("")}
          >
            ×
          </button>
        )}
      </div>
      <div
        className="extra-category-tabs"
        role="group"
        aria-label="Ingredient categories"
        ref={tabsRef}
      >
        <button
          aria-pressed={currentCategory === "All"}
          onClick={() => chooseCategory("All")}
        >
          All
        </button>
        {extras.length > 0 && (
          <button
            aria-pressed={currentCategory === "Selected"}
            onClick={() => chooseCategory("Selected")}
          >
            Selected {extras.length}
          </button>
        )}
        {offeredCategories.map((item) => (
          <button
            key={item.label}
            aria-pressed={currentCategory === item.label}
            onClick={() => chooseCategory(item.label)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div
        className="selected-extra-strip"
        aria-label="Selected extra ingredients"
      >
        {extras.length === 0 ? (
          <span className="extra-empty-hint">Tap + to add an ingredient</span>
        ) : (
          extras.map(([id, quantity]) => {
            const option = snapshot.options.find((option) => option.id === id)!;
            return (
              <span className="selected-extra-chip" key={id}>
                <span title={option.name}>
                  {option.name} × {quantity}
                </span>
                <button
                  aria-label={`Remove ${option.name}`}
                  onClick={() => setQuantity(id, 0)}
                >
                  ×
                </button>
              </span>
            );
          })
        )}
      </div>
      <p className="extra-results-label">
        {showQuickPicks ? "Quick picks" : `${matches.length} ingredients`}
        <span>Estimated kcal per serving</span>
      </p>
      <ul
        className={`extra-catalog ${showQuickPicks ? "quick-picks" : "all-extras"}`}
        aria-label="Extra ingredient choices"
      >
        {visible.map((option) => {
          const quantity = build.extras?.[option.id] || 0;
          const step = extraQuantityStep(option.id);
          const estimate = estimateForServing(option.id, build.size);
          return (
            <li
              key={option.id}
              className={
                quantity ? "ingredient-choice is-selected" : "ingredient-choice"
              }
            >
              <div className="ingredient-choice-copy">
                <strong>{option.name}</strong>
                <small>
                  {estimate
                    ? `~${Math.round(estimate.calories)} kcal · estimate`
                    : "No estimate available"}
                </small>
              </div>
              {quantity > 0 && option.formCode !== 'qty' ? <button className="modifier-amount" aria-label={`Amount for ${option.name}`} onClick={() => option.formCode === 'modifier' ? setEditingPortion(editingPortion === option.id ? '' : option.id) : setQuantity(option.id, 0)}>{option.formCode === 'modifier' ? extraPortionFor(build, option.id) : 'Selected ✓'} {option.formCode === 'modifier' && <span aria-hidden="true">⌄</span>}</button> : <div className="ingredient-stepper">
                {quantity > 0 ? (
                  <button
                    aria-label={`Decrease ${option.name}`}
                    onClick={() =>
                      setQuantity(option.id, Math.max(0, quantity - step))
                    }
                  >
                    −
                  </button>
                ) : (
                  <span />
                )}
                <output aria-label={`${option.name} quantity`}>
                  {quantity > 0 ? quantity : ""}
                </output>
                <button
                  className="ingredient-add"
                  aria-label={`${quantity > 0 ? "Increase" : "Add"} ${option.name}`}
                  disabled={quantity >= MAX_MODIFIER_AMOUNT}
                  onClick={() =>
                    setQuantity(option.id, quantity > 0 ? quantity + step : 1)
                  }
                >
                  +
                </button>
              </div>}
              {isPortionOption(option.id) && quantity > 0 && editingPortion === option.id && <div className="modifier-portions" role="group" aria-label={`Portion for ${option.name}`}>{portionChoices(option.id).map(portion => <button key={portion} aria-pressed={extraPortionFor(build, option.id) === portion} onClick={() => { onPortionChange(option.id, portion); setEditingPortion(''); }}>{portion}</button>)}<button onClick={() => setQuantity(option.id, 0)}>Remove</button></div>}
            </li>
          );
        })}
      </ul>
      {visible.length === 0 && (
        <p className="extra-no-results" role="status">
          No ingredients found. Try another name or category.
        </p>
      )}
      {showQuickPicks && matches.length > visible.length && (
        <button className="extra-show-all" onClick={() => setExpanded(true)}>
          See all {matches.length} options{" "}
          <svg
            aria-hidden="true"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M1 6h9M6 2l4 4-4 4" />
          </svg>
        </button>
      )}
      {!!build.extras?.["82"] && (
        <details className="espresso-preparation">
          <summary>Espresso options</summary>
          {roasts.length > 0 && (
            <label>
              Added espresso roast
              <select
                value={build.roast || ""}
                onChange={(event) => onPreparation("roast", event.target.value)}
              >
                <option value="">Default roast</option>
                {roasts.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {styles.length > 0 && (
            <label>
              Added espresso extraction
              <select
                value={build.shotStyle || ""}
                onChange={(event) =>
                  onPreparation("shotStyle", event.target.value)
                }
              >
                <option value="">Default extraction</option>
                {styles.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <p className="muted small">
            These choices apply to added espresso. Caffeine is not verified.
          </p>
        </details>
      )}
      <p className="extra-serving-note">
        Counts and portion choices follow the official menu. Nutrition remains an estimate.
      </p>
    </section>
  );
}
