#!/usr/bin/env python3
"""Generates the search/social metadata for the home page and for each sport page.

Why: every sport URL (/badminton, /padel, ...) serves the same app, but search engines and link previews
(WhatsApp, X, Facebook) read the HTML *before* any JavaScript runs, so each URL needs its own <title>,
description and Open Graph tags. There is no build step in this project, so this script writes them into
static files that are committed: index.html (home) and one <sport>.html per sport.

Usage:   python tools/make-pages.py --site https://your-real-domain.com
Run it again whenever the copy below changes or the site address changes, then commit the result.
Open Graph images need an ABSOLUTE address, which is why --site matters (it defaults to a placeholder).
"""
import argparse
import html
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent

HOME = {
    "title": "ScoreTracker — Free Score Keeper for Badminton, Padel, Tennis & More",
    "description": "Stop arguing about the score. Free score keeper for badminton, padel, tennis, volleyball, table tennis, squash and basketball. Tap, tap, done. No sign-up.",
}

# slug -> (display name, one line about how scoring works)
SPORTS = {
    "badminton": ("Badminton", "Tap to score to 21, win by 2 (max 30)."),
    "volleyball": ("Volleyball", "Tap to score to 25, win by 2."),
    "tennis": ("Tennis", "Points, games and tiebreaks, with advantage or golden point."),
    "table-tennis": ("Table Tennis", "Tap to score to 11, win by 2."),
    "padel": ("Padel", "Points, games and tiebreaks, with golden point or advantage."),
    "basketball": ("Basketball", "Count points to any target you choose."),
    "squash": ("Squash", "Tap to score to 11 or 15, win by 2."),
}


def sport_copy(name, line):
    return {
        "title": f"{name} Score Keeper — Free, No Sign-up | ScoreTracker",
        "description": f"Free {name.lower()} score keeper for your phone. {line} Undo mistakes, share the result. Works offline, no sign-up.",
    }


def seo_block(site, path, copy):
    e = lambda s: html.escape(s, quote=True)
    url = site + path
    image = site + "/og-image.jpg"
    return "\n".join([
        "<!-- seo:start (written by tools/make-pages.py; do not edit by hand) -->",
        f"<title>{e(copy['title'])}</title>",
        f'<meta name="description" content="{e(copy["description"])}">',
        f'<link rel="canonical" href="{e(url)}">',
        '<meta property="og:type" content="website">',
        '<meta property="og:site_name" content="ScoreTracker">',
        f'<meta property="og:title" content="{e(copy["title"])}">',
        f'<meta property="og:description" content="{e(copy["description"])}">',
        f'<meta property="og:url" content="{e(url)}">',
        f'<meta property="og:image" content="{e(image)}">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        '<meta name="twitter:card" content="summary_large_image">',
        f'<meta name="twitter:title" content="{e(copy["title"])}">',
        f'<meta name="twitter:description" content="{e(copy["description"])}">',
        f'<meta name="twitter:image" content="{e(image)}">',
        "<!-- seo:end -->",
    ])


BLOCK = re.compile(r"<!-- seo:start.*?<!-- seo:end -->", re.S)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--site", default="https://your-site.vercel.app", help="public address of the site, no trailing slash")
    site = ap.parse_args().site.rstrip("/")

    index_path = ROOT / "index.html"
    index = index_path.read_text(encoding="utf-8")
    if not BLOCK.search(index):
        raise SystemExit("index.html has no <!-- seo:start --> ... <!-- seo:end --> block")

    index_path.write_text(BLOCK.sub(lambda m: seo_block(site, "/", HOME), index), encoding="utf-8", newline="\n")
    index = index_path.read_text(encoding="utf-8")
    for slug, (name, line) in SPORTS.items():
        page = BLOCK.sub(lambda m: seo_block(site, "/" + slug, sport_copy(name, line)), index)
        (ROOT / f"{slug}.html").write_text(page, encoding="utf-8", newline="\n")
        print("wrote", f"{slug}.html")
    print("site:", site)


if __name__ == "__main__":
    main()
