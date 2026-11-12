import type { DrinkBuild } from './nutrition';
import { calculateNutrition, defaultBuild, normalizeSavedAppSettings, normalizeSavedMilkPortion, normalizeSavedSyrupAmounts } from './nutrition';
export const DRAFT_KEY = 'genie-active-draft';
export function readBuilderDraft(): { build: DrinkBuild; name: string } {
  try {
    const draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null');
    if (draft?.build) {
      const build = normalizeSavedAppSettings(normalizeSavedMilkPortion(normalizeSavedSyrupAmounts(draft.build).build).build).build;
      calculateNutrition(build);
      return { build, name: typeof draft.name === 'string' ? draft.name.slice(0, 80) : '' };
    }
  } catch { /* A stale draft must not block the builder or overwrite saved orders. */ }
  return { build: structuredClone(defaultBuild), name: '' };
}
export function saveBuilderDraft(build: DrinkBuild, name: string) {
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ build, name })); } catch { /* Optional session recovery. */ }
}
