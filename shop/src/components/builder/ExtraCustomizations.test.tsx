import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import ExtraCustomizations from "./ExtraCustomizations";
import { defaultBuild } from "../../data/nutrition";
import type { DrinkBuild } from "../../data/nutrition";

function Harness() {
  const [build, setBuild] = useState<DrinkBuild>({ ...defaultBuild });
  return (
    <ExtraCustomizations
      build={build}
      onChange={(extras) => setBuild((previous) => ({ ...previous, extras }))}
      onPortionChange={(id, portion) => setBuild(previous => ({ ...previous, extraPortions: { ...previous.extraPortions, [id]: portion } }))}
      onPreparation={() => {}}
    />
  );
}

test("quick picks can be added with one click, then adjusted in place", () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "Add Mocha Sauce" }));
  expect(screen.getByLabelText("Mocha Sauce quantity")).toHaveTextContent("1");
  fireEvent.click(screen.getByRole("button", { name: "Increase Mocha Sauce" }));
  expect(screen.getByLabelText("Mocha Sauce quantity")).toHaveTextContent(
    "2",
  );
  fireEvent.click(screen.getByRole("button", { name: "Decrease Mocha Sauce" }));
  expect(screen.getByLabelText("Mocha Sauce quantity")).toHaveTextContent("1");
});

test("search finds a specific ingredient across categories without dropdowns", () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "Toppings" }));
  fireEvent.change(
    screen.getByRole("searchbox", { name: "Search extra ingredients" }),
    { target: { value: "pearls" } },
  );
  expect(screen.getByRole("button", { name: "All" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Add Pomegranate Pearls" }),
  );
  expect(
    screen.getByLabelText("Pomegranate Pearls quantity"),
  ).toHaveTextContent("1");
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
});

test("selected chips remove ingredients without navigating categories", () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "Add Mocha Sauce" }));
  fireEvent.click(screen.getByRole("button", { name: "Remove Mocha Sauce" }));
  expect(
    screen.getByRole("button", { name: "Add Mocha Sauce" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Selected 1" }),
  ).not.toBeInTheDocument();
});

test("empty searches offer a visible recovery action", () => {
  render(<Harness />);
  fireEvent.change(
    screen.getByRole("searchbox", { name: "Search extra ingredients" }),
    { target: { value: "does-not-exist" } },
  );
  expect(screen.getByRole("status")).toHaveTextContent("No ingredients found");
  fireEvent.click(
    screen.getByRole("button", { name: "Clear ingredient search" }),
  );
  expect(
    screen.getByRole("button", { name: "Add Mocha Sauce" }),
  ).toBeInTheDocument();
});

test.each([
  [
    "Toppings",
    "Cookie Crumble Topping",
    ["Caramel Drizzle", "Mocha Sauce", "Cinnamon Powder", "Whipped Cream"],
  ],
  [
    "Drizzle",
    "Caramel Drizzle",
    [
      "Cookie Crumble Topping",
      "Mocha Sauce",
      "Line the Cup with Caramel Sauce",
    ],
  ],
  ["Sauces", "Mocha Sauce", ["Vanilla Syrup", "Caramel Drizzle"]],
  [
    "Powders",
    "Cinnamon Powder",
    ["Cinnamon Dolce Sprinkles", "Cookie Crumble Topping"],
  ],
  [
    "Whipped cream",
    "Whipped Cream",
    ["Cookie Crumble Topping", "Caramel Drizzle"],
  ],
  [
    "Line the cup",
    "Line the Cup with Caramel Sauce",
    ["Caramel Drizzle", "Mocha Sauce"],
  ],
])(
  "category %s contains only its ingredient type",
  (category, included, excluded) => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: category as string }));
    expect(
      screen.getByRole("button", { name: `Add ${included}` }),
    ).toBeInTheDocument();
    for (const name of excluded as string[])
      expect(
        screen.queryByRole("button", { name: `Add ${name}` }),
      ).not.toBeInTheDocument();
  },
);

test("extra syrup increments from one to two pumps", () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "Add Hazelnut Syrup" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Increase Hazelnut Syrup" }),
  );
  expect(screen.getByLabelText("Hazelnut Syrup quantity")).toHaveTextContent(
    "2",
  );
});
