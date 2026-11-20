# Leonida Ledger — GTA 6 Trophy Guide & Tracker

![make.fun bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)
![rank](https://make.fun/badge/gta6-trophy-guide-01/syahruldyh/gta6-trophy-guide-01/rank.svg)
![reward](https://make.fun/badge/gta6-trophy-guide-01/syahruldyh/gta6-trophy-guide-01/reward.svg)

An offline guide and tracker for all **55 PlayStation 5 trophies of Grand Theft Auto VI**
(1 platinum, 2 gold, 6 silver, 46 bronze, 28 of them hidden), built for the make.fun bounty
[gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01).

Every trophy carries its official name, description and grade exactly as PlayStation
publishes them, plus a guide written for this entry in our own words that **cites its
sources** — the official list (Exophase & PSNProfiles) for the data, and either a named
community guide or an honest "derived from the official description" note for the steps.
No Rockstar artwork, no copied guide text, no network requests: the whole app is static
files that work with the connection off.

## Features

- **Checklist of all 55 trophies** — check/uncheck is saved in the browser (localStorage);
  the header shows earned x/55, per-grade counts and a completion bar.
- **Search** across names, descriptions and guide text.
- **Filters** by kind (story, missable, collectibles, activities, online), by grade, and
  by earned / not-yet-earned.
- **Spoiler shield** — when on, unearned story trophies are masked so you can browse the
  list without spoiling the campaign; earning one reveals it.
- **Guide pane** — each trophy's own-words guide with a visible Sources line, a MISSABLE
  badge with the reason it can be missed, and a +/− progress counter (saved) for every
  trophy PlayStation tracks with a count (42 Shooting Range challenges, 250 stunts, …).
- **Roadmap to the Platinum** — five stages derived from the official descriptions: story
  first, missables before their points of no return, collections, the activity grind, then
  100% and the platinum. Stage progress is driven by your checklist.
- **Missables view** — all 9 missable trophies with the reason each can be missed and what
  to do before the door closes.
- **Next Up panel** — the next unearned trophies in roadmap order, on the main view.
- **Export / Import** — download your progress as a JSON file and restore it anywhere.

## Data & sources

`app/data/trophies.json` holds the official list — each trophy's name, description, grade,
hidden flag and, where PlayStation tracks one, its target count — as published by
PlayStation and mirrored by Exophase and PSNProfiles, which agree on every entry. The
`guide` and `sources` fields are this entry's own work: the roadmap stages, kinds and
missable flags are derived from the official descriptions, and each guide says so, or
names the community guide its route came from. Where a description is all we have, the
guide hedges instead of inventing locations or steps.

## Run it

Any static file server works — the app is `app/index.html` plus its neighbours, with no
build step:

```sh
node serve.ts            # serves app/ at http://localhost:8080
# or: python3 -m http.server --directory app 8080
```

Open the page, and it works fully offline from then on. Your progress never leaves the
browser unless you export it yourself.

## Hand in (maintainers)

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes
`dossier.json` with the vendored `vendor/makefun-frontend.ts` library, unchanged.

Screenshots are produced by `tools/screenshots.py` (Playwright + Chromium), which seeds a
mid-game progress state and captures the four views listed in `shots.json`.

## License

MIT — see `LICENSE`.
