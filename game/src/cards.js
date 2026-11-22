// cards.js — the 24 original cards of Ember Pact, across 4 elements.
// Each element is told apart by colour AND shape AND icon, never by text alone.
export const ELEMENTS = {
  ember: { key: 'ember', name: 'Ember', color: '#e5484d', deep: '#7f1d1d', icon: '🔥', shape: 'flame', beats: 'leaf' },
  frost: { key: 'frost', name: 'Frost', color: '#3e9bff', deep: '#144a8a', icon: '❄️', shape: 'flake', beats: 'stone' },
  leaf: { key: 'leaf', name: 'Leaf', color: '#46a758', deep: '#1d5c2e', icon: '🍃', shape: 'leaf', beats: 'frost' },
  stone: { key: 'stone', name: 'Stone', color: '#b08954', deep: '#6b4e2e', icon: '⛰️', shape: 'stone', beats: 'ember' },
};

// Element wheel: Ember > Leaf > Frost > Stone > Ember.
export function elementBeats(attacker, defender) {
  return !!ELEMENTS[attacker] && ELEMENTS[attacker].beats === defender;
}
export function elementName(key) { return ELEMENTS[key] ? ELEMENTS[key].name : key; }

// kind: strike (damage) | guard (shield) | mend (heal) | spark (draw a card)
export const CARD_DEFS = [
  // ---- Ember (red, flame) ----
  { id: 'ember-strike', name: 'Ember Strike', element: 'ember', kind: 'strike', cost: 2, value: 6, text: 'Deal 6 damage.' },
  { id: 'cinder-burst', name: 'Cinder Burst', element: 'ember', kind: 'strike', cost: 4, value: 10, text: 'Deal 10 damage.' },
  { id: 'flame-lick', name: 'Flame Lick', element: 'ember', kind: 'strike', cost: 1, value: 3, text: 'Deal 3 damage.' },
  { id: 'ember-guard', name: 'Ember Guard', element: 'ember', kind: 'guard', cost: 2, value: 5, text: 'Gain 5 shield.' },
  { id: 'kindling-spark', name: 'Kindling Spark', element: 'ember', kind: 'spark', cost: 1, value: 1, text: 'Draw 1 card.' },
  { id: 'phoenix-mend', name: 'Phoenix Mend', element: 'ember', kind: 'mend', cost: 3, value: 6, text: 'Heal 6 life.' },
  // ---- Frost (blue, snowflake) ----
  { id: 'frost-strike', name: 'Frost Strike', element: 'frost', kind: 'strike', cost: 2, value: 5, text: 'Deal 5 damage.' },
  { id: 'glacial-spike', name: 'Glacial Spike', element: 'frost', kind: 'strike', cost: 3, value: 8, text: 'Deal 8 damage.' },
  { id: 'blizzard', name: 'Blizzard', element: 'frost', kind: 'strike', cost: 4, value: 9, text: 'Deal 9 damage.' },
  { id: 'snowflake-guard', name: 'Snowflake Guard', element: 'frost', kind: 'guard', cost: 2, value: 6, text: 'Gain 6 shield.' },
  { id: 'chill-mend', name: 'Chill Mend', element: 'frost', kind: 'mend', cost: 2, value: 4, text: 'Heal 4 life.' },
  { id: 'frost-spark', name: 'Frost Spark', element: 'frost', kind: 'spark', cost: 1, value: 1, text: 'Draw 1 card.' },
  // ---- Leaf (green, leaf) ----
  { id: 'thorn-strike', name: 'Thorn Strike', element: 'leaf', kind: 'strike', cost: 2, value: 5, text: 'Deal 5 damage.' },
  { id: 'vine-whip', name: 'Vine Whip', element: 'leaf', kind: 'strike', cost: 1, value: 3, text: 'Deal 3 damage.' },
  { id: 'overgrowth', name: 'Overgrowth', element: 'leaf', kind: 'strike', cost: 4, value: 9, text: 'Deal 9 damage.' },
  { id: 'thorn-wall', name: 'Thorn Wall', element: 'leaf', kind: 'guard', cost: 3, value: 8, text: 'Gain 8 shield.' },
  { id: 'bloom-mend', name: 'Bloom Mend', element: 'leaf', kind: 'mend', cost: 2, value: 5, text: 'Heal 5 life.' },
  { id: 'leaf-spark', name: 'Leaf Spark', element: 'leaf', kind: 'spark', cost: 1, value: 1, text: 'Draw 1 card.' },
  // ---- Stone (brown, mountain) ----
  { id: 'rock-strike', name: 'Rock Strike', element: 'stone', kind: 'strike', cost: 2, value: 5, text: 'Deal 5 damage.' },
  { id: 'boulder-slam', name: 'Boulder Slam', element: 'stone', kind: 'strike', cost: 3, value: 8, text: 'Deal 8 damage.' },
  { id: 'avalanche', name: 'Avalanche', element: 'stone', kind: 'strike', cost: 4, value: 10, text: 'Deal 10 damage.' },
  { id: 'stone-guard', name: 'Stone Guard', element: 'stone', kind: 'guard', cost: 2, value: 7, text: 'Gain 7 shield.' },
  { id: 'granite-mend', name: 'Granite Mend', element: 'stone', kind: 'mend', cost: 3, value: 6, text: 'Heal 6 life.' },
  { id: 'pebble-spark', name: 'Pebble Spark', element: 'stone', kind: 'spark', cost: 1, value: 1, text: 'Draw 1 card.' },
];

export function cardById(id) {
  return CARD_DEFS.find((c) => c.id === id) || null;
}
export function kindLabel(kind) {
  return { strike: 'Strike', guard: 'Guard', mend: 'Mend', spark: 'Spark' }[kind] || kind;
}
