import type { DrinkBuild } from './nutrition';
export type SavedOrder = { id: string; name: string; build: DrinkBuild; createdAt: string };
const KEY = 'genie-saved-orders';
export function readSavedOrders(): SavedOrder[] {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(data) ? data.filter(order => typeof order?.id === 'string' && typeof order?.name === 'string' && order?.build && typeof order.build === 'object') : [];
  } catch { return []; }
}
export function writeSavedOrders(orders: SavedOrder[]) { localStorage.setItem(KEY, JSON.stringify(orders)); }
