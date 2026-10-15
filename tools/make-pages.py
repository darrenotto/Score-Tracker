#!/usr/bin/env python3
"""Generates every static page and file that search engines, link previews and Google AdSense read.

Why: the app is one page of JavaScript, but crawlers (Google, AdSense review, WhatsApp/X link previews) read the HTML
*before* any JavaScript runs. There is no build step in this project, so this script writes the static files and they
are committed. Run it again whenever copy, the site address or the AdSense ID changes, then commit the result.

Writes:
  index.html (head block only) and <sport>.html   own <title>, description, canonical, Open Graph, AdSense tag
  index.html + <sport>.html                       also a plain-HTML intro / rules text inside <main id="app"> (replaced by the app when JS runs)
  privacy, about, contact (form), terms           the pages AdSense requires, linked from the footer
  rules/index.html + rules/<sport>.html           the sport rules as plain crawlable HTML (read from src/logic/sportRules.js)
  robots.txt, sitemap.xml, and ads.txt ONLY once ADSENSE_PUB_ID is a real ID

Usage:   python tools/make-pages.py            (site defaults to https://duelpoin.com)
The AdSense publisher ID comes from src/config.js (ADSENSE_PUB_ID), so there is one place to change it. While it is empty
no Google script is added and there is no ads.txt. The contact form posts to FEEDBACK_ENDPOINT from the same file.
No email address is ever written into a page.
"""
import argparse
import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
BRAND = "DuelPoin"
DEFAULT_SITE = "https://duelpoin.com"
UPDATED = "15 October 2026"

HOME = {
    "title": f"{BRAND} — Free Score Keeper for Badminton, Padel, Tennis & More",
    "description": "Stop arguing about the score. Free score keeper for badminton, padel, tennis, volleyball, table tennis, squash and basketball. Tap, tap, done. No sign-up.",
}

# slug -> (key used by the app, display name, one line about how scoring works)
SPORTS = {
    "badminton": ("badminton", "Badminton", "Tap to score to 21, win by 2 (max 30)."),
    "volleyball": ("volleyball", "Volleyball", "Tap to score to 25, win by 2."),
    "tennis": ("tennis", "Tennis", "Points, games and tiebreaks, with standard deuce or golden point."),
    "table-tennis": ("tableTennis", "Table Tennis", "Tap to score to 11, win by 2."),
    "padel": ("padel", "Padel", "Points, games and tiebreaks, with golden point or advantage."),
    "basketball": ("basketball", "Basketball", "Count points to any target you choose."),
    "squash": ("squash", "Squash", "Tap to score to 11 or 15, win by 2."),
}

e = lambda s: html.escape(str(s), quote=True)


def sport_copy(name, line):
    return {
        "title": f"{name} Score Keeper — Free, No Sign-up | {BRAND}",
        "description": f"Free {name.lower()} score keeper for your phone. {line} Undo mistakes, share the result. Works offline, no sign-up.",
    }


# ---------------------------------------------------------------- config.js
def config_value(name):
    cfg = (ROOT / "src" / "config.js").read_text(encoding="utf-8")
    m = re.search(name + r"\s*=\s*['\"]([^'\"]*)['\"]", cfg)
    return m.group(1) if m else ""


def pub_id():
    return config_value("ADSENSE_PUB_ID")


def real_pub(pid):
    return bool(re.fullmatch(r"ca-pub-\d{10,}", pid))


def adsense_tag(pid):
    if not real_pub(pid):
        return ""
    return f'<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={e(pid)}" crossorigin="anonymous"></script>'


# ---------------------------------------------------------------- the head block of the app pages
def seo_block(site, path, copy, pid):
    url = site + path
    image = site + "/og-image.jpg"
    lines = [
        "<!-- seo:start (written by tools/make-pages.py; do not edit by hand) -->",
        f"<title>{e(copy['title'])}</title>",
        f'<meta name="description" content="{e(copy["description"])}">',
        f'<link rel="canonical" href="{e(url)}">',
        '<meta property="og:type" content="website">',
        f'<meta property="og:site_name" content="{BRAND}">',
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
    ]
    tag = adsense_tag(pid)
    if tag:
        lines.append(tag)
    lines.append("<!-- seo:end -->")
    return "\n".join(lines)


BLOCK = re.compile(r"<!-- seo:start.*?<!-- seo:end -->", re.S)


