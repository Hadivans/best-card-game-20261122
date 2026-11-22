// ai.js — Cinder, the Ash Warden: a readable opponent that telegraphs its intent.
// Strategy: heal when hurt, guard when the player is hitting hard, otherwise strike
// with the biggest affordable damage. The telegraph is computed from the plan itself,
// so the player can read it and counter.
import { elementBeats } from './cards.js';

// Score one candidate card for the AI. Higher is better.
export function scoreAiCard(card, ai, you) {
  let score = 0;
  if (card.kind === 'strike') {
    score = card.value * 2;
    if (elementBeats(card.element, you.lastElement)) score += 4; // wheel advantage
    if (ai.turnElements.includes(card.element)) score += 4; // surge
    if (you.life <= card.value) score += 100; // lethal
    if (you.shield >= card.value) score -= 3; // wasted on shield
  } else if (card.kind === 'mend') {
    score = ai.life <= 12 ? 30 + card.value * 2 : 2;
    if (ai.life >= 28) score = -10;
  } else if (card.kind === 'guard') {
    score = you.lastDamage >= 8 ? 18 + card.value : 4;
    if (ai.life <= 10) score += 6;
  } else if (card.kind === 'spark') {
    score = ai.hand.length <= 2 ? 10 : 1;
  }
  return score - card.cost; // prefer cheap plays when scores tie
}

// Pick the AI's whole turn: a list of card uids, in play order.
export function chooseAiPlays(state) {
  const ai = state.ai;
  const plays = [];
  let energy = ai.energy;
  const used = new Set();
  const simElements = [];
  for (let guard = 0; guard < 5; guard++) {
    let best = null;
    let bestScore = -Infinity;
    for (const card of ai.hand) {
      if (used.has(card.uid) || card.cost > energy) continue;
      const probe = { ...ai, turnElements: simElements };
      const s = scoreAiCard(card, probe, state.you);
      if (s > bestScore) { bestScore = s; best = card; }
    }
    if (!best || bestScore < 0) break;
    plays.push(best.uid);
    used.add(best.uid);
    energy -= best.cost;
    simElements.push(best.element);
  }
  return plays;
}

// A one-line warning shown during the player's turn, describing the AI's next move.
export function aiTelegraph(state) {
  const ai = state.ai;
  const affordable = ai.hand.filter((c) => c.cost <= ai.energy);
  if (affordable.length === 0) return 'Cinder is out of energy — gathering embers…';
  let best = null;
  let bestScore = -Infinity;
  for (const card of affordable) {
    const s = scoreAiCard(card, { ...ai, turnElements: [] }, state.you);
    if (s > bestScore) { bestScore = s; best = card; }
  }
  if (!best) return 'Cinder is sizing you up…';
  if (best.kind === 'strike' && best.value >= 9) return 'Cinder is charging a heavy strike… guard up!';
  if (best.kind === 'strike') return 'Cinder is raising a burning hand — a strike is coming.';
  if (best.kind === 'mend') return 'Cinder is mending wounds — strike now, before the healing lands.';
  if (best.kind === 'guard') return 'Cinder is raising a stone wall — save your big hits.';
  return 'Cinder is shuffling embers, plotting something…';
}
