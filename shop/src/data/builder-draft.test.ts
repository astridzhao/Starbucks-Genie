import { beforeEach, expect, test } from 'vitest';
import { readBuilderDraft, saveBuilderDraft, DRAFT_KEY } from './builder-draft';
import { standardBuild } from './drink-recipes';
import { defaultBuild } from './nutrition';
beforeEach(() => { sessionStorage.clear(); localStorage.clear(); });
test('current Latte customization and name survive reload without changing saved orders', () => {
  const build = { ...standardBuild('iced-latte'), milk: '2122556', syrup: '111', pumps: 2 };
  const saved = JSON.stringify([{ id: 'saved-order', name: 'Existing order', build }]);
  localStorage.setItem('genie-saved-orders', saved);
  saveBuilderDraft(build, 'Morning oat latte');
  expect(readBuilderDraft()).toEqual({ build, name: 'Morning oat latte' });
  expect(localStorage.getItem('genie-saved-orders')).toBe(saved);
});
test('malformed or unsupported session drafts cannot break the builder or remove a saved recipe', () => {
  localStorage.setItem('genie-last-recipe', 'saved content');
  for (const value of ['bad json', JSON.stringify({ build: { base: 'removed', size: 'Tall' } })]) {
    sessionStorage.setItem(DRAFT_KEY, value);
    expect(readBuilderDraft().build).toEqual(defaultBuild);
    expect(localStorage.getItem('genie-last-recipe')).toBe('saved content');
  }
});
