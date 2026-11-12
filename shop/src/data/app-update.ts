type ApplyUpdate = () => Promise<void>;
let applyUpdate: ApplyUpdate | null = null;
const listeners = new Set<() => void>();
export const currentUpdate = () => applyUpdate;
export function offerUpdate(apply: ApplyUpdate) { applyUpdate = apply; listeners.forEach(listener => listener()); }
export function subscribeToUpdates(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
