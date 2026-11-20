#!/usr/bin/env python3
"""Capture the four Leonida Ledger screenshots listed in shots.json.

Serves app/ on a local port, seeds a mid-game progress state in localStorage
(13 of 55 trophies earned across kinds and grades, three counters part-way:
17/42 range challenges, 43/100 WAiNK locations, 3/8 stranger strands), then
captures each view at 1280x800 as a JPEG.

Run with a Python that has Playwright + Chromium installed, e.g.:
    ~/workspace/.venv-open3d/bin/python tools/screenshots.py

Output: screenshots/1-cover.jpg, 2-roadmap.jpg, 3-missables.jpg, 4-spoilers.jpg
Each is verified against the kit's caps (<= 256 KiB, 1280x800); quality is
lowered automatically if a shot comes out too heavy.
"""

import functools
import http.server
import json
import socketserver
import sys
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

REPO = Path(__file__).resolve().parent.parent
APP_DIR = REPO / "app"
SHOTS_DIR = REPO / "screenshots"
PORT = 8131
BASE = f"http://localhost:{PORT}"
MAX_BYTES = 256 * 1024

SEED = {
    "earned": {str(i): True for i in [2, 3, 8, 9, 16, 20, 21, 28, 30, 35, 44, 51, 55]},
    "counters": {"17": 17, "31": 43, "25": 3},
    "spoilers": False,
}


def serve():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(APP_DIR))
    httpd = socketserver.TCPServer(("127.0.0.1", PORT), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def save_shot(page, name, quality=82):
    path = SHOTS_DIR / name
    page.screenshot(path=str(path), type="jpeg", quality=quality)
    size = path.stat().st_size
    while size > MAX_BYTES and quality > 40:
        quality -= 8
        page.screenshot(path=str(path), type="jpeg", quality=quality)
        size = path.stat().st_size
    print(f"{name}: {size} bytes (quality {quality})")
    if size > MAX_BYTES:
        raise SystemExit(f"{name} is {size} bytes, over the 256 KiB cap")
    return size


def main():
    SHOTS_DIR.mkdir(exist_ok=True)
    for old in SHOTS_DIR.iterdir():
        if old.is_file():
            old.unlink()

    httpd = serve()
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": 1280, "height": 800})
            page.goto(BASE + "/index.html")
            page.wait_for_selector(".trophy-row")
            page.evaluate(
                "(s) => localStorage.setItem('leonida-ledger-v1', JSON.stringify(s))", SEED
            )
            page.reload()
            page.wait_for_selector(".trophy-row")
            assert page.inner_text("#earned-count") == "13", "seed did not apply"

            # 1 — cover: missable filter on, guide pane open on Strangers & Freaks
            # (missable, silver, counter 3/8), viewed from the top of the page.
            page.select_option("#filter-kind", "missable")
            page.locator('.trophy-row[data-id="25"] .trophy-text').click()
            page.wait_for_selector("#guide-pane .sources")
            page.evaluate("window.scrollTo(0, 0)")
            page.wait_for_timeout(350)
            save_shot(page, "1-cover.jpg")

            # 2 — roadmap: scrolled so Stage 1's progress and Stage 2's missable
            # flags share the frame.
            page.click('.tab[data-view="roadmap"]')
            page.wait_for_selector(".stage-card")
            page.evaluate("window.scrollTo(0, 200)")
            page.wait_for_timeout(350)
            save_shot(page, "2-roadmap.jpg")

            # 3 — missables: scrolled so the Strangers & Freaks card and its
            # strand counter sit in the frame with the neighbouring cards.
            page.click('.tab[data-view="missables"]')
            page.wait_for_selector(".missable-card")
            page.evaluate(
                """() => { const cards = [...document.querySelectorAll('.missable-card')];
                   const c = cards.find(c => c.querySelector('h3').textContent.includes('Strangers'));
                   window.scrollTo(0, window.scrollY + c.getBoundingClientRect().top - 90); }"""
            )
            page.wait_for_timeout(350)
            save_shot(page, "3-missables.jpg")

            # 4 — spoilers: back on the tracker with the spoiler shield on, so
            # unearned story trophies are masked while earned ones stay visible.
            page.click('.tab[data-view="tracker"]')
            page.wait_for_selector(".trophy-row")
            page.select_option("#filter-kind", "all")
            page.check("#spoiler-toggle")
            page.evaluate("window.scrollTo(0, 140)")
            page.wait_for_timeout(350)
            save_shot(page, "4-spoilers.jpg")

            browser.close()
    finally:
        httpd.shutdown()

    shots = sorted(SHOTS_DIR.iterdir())
    print("screenshots/:", [f"{s.name} ({s.stat().st_size} B)" for s in shots])
    assert len(shots) == 4, "expected exactly 4 screenshots"
    print("done")


if __name__ == "__main__":
    sys.exit(main())
