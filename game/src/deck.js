// deck.js — seeded shuffle and draw pile for Ember Pact.
import { CARD_DEFS } from './cards.js';

// Small deterministic PRNG (mulberry32). Shot modes pass a fixed seed;
// live play seeds it from Math.random.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleDeck(cards, rng) {
  const deck = cards.slice();
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = deck[i]; deck[i] = deck[j]; deck[j] = tmp;
  }
  return deck;
}

// A fresh 24-card deck: one fresh copy of every card definition, shuffled.
export function buildDeck(rng) {
  const copies = CARD_DEFS.map((def, i) => ({ ...def, uid: 'c' + i + '-' + Math.floor(rng() * 1e9).toString(36) }));
  return shuffleDeck(copies, rng);
}

// Draw up to n cards from deck into hand; reshuffles the discard pile when empty.
export function drawUpTo(deck, discard, hand, n, rng) {
  let drawn = 0;
  while (hand.length < n) {
    if (deck.length === 0) {
      if (discard.length === 0) break;
      const fresh = shuffleDeck(discard.splice(0), rng || Math.random);
      deck.push(...fresh);
    }
    hand.push(deck.pop());
    drawn++;
  }
  return drawn;
}
