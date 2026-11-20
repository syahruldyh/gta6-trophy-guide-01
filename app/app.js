// Leonida Ledger — GTA 6 Trophy Guide & Tracker.
// All state lives in localStorage; the app fetches only its own data file and works offline.

const STORAGE_KEY = "leonida-ledger-v1";
const MASK_TEXT = "Hidden story trophy — enable spoilers or earn it to reveal";
const GRADES = ["platinum", "gold", "silver", "bronze"];

const STAGES = [
  {
    n: 1,
    title: "Stage 1 — Play the story",
    blurb:
      "Run the campaign from Gone Fishing to the final mission. Story trophies cannot be missed, " +
      "so this pass is about progress: open the map, meet every character, and start the strands you will close in Stage 2.",
  },
  {
    n: 2,
    title: "Stage 2 — Close the strands before the point of no return",
    blurb:
      "Every missable lives here. Finish the character strands (Andy's, Kenton's, Billy's, Randy's and Tyrone's finales, " +
      "and eight strands in total), take Bret's unique hunt, grab the VCIA departure while that storyline has you at the " +
      "airport, and let a failed attempt give Bad Luck, I Guess its second try — all before the final mission.",
  },
  {
    n: 3,
    title: "Stage 3 — Sweep the collections",
    blurb:
      "Map-wide gathering: meditation spots, card sets, WAiNK locations, discovered vehicles, every area of Leonida, " +
      "the garages and the Scooter Bros registrations. Work region by region so nothing needs a dedicated trip.",
  },
  {
    n: 4,
    title: "Stage 4 — Activities, feats and the grind",
    blurb:
      "The long tail: stunts, range golds, races, robberies, partner feats and the money counters. Most of these " +
      "accumulate while you play; use the counters in each guide to see exactly what is left.",
  },
  {
    n: 5,
    title: "Stage 5 — 100% and the platinum",
    blurb:
      "When everything else is done, A Long Road (100% completion) falls, and with it Vice Got a Price! — " +
      "the platinum unlocks automatically once the other 54 are earned.",
  },
];

let trophies = [];
let byId = new Map();
let state = loadState();
let ui = { view: "tracker", search: "", kind: "all", grade: "all", status: "all", selectedId: 25 };

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (raw && typeof raw === "object") {
      return {
        earned: raw.earned && typeof raw.earned === "object" ? raw.earned : {},
        counters: raw.counters && typeof raw.counters === "object" ? raw.counters : {},
        spoilers: !!raw.spoilers,
      };
    }
  } catch (err) {
    /* a corrupt save falls back to a fresh one */
  }
  return { earned: {}, counters: {}, spoilers: false };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function isEarned(t) {
  return !!state.earned[t.id];
}

function counterOf(t) {
  return state.counters[t.id] || 0;
}

function isMasked(t) {
  return state.spoilers && t.kind === "story" && !isEarned(t);
}

function shownName(t) {
  return isMasked(t) ? MASK_TEXT : t.name;
}

function shownDesc(t) {
  return isMasked(t) ? MASK_TEXT : t.description;
}

function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function fmt(n) {
  return n.toLocaleString("en-US");
}

function roadmapOrder() {
  return [...trophies].sort((a, b) => a.stage - b.stage || a.id - b.id);
}

/* ---------------- header / progress ---------------- */

function renderHeader() {
  const earnedCount = trophies.filter(isEarned).length;
  document.getElementById("earned-count").textContent = String(earnedCount);
  const pct = Math.round((earnedCount / trophies.length) * 100);
  document.getElementById("progress-fill").style.width = pct + "%";
  document.getElementById("progress-pct").textContent = pct + "% complete";
  const counts = document.getElementById("grade-counts");
  counts.innerHTML = GRADES.map((g) => {
    const all = trophies.filter((t) => t.grade === g);
    const got = all.filter(isEarned).length;
    return `<li><span class="swatch ${g}"></span>${g[0].toUpperCase() + g.slice(1)}: ${got}/${all.length}</li>`;
  }).join("");
}