# ---------------------------------------------------------------- shared page frame for the static pages
FOOTER = (
    '<footer class="site-foot"><a href="/rules">Rules</a> <span aria-hidden="true">·</span> '
    '<a href="/about">About</a> <span aria-hidden="true">·</span> <a href="/privacy">Privacy</a> <span aria-hidden="true">·</span> '
    '<a href="/terms">Terms</a> <span aria-hidden="true">·</span> <a href="/contact">Contact</a>'
    f'<div>© {BRAND}</div></footer>'
)


def page(site, path, title, description, body, pid, extra_head="", extra_body=""):
    url = site + path
    tag = adsense_tag(pid)
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#F4F7FB">
<title>{e(title)}</title>
<meta name="description" content="{e(description)}">
<link rel="canonical" href="{e(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{BRAND}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(description)}">
<meta property="og:url" content="{e(url)}">
<meta property="og:image" content="{e(site)}/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="/icon-192.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="stylesheet" href="/pages.css">
{extra_head}{tag}
<script>
  window.va = window.va || function () {{ (window.vaq = window.vaq || []).push(arguments); }};
</script>
<script defer src="/_vercel/insights/script.js"></script>
</head>
<body>
<header class="site-head"><a class="brand" href="/">Duel<b>Poin</b></a><a class="cta" href="/">Open the scoreboard</a></header>
<main class="doc">
{body}
</main>
{FOOTER}
{extra_body}</body>
</html>
"""


# ---------------------------------------------------------------- privacy / about / contact
def privacy_body():
    return f"""<h1>Privacy Policy</h1>
<p class="meta">Last updated {UPDATED}</p>
<p>{BRAND} (duelpoin.com) is a free score keeper for casual games. This page describes what the site actually does with data.</p>

<h2>Your matches stay on your device</h2>
<p>Match scores, team and player names, match settings and any photos you take with the camera button are saved <strong>only in your own browser</strong> (localStorage) on the device you use. We never receive them, and there are no accounts. You can delete them at any time by deleting the match in the app or by clearing this site's data in your browser settings.</p>

<h2>Messages you send us</h2>
<p>If you send a message through the contact form, or feedback from inside the app, what you type (and your email address, only if you enter one) is delivered to us by <strong>Formspree</strong>, a third-party form service. Formspree's handling of that data is described in its <a href="https://formspree.io/legal/privacy-policy/" rel="noopener">privacy policy</a>. We use messages only to answer you and to improve {BRAND}.</p>

<h2>Visit statistics</h2>
<p>We use Vercel Web Analytics to count visits to this site. It does not use cookies.</p>

<h2>Advertising (Google AdSense)</h2>
<p>{BRAND} may show ads from Google AdSense. Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to this website or other websites. Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to this site and/or other sites on the Internet.</p>
<ul>
<li>You can opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" rel="noopener">Google Ads Settings</a>.</li>
<li>You can opt out of some third-party vendors' use of cookies for personalized advertising by visiting <a href="https://www.aboutads.info" rel="noopener">www.aboutads.info</a>.</li>
<li>To learn more about how Google uses data when you use our site, see <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">policies.google.com/technologies/partner-sites</a>.</li>
</ul>

<h2>Privacy questions</h2>
<p>For any privacy question, please use the <a href="/contact">contact page</a>.</p>"""


def about_body():
    sports = ", ".join(n for _, n, _ in SPORTS.values())
    links = " ".join(f'<a href="/rules/{slug}">{e(n)}</a>' for slug, (_, n, _) in SPORTS.items())
    return f"""<h1>About {BRAND}</h1>
<p><strong>{BRAND} stops the arguments about the score.</strong> It is a free, fast score keeper for casual players: you and your friends on a badminton court, a padel court, around a table-tennis table or on a Sunday-morning tennis court.</p>

<h2>Who it is for</h2>
<p>Casual and club players who want a scoreboard they can trust without installing anything or creating an account. Open the site on one phone, tap a sport, and tap the side that wins each point. {BRAND} knows the scoring rules for {sports}.</p>

<h2>What it does</h2>
<ul>
<li><strong>Tap, tap, done.</strong> One tap from the sport list to a live scoreboard.</li>
<li><strong>No sign-up.</strong> Your matches stay on your own device.</li>
<li><strong>Works offline.</strong> After your first visit the scoreboard keeps working with no signal, and a refresh or a closed browser never loses your score.</li>
<li><strong>Undo any tap</strong>, rematch with a running series tally, and share the result as a picture.</li>
<li><strong>Tennis and padel house rules</strong>: choose games per set and standard deuce or golden point.</li>
<li>Tournaments and drop-in court sessions when you need more than a single match.</li>
</ul>

