// Ember Pact — hand-in program (Node 22, standard library only).
//
// It hands the finished game to make.fun: copy this repository's game/ and
// screenshots/ into the output directory and write /output/dossier.json with
// the vendored make.fun library (vendor/makefun-game.ts, unchanged from the
// kit). Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The program is deterministic: two runs over the same repository write the
// same bytes, because it copies files as they are and the dossier builder
// writes a fixed summary of them. (Verified locally: two runs, diff clean.)

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Where the repository lives (the folder holding this file) and where the
// entry goes (the grader's /output, or MAKEFUN_OUTPUT_DIR when testing).
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps, as the kit documents them: only text_max_bytes
// shapes the dossier's bytes; the rest refuse an entry the scorer would
// refuse anyway (more than 4 screenshots, one over 256 KiB, more than 993
// files in game/ or 48 MiB of game files, or a path under game/ over 1000
// bytes — game/ counts beside /output's own 1000-entry cap, its screenshots/
// and dossier.json).
const dossierOptions = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function copyEntryFolder(name) {
  const source = join(repoRoot, name);
  const target = join(outputDir, name);
  if (!existsSync(source)) return;
  rmSync(target, { recursive: true, force: true });
  cpSync(source, target, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyEntryFolder('game');
copyEntryFolder('screenshots');

const dossier = buildDossier(outputDir, dossierOptions);
writeFileSync(join(outputDir, 'dossier.json'), dossier);
