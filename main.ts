// Leonida Ledger — entry program for gta6-trophy-guide-01 (Node 22, standard library only).
//
// The guide itself is the app/ folder next to this file: plain static files (index.html,
// style.css, app.js and data/trophies.json) that a browser opens directly, with no build
// step and no network access. This program's only job is the hand-in: copy app/ and
// screenshots/ into the output directory and write dossier.json there with the vendored
// make.fun library, byte for byte as the scorer's own copy would write it — so
// vendor/makefun-frontend.ts is imported, never edited.
//
// Run it the way the kit describes:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// (MAKEFUN_OUTPUT_DIR stands in for /output outside the grader.)

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's caps for this bounty, passed to buildDossier unchanged: dossier text is
// capped at 160 KiB, at most 4 screenshots of at most 256 KiB each, and app/ is limited
// to 993 files and 48 MiB.
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

// Fail loudly rather than hand in a broken guide: the app must have its entry page and
// its trophy data, and there must be at least the cover screenshot.
function sanityCheck() {
  for (const needed of ['app/index.html', 'app/data/trophies.json', 'screenshots/1-cover.jpg']) {
    if (!existsSync(join(repoDir, needed))) {
      throw new Error(`Leonida Ledger: missing ${needed} — build the app and capture screenshots first.`);
    }
  }
}

sanityCheck();
mkdirSync(outDir, { recursive: true });
copyTree(join(repoDir, 'app'), join(outDir, 'app'));

const shotsDir = join(outDir, 'screenshots');
mkdirSync(shotsDir, { recursive: true });
const localShots = join(repoDir, 'screenshots');
if (existsSync(localShots)) {
  copyTree(localShots, shotsDir);
}

writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, DOSSIER_LIMITS));

const shotCount = readdirSync(shotsDir).length;
console.log(`Leonida Ledger handed in: app/ + ${shotCount} screenshot(s) + dossier.json -> ${outDir}`);