<h2>Learn the rules</h2>
<p>New to a sport? Read the short rules pages: {links}.</p>

<h2>Who makes it</h2>
<p>{BRAND} is made by the {BRAND} team and is free to use. It may be supported by advertising, shown only on menu, setup and result screens, never while you are scoring. See the <a href="/privacy">Privacy Policy</a> for details.</p>

<p>Questions or ideas? Use the <a href="/contact">Contact</a> page.</p>"""


def contact_body(endpoint):
    return f"""<h1>Contact {BRAND}</h1>
<p>We read every message. Write to us about:</p>
<ul>
<li><strong>Feedback</strong>: what you like and what could be better</li>
<li><strong>Bugs</strong>: something that did not work</li>
<li><strong>House-rule requests</strong>: a scoring rule or a sport you want to see</li>
</ul>
<form id="contact-form" class="contact-form" action="{e(endpoint)}" method="POST">
  <label for="c-topic">What is it about?</label>
  <select id="c-topic" name="topic">
    <option>Feedback</option><option>Bug</option><option>House-rule request</option><option>Something else</option>
  </select>
  <label for="c-message">Your message</label>
  <textarea id="c-message" name="message" rows="6" maxlength="2000" required minlength="3"></textarea>
  <label for="c-email">Your email (optional, only so we can reply)</label>
  <input id="c-email" name="email" type="email" autocomplete="email">
  <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true" class="hp">
  <input type="hidden" name="_subject" value="{BRAND} contact form">
  <button type="submit" class="button">Send message</button>
  <p id="contact-status" role="status" class="status"></p>
</form>
<p class="meta">Messages are delivered by Formspree. See the <a href="/privacy">Privacy Policy</a>.</p>"""


def terms_body():
    return f"""<h1>Terms of Use</h1>
<p class="meta">Last updated {UPDATED}</p>
<p>By using {BRAND} (duelpoin.com) you agree to these short terms.</p>

<h2>Free to use</h2>
<p>{BRAND} is free to use for personal, non-commercial scorekeeping. It may be supported by advertising. See the <a href="/privacy">Privacy Policy</a>.</p>

<h2>Provided as-is</h2>
<p>{BRAND} is provided "as is", without warranty of any kind. We do not guarantee that it is always available, free of errors, or suitable for any particular purpose.</p>

<h2>No guarantee of score accuracy</h2>
<p>The score you see is whatever you and your friends tap in. {BRAND} follows common casual-play scoring rules, but we do not guarantee that scores, results or the rules summaries are accurate or match your league's or club's rules. Do not rely on {BRAND} for official results, wagers or disputes that matter.</p>

<h2>Your data</h2>
<p>Your matches are saved only in your own browser and can be lost if you clear your browser data or change device. Keep a note of anything important.</p>

<h2>Limit of liability</h2>
<p>To the extent the law allows, we are not liable for any loss or damage arising from the use of {BRAND}.</p>

<h2>Changes</h2>
<p>We may change these terms or the app. Continued use means you accept the updated terms.</p>

<h2>Contact</h2>
<p>Questions? Use the <a href="/contact">contact page</a>.</p>"""


def rules_index_body():
    items = "\n".join(f'<li><a href="/rules/{slug}">{e(n)} rules</a>: {e(line)}</li>' for slug, (_, n, line) in SPORTS.items())
    return f"""<h1>Sport rules</h1>
<p class="lead">Short, plain-English rules for the sports {BRAND} keeps score for. Leagues and clubs vary, so check your local rules.</p>
<ul>
{items}
</ul>"""


# ---------------------------------------------------------------- plain-HTML content inside <main id="app"> of the app pages
PRERENDER = re.compile(r"<!-- prerender:start.*?<!-- prerender:end -->", re.S)


def prerender_home():
    items = "\n".join(
        f'<li><a href="/{slug}">{e(n)} scoreboard</a> · <a href="/rules/{slug}">{e(n)} rules</a>: {e(line)}</li>'
        for slug, (_, n, line) in SPORTS.items())
    return f"""<!-- prerender:start (plain HTML for search engines and slow connections; the app replaces it when it starts) -->
