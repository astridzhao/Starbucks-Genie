import { useEffect, useRef, useState } from "react";

type MotionConstructor = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<string>;
};
type MotionStatus = "off" | "asking" | "on" | "denied" | "unavailable";

export default function useShakeToMix(onMix: () => void) {
  const [status, setStatus] = useState<MotionStatus>("off");
  const callback = useRef(onMix);
  useEffect(() => { callback.current = onMix; }, [onMix]);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  async function enable() {
    if (!window.isSecureContext || typeof window.DeviceMotionEvent === "undefined") {
      setStatus("unavailable");
      return;
    }
    setStatus("asking");
    try {
      const motion = window.DeviceMotionEvent as MotionConstructor;
      const permission = motion.requestPermission ? await motion.requestPermission() : "granted";
      if (active.current) setStatus(permission === "granted" ? "on" : "denied");
    } catch {
      if (active.current) setStatus("denied");
    }
  }

  useEffect(() => {
    if (status !== "on") return;
    let previous: { x: number; y: number; z: number } | null = null;
    let lastPeak = -Infinity;
    let cooldownUntil = 0;
    const reset = () => { previous = null; lastPeak = -Infinity; };
    function onMotion(event: DeviceMotionEvent) {
      if (document.hidden) { reset(); return; }
      const data = event.acceleration?.x != null ? event.acceleration : event.accelerationIncludingGravity;
      if (!data || ![data.x, data.y, data.z].every((value) => typeof value === "number" && Number.isFinite(value))) return;
      const current = { x: data.x!, y: data.y!, z: data.z! };
      const old = previous;
      previous = current;
      if (!old) return;
      const now = performance.now();
      if (now < cooldownUntil) return;
      const delta = Math.hypot(current.x - old.x, current.y - old.y, current.z - old.z);
      // Require two separate impulses: ordinary tilting or a single bump should not mix.
      if (delta < 13 || now - lastPeak < 120) return;
      if (now - lastPeak <= 900) {
        cooldownUntil = now + 2500;
        lastPeak = -Infinity;
        callback.current();
      } else lastPeak = now;
    }
    window.addEventListener("devicemotion", onMotion);
    document.addEventListener("visibilitychange", reset);
    return () => {
      window.removeEventListener("devicemotion", onMotion);
      document.removeEventListener("visibilitychange", reset);
    };
  }, [status]);

  return { status, enable, disable: () => setStatus("off") };
}
