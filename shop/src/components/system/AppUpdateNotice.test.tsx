import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import AppUpdateNotice from './AppUpdateNotice';
import { offerUpdate } from '../../data/app-update';
import { readBuilderDraft } from '../../data/builder-draft';
import DrinkBuilder from '../builder/DrinkBuilder';

test('a release update remains explicit and can reload with the in-progress Latte intact', async () => {
  sessionStorage.clear(); localStorage.clear();
  Element.prototype.scrollIntoView = vi.fn();
  render(<><DrinkBuilder /><AppUpdateNotice /></>);
  expect(screen.queryByRole('button', { name: 'Update now' })).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox', { name: 'Base' }), { target: { value: 'iced-latte' } });
  fireEvent.change(screen.getByRole('combobox', { name: 'Milk' }), { target: { value: '2121965' } });
  fireEvent.change(screen.getByRole('textbox', { name: 'Order name (optional)' }), { target: { value: 'Keep my latte' } });
  const apply = vi.fn(async () => {
    const draft = readBuilderDraft();
    expect(draft.build.base).toBe('iced-latte');
    expect(draft.build.milk).toBe('2121965');
    expect(draft.name).toBe('Keep my latte');
  });
  act(() => offerUpdate(apply));
  expect(apply).not.toHaveBeenCalled();
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Update now' })));
  expect(apply).toHaveBeenCalledOnce();
});
