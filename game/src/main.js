// main.js — game loop, input and deterministic screenshot modes for Ember Pact.
import { mulberry32 } from './deck.js';
import { cardById } from './cards.js';
import { createGame, playCard, aiTakeTurn, startPlayerTurn } from './state.js';
import { renderTable, renderEnd, showScreen, spawnFloat, damageFlash, launchConfetti, el } from './render.js';
import { sfx, ensureAudio } from './audio.js';

const SHOT_SEED = 20261122;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot'); // title | table | win | loss | null (live play)

let state = null;
const ui = { selected: -1, midCard: null, onPlayCard: handlePlayCard };

function randomSeed() {
  return Math.floor(Math.random() * 2147483647);
}

function newGame() {
  state = createGame(mulberry32(randomSeed()));
  ui.selected = -1;
  ui.midCard = null;
  showScreen('table');
  renderTable(state, ui);
}

function handlePlayCard(index) {
  if (!state || state.phase !== 'player') return;
  if (ui.selected === index) {
    // Second press on the selected card plays it.
    playSelected(index);
    return;
  }
  const card = state.you.hand[index];
  if (!card) return;
  if (card.cost > state.you.energy) {
    state.log = 'Not enough energy for ' + card.name + ' (' + card.cost + ' needed).';
    renderTable(state, ui);
    return;
  }
  ui.selected = index;
  renderTable(state, ui);
  // A click on an already affordable card plays it straight away on the next click;
  // a single click selects, a second click (or double-click) plays.
  // To keep mouse play snappy, a plain click plays immediately when nothing is selected yet:
  // (selection above is only for keyboard users — see the note in handleKey.)
  playSelected(index);
}

function playSelected(index) {
  const card = state.you.hand[index];
  if (!card) return;
  const result = playCard(state, index);
  if (!result.ok) {
    state.log = result.reason || 'Cannot play that card.';
    renderTable(state, ui);
    return;
  }
  ui.selected = -1;
  ui.midCard = card;
  const ev = result.event;
  if (ev.card.kind === 'strike') {
    sfx.hit();
    damageFlash();
    spawnFloat('-' + ev.amount, 'dmg', 620, 120);
    if (ev.advantage) spawnFloat('Element advantage!', 'bonus', 560, 160);
    if (ev.surge) spawnFloat('SURGE +2!', 'bonus', 620, 200);
  } else if (ev.card.kind === 'mend') {
    sfx.heal();
    spawnFloat('+' + ev.amount, 'heal', 620, 480);
  } else if (ev.card.kind === 'guard') {
    sfx.shield();
    spawnFloat('🛡 +' + ev.amount, 'shield', 620, 480);
  } else {
    sfx.draw();
  }
  renderTable(state, ui);
  window.setTimeout(() => { ui.midCard = null; if (state.phase === 'player') renderTable(state, ui); }, 900);
  if (state.phase === 'win' || state.phase === 'loss') finishGame();
}

function finishGame() {
  renderEnd(state);
  showScreen('end');
  if (state.phase === 'win') {
    sfx.win();
    launchConfetti(mulberry32(randomSeed()), 70, false);
  } else {
    sfx.lose();
  }
}

function handleEndTurn() {
  if (!state || state.phase !== 'player') return;
  sfx.turn();
  ui.selected = -1;
  ui.midCard = null;
  const events = aiTakeTurn(state);
  renderTable(state, ui);
  let step = 0;
  const stepAi = () => {
    if (state.phase === 'win' || state.phase === 'loss') { finishGame(); return; }
    if (step < events.length) {
      const ev = events[step++];
      if (ev.card.kind === 'strike') {
        sfx.hit();
        damageFlash();
        spawnFloat('-' + ev.amount, 'dmg', 620, 480);
        if (ev.advantage) spawnFloat('Element advantage!', 'bonus', 560, 440);
      } else if (ev.card.kind === 'mend') {
        sfx.heal();
        spawnFloat('+' + ev.amount, 'heal', 620, 120);
      } else if (ev.card.kind === 'guard') {
        sfx.shield();
        spawnFloat('🛡 +' + ev.amount, 'shield', 620, 120);
      } else { sfx.draw(); }
      state.log = "Cinder plays " + ev.text;
      renderTable(state, ui);
      window.setTimeout(stepAi, 650);
    } else {
      startPlayerTurn(state);
      if (state.phase === 'win' || state.phase === 'loss') { finishGame(); return; }
      renderTable(state, ui);
    }
  };
  window.setTimeout(stepAi, 650);
}

