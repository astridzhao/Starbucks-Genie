import React, { useState } from 'react';
import snapshot from '../../data/starbucks-us.json';
import { standardBuild } from '../../data/drink-recipes';
import type { DrinkBuild } from '../../data/nutrition';
const popular = ['iced-latte', 'latte', 'iced-matcha', 'iced-macchiato', 'cold-brew', 'iced-chai'];
export default function DrinkStarter({ selected, onChoose }: { selected: string; onChoose: (build: DrinkBuild) => void }) {
  const [search, setSearch] = useState(''), [group, setGroup] = useState('Popular');
  const groups = ['Popular', 'Iced coffee', 'Hot coffee', 'Tea', 'Refreshers'];
  const matches = snapshot.bases.filter(base => {
    if (search.trim()) return base.name.toLowerCase().includes(search.trim().toLowerCase());
    if (group === 'Popular') return popular.includes(base.id);
    if (group === 'Tea' || group === 'Refreshers') return base.category === group;
    return base.category === 'Coffee & espresso' && base.form === (group === 'Hot coffee' ? 'hot' : 'iced');
  }).sort((a, b) => group === 'Popular' && !search ? popular.indexOf(a.id) - popular.indexOf(b.id) : 0);
  return <section className="drink-starter" aria-label="Start with a drink">
    <h2>Start with a drink <span className="starter-count">{snapshot.bases.length} US drinks</span></h2>
    <p className="muted">Choose a Starbucks classic. Its standard recipe is ready for your changes.</p>
    <input type="search" aria-label="Find a starting drink" placeholder="Search latte, matcha, cold brew…" value={search} onChange={event => setSearch(event.target.value)} />
    <div className="starter-tabs" role="group" aria-label="Drink categories">{groups.map(item => <button key={item} aria-pressed={!search && group === item} onClick={() => { setGroup(item); setSearch(''); }}>{item}</button>)}</div>
    <div className="starter-grid">{matches.map(base => {
      const size = base.sizes.find(size => size.name === 'Grande') || base.sizes[0];
      return <button className="starter-card" key={base.id} aria-pressed={selected === base.id} onClick={() => onChoose(standardBuild(base.id))}>
        <span className="starter-swatch" style={{ background: base.color }} aria-hidden="true">{base.form === 'hot' ? '♨' : '❄'}</span>
        <span><strong>{base.name}</strong><small>{base.form === 'hot' ? 'Hot' : 'Iced'} · {size.name} · {size.nutrition.calories} kcal</small></span>
        <span aria-hidden="true">{selected === base.id ? '✓' : '+'}</span>
      </button>;
    })}</div>
    {!matches.length && <p className="muted" role="status">No matching drink. Try latte, tea, or cold brew.</p>}
  </section>;
}
