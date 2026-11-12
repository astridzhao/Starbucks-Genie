import { act, renderHook, waitFor } from "@testing-library/react";
import axios from "axios";
import toast from "react-hot-toast";
import { useCrewJob } from "./useCrewJob";

vi.mock("axios", () => ({ default: { post: vi.fn(), get: vi.fn() } }));
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test("submits wishes and preferences in the correct fields and shows a successful recipe", async () => {
  axios.post.mockResolvedValue({ data: { job_id: "one" } });
  const recipe = {
    name: "Coffee",
    ingredient: ["Coffee"],
    recommendation: "Enjoy",
  };
  axios.get.mockResolvedValue({
    data: { status: "SUCCESS", result: recipe, events: [] },
  });
  const { result } = renderHook(useCrewJob);
  act(() => {
    result.current.setUserInput(["iced"]);
    result.current.setUserPreference(["low sugar"]);
  });
  await act(async () => {
    await result.current.startJob();
  });
  await waitFor(() => expect(result.current.running).toBe(false));
  expect(axios.post.mock.calls[0][1]).toEqual({
    "user-input": ["iced"],
    "user-preference": ["low sugar"],
  });
  expect(result.current.drinkInfo).toEqual([recipe]);
});

test("an ERROR result stops polling, keeps recipe output empty, and allows retry", async () => {
  axios.post.mockResolvedValue({ data: { job_id: "one" } });
  axios.get.mockResolvedValue({
    data: { status: "ERROR", result: "Internal error", events: [] },
  });
  const { result } = renderHook(useCrewJob);
  await act(async () => {
    await result.current.startJob();
  });
  await waitFor(() => expect(result.current.running).toBe(false));
  expect(result.current.drinkInfo).toEqual([]);
  expect(toast.error).toHaveBeenCalled();
  expect(axios.get).toHaveBeenCalledTimes(1);
  await act(async () => {
    await result.current.startJob();
  });
  expect(axios.post).toHaveBeenCalledTimes(2);
});

test("Surprise Me explicitly sends empty inputs instead of stale state", async () => {
  axios.post.mockResolvedValue({ data: { job_id: "one" } });
  axios.get.mockResolvedValue({ data: { status: "ERROR", events: [] } });
  const { result } = renderHook(useCrewJob);
  act(() => {
    result.current.setUserInput(["old wish"]);
    result.current.setUserPreference(["old preference"]);
  });
  await act(async () => {
    await result.current.startJob({ input: [], preference: [] });
  });
  expect(axios.post.mock.calls[0][1]).toEqual({
    "user-input": [],
    "user-preference": [],
  });
});

test("network errors release the loading state", async () => {
  axios.post.mockResolvedValue({ data: { job_id: "one" } });
  axios.get.mockRejectedValue(new Error("Network unavailable"));
  const { result } = renderHook(useCrewJob);
  await act(async () => {
    await result.current.startJob();
  });
  await waitFor(() => expect(result.current.running).toBe(false));
  expect(toast.error).toHaveBeenCalled();
});

test("does not poll an undefined job ID when the start response is malformed", async () => {
  axios.post.mockResolvedValue({ data: {} });
  const { result } = renderHook(useCrewJob);
  await act(async () => {
    await result.current.startJob();
  });
  expect(result.current.running).toBe(false);
  expect(axios.get).not.toHaveBeenCalled();
});
