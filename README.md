# Ember Pact

[![main](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/Hadivans/best-card-game-20261122/rank.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/Hadivans/best-card-game-20261122/reward.svg)](https://make.fun/c/best-card-game-20261122-1826)

**Ember Pact** is an original 1v1 elemental card duel against **Cinder, the Ash Warden**.
Both sides start at 30 life. Each turn your energy refills (more every round, up to 10)
and you draw up to 5 cards from a 24-card deck across 4 elements — 🔥 Ember, ❄️ Frost,
🍃 Leaf, ⛰️ Stone — told apart by colour, shape and icon, never by text alone.

## The rules that make each hand a decision

- **Element wheel:** Ember beats Leaf beats Frost beats Stone beats Ember — +2 damage
  when your element beats Cinder's last played element.
- **Surge:** play 2 cards of the same element in one turn and the second gains +2.
- **Telegraphs:** Cinder warns you what is coming ("charging a heavy strike…"),
  so you can Guard, strike first, or save your big hits.
- **Cards:** Strike (damage), Guard (shield), Mend (heal), Spark (draw a card),
  plus specials like Cinder Burst and Thorn Wall.

## How to play

- **Mouse:** click a card to play it (if you can pay its energy cost).
- **Keyboard:** keys `1–5` select a card (press again to play it), `Enter` / `Space` ends your turn.
- **Buttons:** End Turn, and How to Play on the title screen.
- Reduce Cinder to 0 life to win; if your life hits 0, the warden keeps the pact.

Cards slide, flip and snap into place, damage flashes, floating damage numbers rise,
and victory lands with a confetti flourish. Sounds are tiny WebAudio tones —
no audio files. Everything runs offline from static files; no network requests.

## Screenshots

Deterministic views via URL query: `?shot=title`, `?shot=table`, `?shot=win`, `?shot=loss`
(seeded RNG, so each renders the same screen every time). Normal play uses random shuffles.

## Files

- `game/index.html` — the page
- `game/styles.css` — table, cards, screens, animations
- `game/src/cards.js` — the 24 card definitions and the element wheel
- `game/src/deck.js` — seeded shuffle and draw pile
- `game/src/ai.js` — Cinder's strategy and telegraphs
- `game/src/state.js` — game state and rules
- `game/src/render.js` — DOM rendering, animations, confetti
- `game/src/audio.js` — WebAudio tones
- `game/src/main.js` — game loop, input, screenshot modes
- `main.ts` — hand-in program (copies `game/` + `screenshots/`, writes `dossier.json`)
- `screenshots/` — 1-title, 2-table, 3-win, 4-loss (real renders of this game)

## Run it

Serve `game/` with any static server and open `index.html`, e.g.
`python3 -m http.server` inside `game/`. To build the entry output:
`mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`.

## License

MIT — see [LICENSE](LICENSE).