/* ---------------- tracker list ---------------- */

function matchesFilters(t) {
  if (ui.kind === "missable") {
    if (!t.missable) return false;
  } else if (ui.kind !== "all" && t.kind !== ui.kind) {
    return false;
  }
  if (ui.grade !== "all" && t.grade !== ui.grade) return false;
  if (ui.status === "earned" && !isEarned(t)) return false;
  if (ui.status === "unearned" && isEarned(t)) return false;
  if (ui.search) {
    const hay = (t.name + " " + t.description + " " + t.guide).toLowerCase();
    if (!hay.includes(ui.search.toLowerCase())) return false;
  }
  return true;
}

function rowBadges(t) {
  let out = "";
  if (t.missable) out += `<span class="badge badge-missable">Missable</span>`;
  if (t.hidden) out += `<span class="badge badge-hidden">Hidden</span>`;
  if (t.target) out += `<span class="badge badge-counter">${fmt(counterOf(t))} / ${fmt(t.target)}</span>`;
  return out;
}

function renderList() {
  const list = document.getElementById("trophy-list");
  const visible = trophies.filter(matchesFilters);
  document.getElementById("list-summary").textContent =
    `Showing ${visible.length} of ${trophies.length} trophies` +
    (state.spoilers ? " — spoiler shield ON: unearned story trophies are masked." : "");
  list.innerHTML = visible
    .map(
      (t) => `
      <li class="trophy-row${isEarned(t) ? " is-earned" : ""}${ui.selectedId === t.id ? " is-selected" : ""}" data-id="${t.id}">
        <input type="checkbox" data-action="toggle-earned" data-id="${t.id}" ${isEarned(t) ? "checked" : ""} aria-label="Mark ${esc(t.name)} as earned">
        <span class="swatch ${t.grade}"></span>
        <span class="trophy-text">
          <span class="trophy-name">${esc(shownName(t))}</span>
          <span class="trophy-desc">${esc(shownDesc(t))}</span>
        </span>
        <span class="row-badges">${rowBadges(t)}</span>
      </li>`
    )
    .join("");
}

function renderNextUp() {
  const box = document.getElementById("next-up");
  const ordered = roadmapOrder();
  let next = ordered.filter((t) => !isEarned(t) && t.id !== 1).slice(0, 4);
  if (next.length === 0) {
    const plat = byId.get(1);
    if (plat && !isEarned(plat)) next = [plat];
  }
  if (next.length === 0) {
    box.innerHTML = `<h3>Next Up</h3><p>Everything is earned — Leonida is yours. Platinum secured.</p>`;
    return;
  }
  box.innerHTML =
    `<h3>Next Up — in roadmap order</h3>` +
    next
      .map(
        (t) =>
          `<span class="next-item"><button type="button" data-action="select" data-id="${t.id}">${esc(shownName(t))}</button> ` +
          `<span class="next-stage">Stage ${t.stage}${t.missable ? " · MISSABLE" : ""}</span></span>`
      )
      .join("");
}

/* ---------------- guide pane ---------------- */

function counterBox(t) {
  if (!t.target) return "";
  const step = t.step || 1;
  return `
    <div class="counter-box">
      <button type="button" data-action="counter-dec" data-id="${t.id}" aria-label="Decrease counter">−</button>
      <span>Progress: <span class="counter-value">${fmt(counterOf(t))}</span> / ${fmt(t.target)} ${esc(t.unit || "")}</span>
      <button type="button" data-action="counter-inc" data-id="${t.id}" aria-label="Increase counter">+</button>
      <span class="badge badge-counter">step ${fmt(step)}</span>
    </div>`;
}

