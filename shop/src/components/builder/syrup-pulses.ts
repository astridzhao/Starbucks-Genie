import { MAX_MODIFIER_AMOUNT } from '../../data/customization-options';
// Both renderers use the same pump plan so a visual upgrade cannot change dosing.
export const PUMP_SECONDS = 1;
export function syrupPulses(previous: Record<string, number>, next: Record<string, number>, replay = false, baseChanged = false): string[] {
  if (baseChanged) return [];
  return Object.entries(next).sort(([a],[b])=>a.localeCompare(b)).flatMap(([id, quantity]) => {
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > MAX_MODIFIER_AMOUNT) return [];
    const added = replay ? quantity : Math.max(0, quantity - (previous[id] || 0));
    return Array.from({ length: added }, () => id);
  });
}