function handleKey(event) {
  if (!state || el('table-screen').hidden) return;
  if (event.key >= '1' && event.key <= '5') {
    const idx = Number(event.key) - 1;
    if (ui.selected === idx) playSelected(idx);
    else { ui.selected = idx; sfx.click(); renderTable(state, ui); }
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    handleEndTurn();
  }
}

// ---------- deterministic screenshot states ----------
function shotState(kind) {
  const rng = mulberry32(SHOT_SEED);
  const game = createGame(rng);
  if (kind === 'table') {
    game.round = 3;
    game.phase = 'player';
    game.you.life = 22; game.ai.life = 17;
    game.you.energy = 5; game.ai.energy = 4;
    game.you.shield = 3; game.ai.shield = 0;
    game.damageDealt = 13;
    game.cardsPlayed = 9;
    game.you.hand = ['ember-strike', 'cinder-burst', 'thorn-wall', 'phoenix-mend', 'frost-spark']
      .map((id, i) => ({ ...cardById(id), uid: 'shot-you-' + i }));
    game.ai.hand = [0, 1, 2, 3, 4].map((i) => ({ ...cardById('stone-guard'), uid: 'shot-ai-' + i }));
    game.lastYouCard = { ...cardById('cinder-burst'), uid: 'shot-last-you' };
    game.lastAiCard = { ...cardById('thorn-wall'), uid: 'shot-last-ai' };
    game.telegraph = 'Cinder is charging a heavy strike… guard up!';
    game.log = 'Cinder Burst hits for 12 (element advantage +2!) (Surge +2!)';
    game.youDeck = game.youDeck.slice(0, 14);
    return { game, midCard: { ...cardById('flame-lick'), uid: 'shot-mid' } };
  }
  if (kind === 'win') {
    game.round = 6;
    game.phase = 'win';
    game.you.life = 12; game.ai.life = 0;
    game.damageDealt = 34;
    game.cardsPlayed = 21;
    return { game, midCard: null };
  }
  // loss
  game.round = 5;
  game.phase = 'loss';
  game.you.life = 0; game.ai.life = 9;
  game.damageDealt = 21;
  game.cardsPlayed = 17;
  return { game, midCard: null };
}

function boot() {
  document.body.addEventListener('pointerdown', ensureAudio, { once: true });
  el('start-btn').addEventListener('click', () => { sfx.click(); newGame(); });
  el('again-btn').addEventListener('click', () => { sfx.click(); newGame(); });
  el('end-turn-btn').addEventListener('click', handleEndTurn);
  el('howto-btn').addEventListener('click', () => {
    const panel = el('howto');
    panel.hidden = !panel.hidden;
    sfx.click();
  });
  document.addEventListener('keydown', handleKey);

  if (shot === 'title') {
    document.body.classList.add('shot');
    showScreen('title');
  } else if (shot === 'table' || shot === 'win' || shot === 'loss') {
    document.body.classList.add('shot');
    const { game, midCard } = shotState(shot);
    state = game;
    ui.midCard = midCard;
    if (shot === 'table') {
      showScreen('table');
      renderTable(state, ui);
    } else {
      renderEnd(state);
      showScreen('end');
      if (shot === 'win') launchConfetti(mulberry32(SHOT_SEED), 70, true);
    }
  } else {
    showScreen('title');
  }

  // Exposed for headless play-testing only (no network, no secrets).
  window.__ember = {
    get state() { return state; },
    newGame, playCard: (i) => playSelected(i), endTurn: handleEndTurn, finishGame,
  };
}

boot();