function renderGuide() {
  const pane = document.getElementById("guide-pane");
  const t = byId.get(ui.selectedId);
  if (!t) {
    pane.innerHTML = `<p class="guide-empty">Select a trophy on the left to read its guide.</p>`;
    return;
  }
  const earned = isEarned(t);
  pane.innerHTML = `
    <div class="guide-meta">
      <span class="grade-chip ${t.grade}">${t.grade}</span>
      ${t.hidden ? `<span class="badge badge-hidden">Hidden on PSN</span>` : ""}
      ${t.missable ? `<span class="badge badge-missable">Missable</span>` : ""}
      <span class="badge badge-hidden">Stage ${t.stage} · ${esc(t.kind)}</span>
    </div>
    <h3>${esc(shownName(t))}</h3>
    <p class="guide-official">“${esc(shownDesc(t))}” — official description</p>
    <p class="guide-text">${esc(t.guide)}</p>
    <p class="sources"><strong>Sources:</strong> ${esc(t.sources)}</p>
    ${t.missable ? `<p class="missable-note"><strong>Missable:</strong> ${esc(t.missableNote || "")}</p>` : ""}
    ${counterBox(t)}
    <button type="button" class="earn-toggle${earned ? " is-earned" : ""}" data-action="toggle-earned" data-id="${t.id}">
      ${earned ? "✓ Earned — tap to undo" : "Mark as earned"}
    </button>`;
}

/* ---------------- roadmap & missables views ---------------- */

function renderRoadmap() {
  const wrap = document.getElementById("roadmap-stages");
  wrap.innerHTML = STAGES.map((s) => {
    const members = roadmapOrder().filter((t) => t.stage === s.n);
    const got = members.filter(isEarned).length;
    const pct = Math.round((got / members.length) * 100);
    const rows = members
      .map(
        (t) => `
        <li>
          <span>${isEarned(t) ? "✓" : "○"}</span>
          <span class="swatch ${t.grade}"></span>
          <button type="button" data-action="select" data-id="${t.id}" class="${isEarned(t) ? "done" : ""}">${esc(shownName(t))}</button>
          ${t.missable ? `<span class="badge badge-missable">Missable</span>` : ""}
          ${t.target ? `<span class="badge badge-counter">${fmt(counterOf(t))} / ${fmt(t.target)}</span>` : ""}
        </li>`
      )
      .join("");
    return `
      <article class="stage-card">
        <h3>${esc(s.title)}</h3>
        <p class="stage-blurb">${esc(s.blurb)}</p>
        <div class="stage-progress">
          <span><strong>${got} of ${members.length}</strong> earned</span>
          <span class="progress-bar"><span class="stage-fill" style="width:${pct}%"></span></span>
          <span>${pct}%</span>
        </div>
        <ul class="stage-trophies">${rows}</ul>
      </article>`;
  }).join("");
}

function renderMissables() {
  const wrap = document.getElementById("missable-list");
  const missables = roadmapOrder().filter((t) => t.missable);
  wrap.innerHTML = missables
    .map(
      (t) => `
      <article class="missable-card">
        <div class="guide-meta">
          <span class="grade-chip ${t.grade}">${t.grade}</span>
          <span class="badge badge-missable">Missable</span>
          <span class="badge badge-hidden">Stage ${t.stage}</span>
          ${isEarned(t) ? `<span class="badge badge-counter">✓ Earned</span>` : ""}
        </div>
        <h3>${esc(shownName(t))}</h3>
        <p class="guide-official">“${esc(shownDesc(t))}” — official description</p>
        ${counterBox(t)}
        <p class="missable-why"><strong>Why it can be missed:</strong> ${esc(t.missableNote || "")}</p>
        <p class="guide-text">${esc(t.guide)}</p>
        <p class="sources"><strong>Sources:</strong> ${esc(t.sources)}</p>
      </article>`
    )
    .join("");
}

/* ---------------- actions ---------------- */

function setEarned(id, value) {
  if (value) state.earned[id] = true;
  else delete state.earned[id];
  saveState();
  renderAll();
}

