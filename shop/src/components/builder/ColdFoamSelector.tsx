import React, { useEffect, useState } from "react";
import type { DrinkBuild } from "../../data/nutrition";
import { compatibleOptions } from "../../data/nutrition";
import { estimateForServing } from "../../data/ingredient-estimates";

const foamTypes = [
  { group: "Cold Foam", label: "Cold foam" },
  { group: "Nondairy Cold Foam", label: "Nondairy" },
  { group: "Protein Cold Foam (15g)*", label: "Protein" },
];
type Props = {
  build: DrinkBuild;
  onFoamChange: (id: string) => void;
  onPortionChange: (portion: DrinkBuild["foamPortion"]) => void;
};

export default function ColdFoamSelector({
  build,
  onFoamChange,
  onPortionChange,
}: Props) {
  const available = compatibleOptions(build.base, (group) =>
    group.includes("Cold Foam"),
  );
  const selected = available.find((option) => option.id === build.foam);
  const types = foamTypes.filter((type) =>
    available.some((option) => option.group === type.group),
  );
  const [browsing, setBrowsing] = useState(
    selected?.group || types[0]?.group || "Cold Foam",
  );
  useEffect(() => {
    if (selected) setBrowsing(selected.group);
  }, [build.foam]);
  const currentGroup = types.some((type) => type.group === browsing)
    ? browsing
    : types[0]?.group;
  const options = available.filter((option) => option.group === currentGroup);
  const selectionInOtherGroup = !!selected && selected.group !== currentGroup;

  return (
    <section className="cold-foam-selector" aria-label="Cold foam options">
      <div className="foam-type-tabs" role="group" aria-label="Cold foam type">
        {types.map((type) => (
          <button
            key={type.group}
            aria-pressed={type.group === currentGroup}
            onClick={() => setBrowsing(type.group)}
          >
            {type.label}
          </button>
        ))}
      </div>
      {selectionInOtherGroup && (
        <div className="foam-current">
          <small>In your cup: {selected.name}</small>
          <button className="text-button" onClick={() => onFoamChange("")}>
            Remove cold foam
          </button>
        </div>
      )}
      <label>
        Cold foam
        <select
          value={selectionInOtherGroup ? "__browse" : build.foam}
          onChange={(event) => onFoamChange(event.target.value)}
        >
          {selectionInOtherGroup && (
            <option disabled value="__browse">
              Choose from this category
            </option>
          )}
          <option value="">No cold foam</option>
          {options.map((option) => {
            const estimate = estimateForServing(
              option.id,
              build.size,
              option.id === build.foam ? build.foamPortion : "regular",
            );
            return (
              <option key={option.id} value={option.id}>
                {option.name}
                {estimate ? ` · ~${Math.round(estimate.calories)} kcal` : ""}
              </option>
            );
          })}
        </select>
      </label>
      {!!selected && (
        <label>
          Foam portion
          <select
            value={build.foamPortion}
            onChange={(event) =>
              onPortionChange(event.target.value as DrinkBuild["foamPortion"])
            }
          >
            {selected.portions
              .filter((portion) =>
                ["light", "regular", "extra"].includes(portion.sizeCode),
              )
              .map((portion) => (
                <option value={portion.sizeCode} key={portion.sizeCode}>
                  {portion.sizeCode}
                </option>
              ))}
          </select>
        </label>
      )}
    </section>
  );
}
