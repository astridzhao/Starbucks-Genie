import axios from "axios";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "";
const REQUEST_TIMEOUT = 30000;

export const useCrewJob = () => {
  const [running, setRunning] = useState(false);
  const [userInput, setUserInput] = useState([]);
  const [userPreference, setUserPreference] = useState([]);
  const [events, setEvents] = useState([]);
  const [drinkInfo, setDrinkInfo] = useState([]);
  const [currentJobId, setCurrentJobId] = useState("");
  const starting = useRef(false);
  const startController = useRef(null);

  useEffect(() => () => startController.current?.abort(), []);

  useEffect(() => {
    if (!currentJobId) return;
    let cancelled = false;
    let timeoutId;
    const controller = new AbortController();

    const finish = (message, success = false) => {
      setRunning(false);
      setCurrentJobId("");
      toast[success ? "success" : "error"](message);
    };

    const fetchJobStatus = async () => {
      try {
        const { data } = await axios.get(
          `${API_URL}/api/drink/${currentJobId}`,
          {
            signal: controller.signal,
            timeout: REQUEST_TIMEOUT,
          },
        );
        if (cancelled) return;
        if (Array.isArray(data.events)) setEvents(data.events);

        if (data.status === "SUCCESS") {
          if (
            !data.result ||
            typeof data.result !== "object" ||
            Array.isArray(data.result)
          ) {
            finish("Job returned an invalid drink. Please try again.");
            return;
          }
          setDrinkInfo([data.result]);
          finish("Job completed.", true);
        } else if (data.status === "ERROR" || data.status === "NOT_FOUND") {
          finish("Job failed. Please try again.");
        } else {
          // Schedule after the response so slow requests never overlap.
          timeoutId = setTimeout(fetchJobStatus, 1000);
        }
      } catch (error) {
        if (!cancelled) finish("Failed to fetch job status. Please try again.");
      }
    };
    fetchJobStatus();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [currentJobId]);

  const startJob = async ({
    input = userInput,
    preference = userPreference,
  } = {}) => {
    if (starting.current || running) return;
    starting.current = true;
    setCurrentJobId("");
    setEvents([]);
    setDrinkInfo([]);
    setRunning(true);
    const controller = new AbortController();
    startController.current = controller;
    try {
      const { data } = await axios.post(
        `${API_URL}/api/drink`,
        {
          "user-preference": preference,
          "user-input": input,
        },
        { signal: controller.signal, timeout: REQUEST_TIMEOUT },
      );
      if (controller.signal.aborted) return;
      if (!data.job_id) throw new Error("Missing job ID");
      setCurrentJobId(data.job_id);
      toast.success("Job started.");
    } catch (error) {
      if (controller.signal.aborted) return;
      toast.error("Job failed to start. Please try again.");
      setRunning(false);
    } finally {
      starting.current = false;
    }
  };

  return {
    userInput,
    setUserInput,
    userPreference,
    setUserPreference,
    startJob,
    running,
    events,
    drinkInfo,
  };
};