function bumpCounter(id, dir) {
  const t = byId.get(id);
  if (!t || !t.target) return;
  const step = t.step || 1;
  let v = counterOf(t) + dir * step;
  v = Math.max(0, Math.min(t.target, v));
  state.counters[id] = v;
  if (v >= t.target) state.earned[id] = true;
  saveState();
  renderAll();
}

function selectTrophy(id, jumpToTracker) {
  ui.selectedId = id;
  if (jumpToTracker && ui.view !== "tracker") switchView("tracker");
  renderAll();
}

function switchView(name) {
  ui.view = name;
  document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("is-active", b.dataset.view === name));
  document.getElementById("view-tracker").hidden = name !== "tracker";
  document.getElementById("view-roadmap").hidden = name !== "roadmap";
  document.getElementById("view-missables").hidden = name !== "missables";
  renderAll();
}

function renderAll() {
  renderHeader();
  renderNextUp();
  renderList();
  renderGuide();
  renderRoadmap();
  renderMissables();
}

function exportProgress() {
  const payload = JSON.stringify(
    { app: "leonida-ledger", version: 1, exportedAt: new Date().toISOString(), ...state },
    null,
    2
  );
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "leonida-ledger-progress.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (!data || typeof data !== "object" || typeof data.earned !== "object" || data.earned === null) {
        throw new Error("not a Leonida Ledger progress file");
      }
      state = {
        earned: data.earned,
        counters: data.counters && typeof data.counters === "object" ? data.counters : {},
        spoilers: !!data.spoilers,
      };
      saveState();
      document.getElementById("spoiler-toggle").checked = state.spoilers;
      renderAll();
    } catch (err) {
      document.getElementById("list-summary").textContent =
        "Import failed: that file is not valid Leonida Ledger progress JSON.";
    }
  };
  reader.readAsText(file);
}

/* ---------------- wiring ---------------- */

function wire() {
  document.querySelectorAll(".tab").forEach((b) =>
    b.addEventListener("click", () => switchView(b.dataset.view))
  );
  document.getElementById("search").addEventListener("input", (e) => {
    ui.search = e.target.value;
    renderList();
  });
  document.getElementById("filter-kind").addEventListener("change", (e) => {
    ui.kind = e.target.value;
    renderList();
  });
  document.getElementById("filter-grade").addEventListener("change", (e) => {
    ui.grade = e.target.value;
    renderList();
  });
  document.getElementById("filter-status").addEventListener("change", (e) => {
    ui.status = e.target.value;
    renderList();
  });
  const spoilerBox = document.getElementById("spoiler-toggle");
  spoilerBox.checked = state.spoilers;
  spoilerBox.addEventListener("change", (e) => {
    state.spoilers = e.target.checked;
    saveState();
    renderAll();
  });
  document.getElementById("export-btn").addEventListener("click", exportProgress);
  document.getElementById("import-file").addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) importProgress(e.target.files[0]);
    e.target.value = "";
  });

  document.body.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (btn) {
      const id = Number(btn.dataset.id);
      const action = btn.dataset.action;
      if (action === "toggle-earned" && btn.tagName !== "INPUT") {
        setEarned(id, !isEarned(byId.get(id)));
        return;
      }
      if (action === "counter-inc") return bumpCounter(id, 1);
      if (action === "counter-dec") return bumpCounter(id, -1);
      if (action === "select") return selectTrophy(id, true);
    }
    const row = e.target.closest(".trophy-row");
    if (row && !e.target.closest("input")) {
      selectTrophy(Number(row.dataset.id), false);
    }
  });

  document.getElementById("trophy-list").addEventListener("change", (e) => {
    const box = e.target.closest('input[data-action="toggle-earned"]');
    if (box) setEarned(Number(box.dataset.id), box.checked);
  });
}

async function init() {
  const res = await fetch("data/trophies.json");
  const data = await res.json();
  trophies = data.trophies;
  byId = new Map(trophies.map((t) => [t.id, t]));
  wire();
  renderAll();
}

init();