<div class="prerender">
<h1>{BRAND}: free score keeper for casual games</h1>
<p>Stop arguing about the score. {BRAND} is a free, no-sign-up scoreboard for badminton, padel, tennis, volleyball, table tennis, squash and basketball. Tap the side that wins each point, undo mistakes, share the result. It works offline and keeps your matches on your own device.</p>
<ul>
{items}
</ul>
<p>Loading the scoreboard…</p>
</div>
<!-- prerender:end -->"""


def prerender_sport(slug, key, name, info):
    sections = "\n".join(
        f"<h2>{e(sec['title'])}</h2>\n<ul>\n" + "\n".join(f"<li>{e(pt)}</li>" for pt in sec["points"]) + "\n</ul>"
        for sec in info["sections"])
    return f"""<!-- prerender:start (plain HTML for search engines and slow connections; the app replaces it when it starts) -->
<div class="prerender">
<h1>{e(name)} score keeper and rules</h1>
<p>Free {e(name.lower())} scoreboard for casual games: tap to score, undo mistakes, share the result. No sign-up, works offline.</p>
{sections}
<h2>Scoring {e(name.lower())} in {BRAND}</h2>
<p>{e(info['app'])}</p>
<p><a href="/rules/{slug}">Read the full {e(name.lower())} rules page</a></p>
<p>Loading the scoreboard…</p>
</div>
<!-- prerender:end -->"""


# ---------------------------------------------------------------- rules pages (data read from src/logic/sportRules.js)
def parse_js_value(src):
    """A tiny parser for the plain-data JavaScript object literals in sportRules.js (strings, arrays, objects, numbers)."""
    pos = 0
    n = len(src)

    def ws():
        nonlocal pos
        while pos < n:
            if src[pos].isspace():
                pos += 1
            elif src.startswith("//", pos):
                pos = src.find("\n", pos)
                pos = n if pos < 0 else pos
            elif src.startswith("/*", pos):
                pos = src.find("*/", pos) + 2
            else:
                break

    def string():
        nonlocal pos
        q = src[pos]
        pos += 1
        out = []
        while src[pos] != q:
            if src[pos] == "\\":
                pos += 1
                c = src[pos]
                out.append({"n": "\n", "t": "\t"}.get(c, c))
            else:
                out.append(src[pos])
            pos += 1
        pos += 1
        return "".join(out)

    def value():
        nonlocal pos
        ws()
        c = src[pos]
        if c in "'\"":
            return string()
        if c == "[":
            pos += 1
            arr = []
            while True:
                ws()
                if src[pos] == "]":
                    pos += 1
                    return arr
                arr.append(value())
                ws()
                if src[pos] == ",":
                    pos += 1
        if c == "{":
            pos += 1
            obj = {}
            while True:
                ws()
                if src[pos] == "}":
                    pos += 1
                    return obj
                if src[pos] in "'\"":
                    key = string()
                else:
                    m = re.compile(r"[A-Za-z_$][\w$]*").match(src, pos)
                    key = m.group(0)
                    pos = m.end()
                ws()
                assert src[pos] == ":", f"expected ':' after {key}"
                pos += 1
                obj[key] = value()
                ws()
                if src[pos] == ",":
                    pos += 1
        m = re.compile(r"-?\d+(\.\d+)?|true|false|null").match(src, pos)
        if not m:
            raise ValueError("unsupported value near: " + src[pos:pos + 40])
        pos = m.end()
        return json.loads(m.group(0))

    return value()


def load_sport_info():
    text = (ROOT / "src" / "logic" / "sportRules.js").read_text(encoding="utf-8")
    start = text.index("export const sportInfo =") + len("export const sportInfo =")
    return parse_js_value(text[start:])


def rules_body(slug, key, info):
    name = info["name"]
    sections = "\n".join(
        f"<h2>{e(s['title'])}</h2>\n<ul>\n" + "\n".join(f"<li>{e(p)}</li>" for p in s["points"]) + "\n</ul>"
        for s in info["sections"]
    )
    others = " ".join(f'<a href="/rules/{o}">{e(n2)}</a>' for o, (_, n2, _) in SPORTS.items() if o != slug)
    return f"""<h1>{e(name)} rules: how to score and play</h1>
