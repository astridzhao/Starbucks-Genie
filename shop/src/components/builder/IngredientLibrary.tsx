import React, { memo, useMemo, useState } from "react";
import { ingredientCatalog } from "../../data/ingredient-estimates";

const groups = [...new Set(ingredientCatalog.map((item) => item.group))].sort();
const round = (value: number) => Math.round(value * 10) / 10;

export default memo(function IngredientLibrary() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("");
  const [controls, setControls] = useState(false);
  const rows = useMemo(
    () =>
      ingredientCatalog.filter(
        (item) =>
          (controls || !item.preparation) &&
          (!group || item.group === group) &&
          `${item.name} ${item.group}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [search, group, controls],
  );
  const modeled = ingredientCatalog.filter((item) => item.estimate).length;
  const exportCsv = () => {
    const quote = (value: unknown) =>
      `"${String(value ?? "").replaceAll('"', '""')}"`;
    const data = [
      [
        "ingredient",
        "group",
        "assumed_serving",
        "estimated_kcal",
        "low_kcal",
        "high_kcal",
        "method",
        "confidence",
        "assumptions",
        "references",
      ],
      ...ingredientCatalog.map((item) => [
        item.name,
        item.group,
        item.estimate?.unit,
        item.estimate?.calories,
        item.estimate?.low,
        item.estimate?.high,
        item.preparation ? "preparation setting" : item.estimate?.method,
        item.estimate?.confidence,
        item.estimate?.basis,
        item.estimate?.sources.map((source) => source.url).join(" | "),
      ]),
    ];
    const blob = new Blob(
      ["\uFEFF" + data.map((row) => row.map(quote).join(",")).join("\r\n")],
      { type: "text/csv;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "genie-us-ingredient-planning-estimates.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <details
      className="ingredient-library"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>Ingredient calorie guide · {modeled} modeled entries</summary>
      {open && (
        <>
          <p className="muted">
            Planning estimates for US menu options. Ranges are scenario bounds,
            not measured limits or statistical confidence intervals.{" "}
            {ingredientCatalog.filter((item) => item.preparation).length}{" "}
            preparation settings are listed separately.
          </p>
          <div className="library-filters">
            <label>
              Find an ingredient
              <input
                type="search"
                value={search}
                placeholder="e.g. pistachio, oatmilk, syrup"
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <label>
              Ingredient group
              <select
                value={group}
                onChange={(event) => setGroup(event.target.value)}
              >
                <option value="">All groups</option>
                {groups.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={controls}
                onChange={(event) => setControls(event.target.checked)}
              />{" "}
              Include preparation settings
            </label>
          </div>
          <button className="secondary-button" onClick={exportCsv}>
            Download estimate table
          </button>
          <p className="muted small">
            {rows.length} results. Foam guide values use a regular Grande
            serving; the builder adjusts its model for the selected size and
            portion.
          </p>
          <div className="library-scroll">
            <table className="library-table">
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>Assumed serving</th>
                  <th>Estimated kcal</th>
                  <th>Basis</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.name}
                      <small>{item.group}</small>
                    </td>
                    <td>
                      {item.estimate?.unit ||
                        (item.preparation ? "Preparation choice" : "No model")}
                    </td>
                    <td>
                      {item.estimate ? (
                        <>
                          <strong>~{round(item.estimate.calories)}</strong>
                          <small>
                            {round(item.estimate.low)}–
                            {round(item.estimate.high)} kcal
                          </small>
                        </>
                      ) : item.preparation ? (
                        "Not an added ingredient"
                      ) : (
                        "Estimate unavailable"
                      )}
                    </td>
                    <td>
                      {item.estimate ? (
                        <details>
                          <summary>
                            {item.estimate.method} · {item.estimate.confidence}{" "}
                            confidence
                          </summary>
                          <p>{item.estimate.basis}</p>
                          <p>
                            References support the method or food family; they
                            are not a verified US modifier label.
                          </p>
                          {item.estimate.sources.map((source) => (
                            <p key={source.url}>
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {source.title}
                              </a>
                            </p>
                          ))}
                        </details>
                      ) : item.preparation ? (
                        "Changes preparation, volume or an existing component. Do not add separate calories for this setting."
                      ) : (
                        "No defensible model yet. This is not zero calories."
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </details>
  );
});
