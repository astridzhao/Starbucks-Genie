import React from "react";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import DrinkAnimation from "./DrinkAnimation";
import useShakeToMix from "./useShakeToMix";
import { defaultBuild } from "../../data/nutrition";

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

function motion(x: number | null) {
  const event = new Event("devicemotion");
  Object.assign(event, { acceleration: { x, y: x === null ? null : 0, z: x === null ? null : 0 } });
  act(() => { window.dispatchEvent(event); });
}

function support(permission = "granted") {
  vi.stubGlobal("isSecureContext", true);
  const requestPermission = vi.fn().mockResolvedValue(permission);
  vi.stubGlobal("DeviceMotionEvent", { requestPermission });
  return requestPermission;
}

test("manual mix blends foam and milk, and a recipe change restores layers", () => {
  const build = { ...defaultBuild, milk: "50", milkMl: 60, foam: "2123166" };
  const original = JSON.stringify(build);
  const { container, rerender } = render(<DrinkAnimation build={build} />);
  fireEvent.click(screen.getByRole("button", { name: "Mix drink" }));
  expect(container.querySelector('.is-mixed .foam-mixing-layer')).toBeInTheDocument();
  expect(screen.getByText("Mixed — your drink is blended.")).toBeInTheDocument();
  expect(JSON.stringify(build)).toBe(original);
  rerender(<DrinkAnimation build={{ ...build, milkMl: 90 }} />);
  expect(container.querySelector('.is-mixed')).not.toBeInTheDocument();
  rerender(<DrinkAnimation build={build} />);
  expect(container.querySelector('.is-mixed')).not.toBeInTheDocument();
});

test("denied motion access leaves the manual button usable", async () => {
  const permission = support("denied");
  render(<DrinkAnimation build={defaultBuild} />);
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Enable shake" })); });
  expect(permission).toHaveBeenCalledOnce();
  expect(screen.getByText(/Motion access wasn’t allowed/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Mix drink" }));
  expect(screen.getByText("Mixed — your drink is blended.")).toBeInTheDocument();
});

test("shake requires two impulses, ignores invalid data and debounces; disabling removes listening", async () => {
  support();
  const onMix = vi.fn();
  let time = 0;
  vi.spyOn(performance, "now").mockImplementation(() => time);
  const { result, unmount } = renderHook(() => useShakeToMix(onMix));
  await act(async () => { await result.current.enable(); });
  expect(result.current.status).toBe("on");
  motion(null);
  motion(0);
  time = 200; motion(2);
  time = 400; motion(18);
  expect(onMix).not.toHaveBeenCalled();
  time = 600; motion(-18);
  expect(onMix).toHaveBeenCalledOnce();
  time = 800; motion(18);
  time = 1000; motion(-18);
  expect(onMix).toHaveBeenCalledOnce();
  act(() => { result.current.disable(); });
  time = 4000; motion(18);
  time = 4200; motion(-18);
  expect(onMix).toHaveBeenCalledOnce();
  unmount();
});

test("unsupported motion does not prevent manual mixing", async () => {
  vi.stubGlobal("DeviceMotionEvent", undefined);
  const { result } = renderHook(() => useShakeToMix(() => {}));
  await act(async () => { await result.current.enable(); });
  expect(result.current.status).toBe("unavailable");
});
