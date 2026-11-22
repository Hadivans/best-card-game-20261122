// state.js — game state and rules for Ember Pact (pure logic, no DOM).
import { buildDeck, drawUpTo } from './deck.js';
import { elementBeats } from './cards.js';
import { chooseAiPlays, aiTelegraph } from './ai.js';

export const MAX_LIFE = 30;
export const HAND_SIZE = 5;
export const MAX_ENERGY = 10;

export function energyForRound(round) {
  return Math.min(2 + round, MAX_ENERGY);
}

function freshSide(deck, discard, rng) {
  const hand = [];
  drawUpTo(deck, discard, hand, HAND_SIZE, rng);
  return { life: MAX_LIFE, shield: 0, energy: energyForRound(1), hand, lastElement: null, lastDamage: 0, turnElements: [] };
}

export function createGame(rng) {
  const youDeck = buildDeck(rng);
  const aiDeck = buildDeck(rng);
  const state = {
    rng,
    round: 1,
    phase: 'player', // title | player | ai | win | loss
    you: null,
    ai: null,
    youDeck, aiDeck,
    youDiscard: [], aiDiscard: [],
    damageDealt: 0,
    cardsPlayed: 0,
    telegraph: 'Cinder is sizing you up…',
    log: 'The pact is sealed. Your move.',
    lastYouCard: null,
    lastAiCard: null,
  };
  state.you = freshSide(youDeck, state.youDiscard, rng);
  state.ai = freshSide(aiDeck, state.aiDiscard, rng);
  state.telegraph = aiTelegraph(state);
  return state;
}

// Damage first eats shield, then life. Returns the life damage actually dealt.
export function dealDamage(side, amount) {
  let rest = amount;
  if (side.shield > 0) {
    const absorbed = Math.min(side.shield, rest);
    side.shield -= absorbed;
    rest -= absorbed;
  }
  if (rest > 0) side.life = Math.max(0, side.life - rest);
  return rest;
}

function checkEnd(state) {
  if (state.ai.life <= 0) state.phase = 'win';
  else if (state.you.life <= 0) state.phase = 'loss';
}

// Resolve one card. `side` is 'you' or 'ai'. Returns an event describing what happened.
export function resolveCard(state, side, card) {
  const actor = side === 'you' ? state.you : state.ai;
  const target = side === 'you' ? state.ai : state.you;
  const foeLast = side === 'you' ? state.ai.lastElement : state.you.lastElement;
  const surge = actor.turnElements.includes(card.element);
  let value = card.value + (surge ? 2 : 0);
  const event = { side, card, surge, advantage: false, amount: 0, text: '' };
  if (card.kind === 'strike') {
    event.advantage = elementBeats(card.element, foeLast);
    if (event.advantage) value += 2;
    event.amount = value;
    const lifeHit = dealDamage(target, value);
    if (side === 'you') state.damageDealt += lifeHit;
    target.lastDamage = value;
    event.text = card.name + ' hits for ' + value + (event.advantage ? ' (element advantage +2!)' : '') + (surge ? ' (Surge +2!)' : '');
  } else if (card.kind === 'guard') {
    actor.shield += value;
    event.amount = value;
    event.text = card.name + ': +' + value + ' shield' + (surge ? ' (Surge +2!)' : '');
  } else if (card.kind === 'mend') {
    const healed = Math.min(value, MAX_LIFE - actor.life);
    actor.life += healed;
    event.amount = healed;
    event.text = card.name + ': heals ' + healed + (surge ? ' (Surge +2!)' : '');
  } else if (card.kind === 'spark') {
    const deck = side === 'you' ? state.youDeck : state.aiDeck;
    const discard = side === 'you' ? state.youDiscard : state.aiDiscard;
    const before = actor.hand.length;
    drawUpTo(deck, discard, actor.hand, before + value, state.rng);
    event.amount = actor.hand.length - before;
    event.text = card.name + ': draws ' + event.amount + ' card' + (event.amount === 1 ? '' : 's');
  }
  actor.turnElements.push(card.element);
  actor.lastElement = card.element;
  state.cardsPlayed++;
  if (side === 'you') state.lastYouCard = card; else state.lastAiCard = card;
  checkEnd(state);
  return event;
}

// The player plays the card at handIndex. Returns { ok, event?, reason? }.
export function playCard(state, handIndex) {
  if (state.phase !== 'player') return { ok: false, reason: 'Not your turn.' };
  const card = state.you.hand[handIndex];
  if (!card) return { ok: false, reason: 'No card there.' };
  if (card.cost > state.you.energy) return { ok: false, reason: 'Not enough energy.' };
  state.you.energy -= card.cost;
  state.you.hand.splice(handIndex, 1);
  const event = resolveCard(state, 'you', card);
  state.youDiscard.push(card);
  state.log = event.text;
  return { ok: true, event };
}

// The AI plays its planned turn. Returns the list of events, in order.
export function aiTakeTurn(state) {
  state.phase = 'ai';
  state.ai.shield = 0; // shield only lasts until your next turn
  state.ai.turnElements = [];
  const events = [];
  for (const uid of chooseAiPlays(state)) {
    if (state.phase === 'win' || state.phase === 'loss') break;
    const idx = state.ai.hand.findIndex((c) => c.uid === uid);
    if (idx < 0) continue;
    const card = state.ai.hand[idx];
    if (card.cost > state.ai.energy) continue;
    state.ai.energy -= card.cost;
    state.ai.hand.splice(idx, 1);
    events.push(resolveCard(state, 'ai', card));
    state.aiDiscard.push(card);
    if (events.length) state.log = events[events.length - 1].text;
  }
  return events;
}

// Start a fresh player turn: new round energy, draw to 5, fresh telegraph.
export function startPlayerTurn(state) {
  if (state.phase === 'win' || state.phase === 'loss') return;
  state.round++;
  state.phase = 'player';
  state.you.shield = 0;
  state.you.turnElements = [];
  state.you.energy = energyForRound(state.round);
  drawUpTo(state.youDeck, state.youDiscard, state.you.hand, HAND_SIZE, state.rng);
  state.ai.energy = energyForRound(state.round);
  drawUpTo(state.aiDeck, state.aiDiscard, state.ai.hand, HAND_SIZE, state.rng);
  state.telegraph = aiTelegraph(state);
  state.log = 'Round ' + state.round + ' — your move. ' + state.telegraph;
}
