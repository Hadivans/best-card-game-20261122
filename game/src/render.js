// render.js — DOM rendering, card animation and floating feedback for Ember Pact.
import { ELEMENTS, kindLabel } from './cards.js';

export function el(id) { return document.getElementById(id); }

function energyPips(container, energy, max) {
  container.innerHTML = '';
  for (let i = 0; i < max; i++) {
    const pip = document.createElement('span');
    pip.className = 'energy-pip' + (i < energy ? ' on' : '');
    container.appendChild(pip);
  }
}

function lifeBar(fillEl, textEl, life, max) {
  fillEl.style.width = Math.max(0, (life / max) * 100) + '%';
  textEl.textContent = '❤ ' + life + ' / ' + max;
}

function shieldTag(tagEl, shield) {
  tagEl.hidden = shield <= 0;
  tagEl.textContent = '🛡 ' + shield;
}

// Build one card's DOM. opts: { mini, keyIndex, selected, unaffordable, onClick, extraClass }
export function cardElement(card, opts) {
  const o = opts || {};
  const node = document.createElement('div');
  node.className = 'card el-' + card.element + (o.mini ? ' mini' : '') + (o.selected ? ' selected' : '')
    + (o.unaffordable ? ' unaffordable' : '') + (o.extraClass ? ' ' + o.extraClass : '');
  const element = ELEMENTS[card.element];
  node.innerHTML =
    '<div class="cost">' + card.cost + '</div>'
    + '<div class="el-icon">' + element.icon + '</div>'
    + '<div class="el-name">' + element.name + '</div>'
    + '<div class="card-name">' + card.name + '</div>'
    + '<div class="card-value">' + card.value + '</div>'
    + '<div class="card-kind">' + kindLabel(card.kind) + '</div>'
    + '<div class="card-text">' + card.text + '</div>'
    + (o.keyIndex != null ? '<div class="card-key">[' + o.keyIndex + ']</div>' : '');
  if (o.onClick) node.addEventListener('click', o.onClick);
  return node;
}

function renderMiniHand(container, count) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const back = document.createElement('div');
    back.className = 'mini-card';
    container.appendChild(back);
  }
}

function renderPlayedSlot(slotEl, card) {
  slotEl.querySelectorAll('.card').forEach((n) => n.remove());
  const label = slotEl.querySelector('.slot-label');
  if (label) label.style.display = card ? 'none' : '';
  if (card) slotEl.appendChild(cardElement(card, { mini: true }));
}

// Full table render from state. ui: { selected, onPlayCard, midCard }
export function renderTable(state, ui) {
  el('hud-round').textContent = 'Round ' + state.round;
  el('hud-turn').textContent = state.phase === 'player' ? 'Your turn' : (state.phase === 'ai' ? "Cinder's turn…" : state.phase);
  el('hud-damage').textContent = 'Damage dealt: ' + state.damageDealt;
  el('hud-deck').textContent = 'Deck: ' + state.youDeck.length;
  el('telegraph').textContent = state.telegraph;
  el('log-line').textContent = state.log;

  lifeBar(el('foe-life-fill'), el('foe-life-text'), state.ai.life, 30);
  lifeBar(el('you-life-fill'), el('you-life-text'), state.you.life, 30);
  shieldTag(el('foe-shield'), state.ai.shield);
  shieldTag(el('you-shield'), state.you.shield);
  energyPips(el('foe-energy'), state.ai.energy, 10);
  energyPips(el('you-energy'), state.you.energy, 10);
  renderMiniHand(el('foe-hand'), state.ai.hand.length);
  renderPlayedSlot(el('foe-played'), state.lastAiCard);
  renderPlayedSlot(el('you-played'), state.lastYouCard);

  const surgeCount = {};
  for (const e of state.you.turnElements) surgeCount[e] = (surgeCount[e] || 0) + 1;
  const surged = Object.keys(surgeCount).find((k) => surgeCount[k] >= 1);
  el('surge-note').textContent = surged
    ? '⚡ Surge ready: another ' + ELEMENTS[surged].name + ' card gets +2!'
    : '';

  const handEl = el('hand');
  handEl.innerHTML = '';
  state.you.hand.forEach((card, i) => {
    const node = cardElement(card, {
      keyIndex: i + 1,
      selected: ui.selected === i,
      unaffordable: card.cost > state.you.energy || state.phase !== 'player',
      onClick: () => ui.onPlayCard(i),
    });
    handEl.appendChild(node);
  });

  const mid = el('mid-card');
  mid.innerHTML = '';
  if (ui.midCard) mid.appendChild(cardElement(ui.midCard, { extraClass: 'mid-play' }));

  el('end-turn-btn').disabled = state.phase !== 'player';
}

export function showScreen(name) {
  el('title-screen').hidden = name !== 'title';
  el('table-screen').hidden = name !== 'table';
  el('end-screen').hidden = name !== 'end';
}

export function renderEnd(state) {
  const win = state.phase === 'win';
  el('end-emblem').textContent = win ? '🏆' : '🥀';
  const title = el('end-title');
  title.textContent = win ? 'VICTORY' : 'DEFEAT';
  title.className = 'end-title ' + (win ? 'win' : 'loss');
  el('end-sub').textContent = win
    ? "Cinder's embers scatter across the table. The pact is yours."
    : 'Cinder keeps the pact — this time. The warden waits for a rematch.';
  el('end-stats').textContent = 'Rounds: ' + state.round + ' · Damage dealt: ' + state.damageDealt
    + ' · Cards played: ' + state.cardsPlayed;
}

export function spawnFloat(text, kind, x, y) {
  const fx = el('fx');
  const node = document.createElement('div');
  node.className = 'float-num ' + kind;
  node.textContent = text;
  node.style.left = x + 'px';
  node.style.top = y + 'px';
  fx.appendChild(node);
  window.setTimeout(() => node.remove(), 1200);
}

export function damageFlash() {
  const app = el('app');
  app.classList.remove('flash-damage');
  void app.offsetWidth; // restart the animation
  app.classList.add('flash-damage');
}

const CONFETTI_COLORS = ['#ffd94d', '#e5484d', '#3e9bff', '#46a758', '#ff8a3c', '#fff3c4'];

// Confetti burst. In shot mode the pieces are placed frozen mid-air (deterministic).
export function launchConfetti(rng, count, frozen) {
  const fx = el('fx');
  fx.querySelectorAll('.confetti').forEach((n) => n.remove());
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti' + (frozen ? ' static' : '');
    piece.style.left = Math.floor(rng() * 1240) + 'px';
    piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    if (frozen) {
      piece.style.top = Math.floor(rng() * 640) + 'px';
      piece.style.transform = 'rotate(' + Math.floor(rng() * 360) + 'deg)';
    } else {
      piece.style.animationDelay = (rng() * 1.2).toFixed(2) + 's';
    }
    fx.appendChild(piece);
  }
}