<p class="lead">A short, casual-play summary of {e(name.lower())} scoring and rules. Leagues and clubs vary, so check your local rules.</p>
{sections}
<h2>Scoring {e(name.lower())} in {BRAND}</h2>
<p>{e(info['app'])}</p>
<p><a class="button" href="/{slug}">Start scoring {e(name.lower())}</a></p>
<h2>Other sports</h2>
<p>{others}</p>"""


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--site", default=DEFAULT_SITE, help="public address of the site, no trailing slash")
    site = ap.parse_args().site.rstrip("/")
    pid = pub_id()
    write = lambda rel, text: (ROOT / rel).parent.mkdir(parents=True, exist_ok=True) or (ROOT / rel).write_text(text, encoding="utf-8", newline="\n")

    # app pages: home + one per sport (same app, own head)
    index_path = ROOT / "index.html"
    index = index_path.read_text(encoding="utf-8")
    if not BLOCK.search(index):
        raise SystemExit("index.html has no <!-- seo:start --> ... <!-- seo:end --> block")
    if not PRERENDER.search(index):
        raise SystemExit("index.html has no <!-- prerender:start --> ... <!-- prerender:end --> block inside <main id=\"app\">")
    info = load_sport_info()
    home = BLOCK.sub(lambda m: seo_block(site, "/", HOME, pid), index)
    write("index.html", PRERENDER.sub(lambda m: prerender_home(), home))
    index = index_path.read_text(encoding="utf-8")
    for slug, (key, name, line) in SPORTS.items():
        sp = BLOCK.sub(lambda m: seo_block(site, "/" + slug, sport_copy(name, line), pid), index)
        write(f"{slug}.html", PRERENDER.sub(lambda m: prerender_sport(slug, key, name, info[key]), sp))

    # required pages
    endpoint = config_value("FEEDBACK_ENDPOINT")
    write("privacy.html", page(site, "/privacy", f"Privacy Policy | {BRAND}", f"How {BRAND} handles your data: matches stay in your browser, messages go through Formspree, visits are counted without cookies, and Google AdSense advertising cookies.", privacy_body(), pid))
    write("about.html", page(site, "/about", f"About {BRAND} — Free Score Keeper for Casual Sport", f"{BRAND} is a free, no-sign-up score keeper for casual badminton, padel, tennis, volleyball, table tennis, squash and basketball players.", about_body(), pid))
    write("contact.html", page(site, "/contact", f"Contact {BRAND}", f"Contact the {BRAND} team: send feedback, report a bug or ask for a house-rule or a sport.", contact_body(endpoint), pid,
                               extra_body='<script type="module" src="/src/contactPage.js"></script>\n'))
    write("terms.html", page(site, "/terms", f"Terms of Use | {BRAND}", f"Terms of use for {BRAND}: free to use, provided as-is, and no guarantee of score accuracy.", terms_body(), pid))

    # rules pages
    write("rules/index.html", page(site, "/rules", f"Sport Rules: Badminton, Padel, Tennis and More | {BRAND}", f"Plain-English rules for badminton, volleyball, tennis, table tennis, padel, basketball and squash, with links to a free scoreboard for each.", rules_index_body(), pid))
    for slug, (key, name, _) in SPORTS.items():
        write(f"rules/{slug}.html", page(site, f"/rules/{slug}", f"{name} Rules: How to Score and Play | {BRAND}",
                                         f"{name} rules in plain English: how scoring works, serving, in and out, and how to keep score with {BRAND}.",
                                         rules_body(slug, key, info[key]), pid))

    # crawler files
    ads = ROOT / "ads.txt"
    if real_pub(pid):
        write("ads.txt", f"google.com, {pid.replace('ca-', '')}, DIRECT, f08c47fec0942fa0\n")
    elif ads.exists():
        ads.unlink()                                  # no publisher ID yet: no ads.txt
    write("robots.txt", f"User-agent: *\nAllow: /\n\nSitemap: {site}/sitemap.xml\n")
    urls = ["/"] + [f"/{s}" for s in SPORTS] + [f"/rules/{s}" for s in SPORTS] + ["/rules", "/about", "/privacy", "/terms", "/contact"]
    write("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
          + "".join(f"  <url><loc>{e(site + u)}</loc></url>\n" for u in urls) + "</urlset>\n")

    print("site:", site, "| adsense:", pid if real_pub(pid) else "no publisher ID (no Google script, no ads.txt)")


if __name__ == "__main__":
    main()
