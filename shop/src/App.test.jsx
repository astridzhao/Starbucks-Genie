import { render, screen } from "@testing-library/react";
import App from "./App";
vi.mock("axios", () => ({ default: { post: vi.fn(), get: vi.fn() } }));

test("offers drink creation from the home page", () => {
  window.history.replaceState({}, "", "/");
  render(<App />);
  expect(screen.getByRole("link", { name: "Create my drink" })).toHaveAttribute(
    "href",
    "/customize",
  );
});

test("opens the ingredient builder without external credentials", () => {
  window.history.replaceState({}, "", "/customize");
  render(<App />);
  expect(
    screen.getByRole("heading", { name: "Your cup, your way." }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Base")).toHaveValue("cold-brew");
});
