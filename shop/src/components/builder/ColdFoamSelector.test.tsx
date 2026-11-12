import React, { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import ColdFoamSelector from "./ColdFoamSelector";
import { defaultBuild } from "../../data/nutrition";
import type { DrinkBuild } from "../../data/nutrition";

function Harness() {
  const [build, setBuild] = useState<DrinkBuild>({ ...defaultBuild });
  return (
    <ColdFoamSelector
      build={build}
      onFoamChange={(foam) =>
        setBuild((previous) => ({ ...previous, foam, foamPortion: "regular" }))
      }
      onPortionChange={(foamPortion) =>
        setBuild((previous) => ({ ...previous, foamPortion }))
      }
    />
  );
}

test("dairy, nondairy and protein foam are separate categories", () => {
  render(<Harness />);
  const picker = screen.getByRole("combobox", { name: "Cold foam" });
  expect(
    within(picker).getByRole("option", {
      name: /^Vanilla Sweet Cream Cold Foam/,
    }),
  ).toBeInTheDocument();
  expect(
    within(picker).queryByRole("option", { name: /Nondairy/ }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Nondairy" }));
  expect(
    within(picker).getByRole("option", {
      name: /^Nondairy Vanilla Sweet Cream Cold Foam/,
    }),
  ).toBeInTheDocument();
  expect(
    within(picker).queryByRole("option", { name: /Protein/ }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Protein" }));
  expect(
    within(picker).getByRole("option", { name: /^Vanilla Protein Cold Foam/ }),
  ).toBeInTheDocument();
  expect(
    within(picker).queryByRole("option", { name: /Nondairy/ }),
  ).not.toBeInTheDocument();
});

test("browsing another foam category does not silently discard the selected foam", () => {
  render(<Harness />);
  fireEvent.change(screen.getByRole("combobox", { name: "Cold foam" }), {
    target: { value: "2123166" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Protein" }));
  expect(
    screen.getByText(/In your cup: Vanilla Sweet Cream Cold Foam/),
  ).toBeInTheDocument();
  fireEvent.change(screen.getByRole("combobox", { name: "Cold foam" }), {
    target: { value: "28493" },
  });
  expect(screen.getByRole("combobox", { name: "Cold foam" })).toHaveValue(
    "28493",
  );
  expect(screen.queryByText(/In your cup:/)).not.toBeInTheDocument();
});
