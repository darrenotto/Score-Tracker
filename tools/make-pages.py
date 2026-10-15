#!/usr/bin/env python3
"""Generates every static page and file that search engines, link previews and Google AdSense read.

Why: the app is one page of JavaScript, but crawlers (Google, AdSense review, WhatsApp/X link previews) read the HTML
*before* any JavaScript runs. There is no build step in this project, so this script writes the static files and they
are committed. Run it again whenever copy, the site address or the AdSense ID changes, then commit the result.

Writes:
  index.html (head block only) and <sport>.html   own <title>, description, canonical, Open Graph, AdSense tag
  privacy.html, about.html, contact.html          the pages AdSense requires, linked from the footer on every screen
  rules/<sport>.html                              the sport rules as plain crawlable HTML (read from src/logic/sportRules.js)
  ads.txt, robots.txt, sitemap.xml

Usage:   python tools/make-pages.py            (site defaults to https://duelpoin.com)
The AdSense publisher ID comes from src/config.js (ADSENSE_PUB_ID), so there is one place to change it. While it is the
placeholder no Google script is added and ads.txt keeps the placeholder line.
"""
import argparse
import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
BRAND = "DuelPoin"
DEFAULT_SITE = "https://duelpoin.com"
CONTACT_EMAIL = "duelpoin@gmail.com"      # shown on the Contact page (a mailto link); change it here and run this script again
UPDATED = "14 October 2026"
PLACEHOLDER_PUB = "ca-pub-XXXXXXXXXXXXXXXX"

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
def pub_id():
    cfg = (ROOT / "src" / "config.js").read_text(encoding="utf-8")
    m = re.search(r"ADSENSE_PUB_ID\s*=\s*['\"]([^'\"]+)['\"]", cfg)
    return m.group(1) if m else PLACEHOLDER_PUB


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
    '<footer class="site-foot"><a href="/privacy">Privacy</a> <span aria-hidden="true">·</span> '
    '<a href="/about">About</a> <span aria-hidden="true">·</span> <a href="/contact">Contact</a>'
    f'<div>© {BRAND}</div></footer>'
)


def page(site, path, title, description, body, pid, extra_head=""):
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
</body>
</html>
"""


# ---------------------------------------------------------------- privacy / about / contact
def privacy_body():
    return f"""<h1>Privacy Policy</h1>
<p class="meta">Last updated {UPDATED}</p>
<p>{BRAND} (duelpoin.com) is a free score keeper for casual sport. This page explains, in plain words, what the app stores, what it sends, and how advertising works.</p>

<h2>What stays on your device</h2>
<p>Your scores, team and player names, match settings and any photos you take are saved <strong>only in your own browser</strong> (localStorage) on the device you use. They are not uploaded to our servers, and there are no accounts. Photos are taken with your camera only when you press the camera button. You can remove everything at any time by deleting the match in the app or by clearing this site's data in your browser settings.</p>

<h2>Optional Google sign-in</h2>
<p>Signing in with Google is optional. If you do, Google tells the app your first name and profile picture address, which are kept only in your browser to say "Hi, name". We do not receive your email address. You can also use {BRAND} as a guest.</p>

<h2>Sharing a result</h2>
<p>When you press Share, the result image is created on your device and handed to your phone's share sheet (or downloaded). Nothing is sent to us. The link that goes with a share contains <code>?src=share</code> so we can count how many visitors arrive through shared results.</p>

<h2>Feedback you send</h2>
<p>If you send feedback from inside the app, your rating, chosen topics, comment and (only if you type one) email address are sent to our form provider, <a href="https://formspree.io/legal/privacy-policy/" rel="noopener">Formspree</a>, which emails them to us. We also include the sport you were on, your browser's user-agent text and the link or channel you arrived from. If you are offline, the message waits on your device and is sent when you are back online. We use feedback only to improve {BRAND}, and we only show a comment on the website if you ticked the box that allows it.</p>

<h2>Analytics</h2>
<p>We use Vercel Web Analytics to count visits to this site (which pages are viewed, in aggregate). It does not use cookies.</p>
<p>{BRAND} may use Google Analytics to count anonymous events such as "a match was started or finished", the sport, and which link or QR code brought you to the site. It never receives your team names, scores or photos. Google Analytics sets cookies or similar identifiers. You can opt out with <a href="https://tools.google.com/dlpage/gaoptout" rel="noopener">Google's opt-out browser add-on</a>.</p>

<h2>Advertising (Google AdSense)</h2>
<p>{BRAND} is free and may show advertising provided by <strong>Google AdSense</strong>. Google and its advertising partners use cookies and similar technologies to serve ads, to measure them, and, where the law allows and you have not opted out, to personalise them based on your visits to this and other websites. Ads appear only on menu, setup and result screens. They never appear on the live scoring screen.</p>
<ul>
<li>How Google uses data from sites that use its services: <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">policies.google.com/technologies/partner-sites</a></li>
<li>Google's advertising technologies: <a href="https://policies.google.com/technologies/ads" rel="noopener">policies.google.com/technologies/ads</a></li>
<li>Manage or turn off personalised ads: <a href="https://adssettings.google.com" rel="noopener">Google Ads Settings</a>, or <a href="https://www.aboutads.info" rel="noopener">aboutads.info</a></li>
</ul>

<h2>Children</h2>
<p>{BRAND} is not directed at children under 13, and we do not knowingly collect personal information from them.</p>

<h2>Changes to this page</h2>
<p>If we change how {BRAND} handles data, we will update this page and its date.</p>

<h2>Contact</h2>
<p>Questions about privacy? See the <a href="/contact">Contact</a> page.</p>"""


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


def contact_body():
    mail = e(CONTACT_EMAIL)
    mail_html = f'<a href="mailto:{mail}">{mail}</a>' if "@" in CONTACT_EMAIL and "[" not in CONTACT_EMAIL else mail
    return f"""<h1>Contact {BRAND}</h1>
<p>We read every message.</p>
<h2>Email</h2>
<p>{mail_html}</p>
<h2>Quickest way: feedback in the app</h2>
<p>Open <a href="/">{BRAND}</a> and tap <strong>"Tell me what you think"</strong> at the bottom of the home screen. Ideas, bugs or a sport you want: it takes about ten seconds.</p>
<h2>Privacy questions</h2>
<p>See our <a href="/privacy">Privacy Policy</a>.</p>"""


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
    write("index.html", BLOCK.sub(lambda m: seo_block(site, "/", HOME, pid), index))
    index = index_path.read_text(encoding="utf-8")
    for slug, (_, name, line) in SPORTS.items():
        write(f"{slug}.html", BLOCK.sub(lambda m: seo_block(site, "/" + slug, sport_copy(name, line), pid), index))

    # required pages
    write("privacy.html", page(site, "/privacy", f"Privacy Policy | {BRAND}", f"How {BRAND} handles your data: what stays on your device, feedback, analytics and Google AdSense advertising cookies.", privacy_body(), pid))
    write("about.html", page(site, "/about", f"About {BRAND} — Free Score Keeper for Casual Sport", f"{BRAND} is a free, no-sign-up score keeper for casual badminton, padel, tennis, volleyball, table tennis, squash and basketball players.", about_body(), pid))
    write("contact.html", page(site, "/contact", f"Contact {BRAND}", f"How to reach the {BRAND} team: email, or send feedback from inside the app.", contact_body(), pid))

    # rules pages
    info = load_sport_info()
    for slug, (key, name, _) in SPORTS.items():
        write(f"rules/{slug}.html", page(site, f"/rules/{slug}", f"{name} Rules: How to Score and Play | {BRAND}",
                                         f"{name} rules in plain English: how scoring works, serving, in and out, and how to keep score with {BRAND}.",
                                         rules_body(slug, key, info[key]), pid))

    # crawler files
    write("ads.txt", f"google.com, {pid.replace('ca-', '')}, DIRECT, f08c47fec0942fa0\n")
    write("robots.txt", f"User-agent: *\nAllow: /\n\nSitemap: {site}/sitemap.xml\n")
    urls = ["/"] + [f"/{s}" for s in SPORTS] + [f"/rules/{s}" for s in SPORTS] + ["/about", "/privacy", "/contact"]
    write("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
          + "".join(f"  <url><loc>{e(site + u)}</loc></url>\n" for u in urls) + "</urlset>\n")

    print("site:", site, "| adsense:", pid if real_pub(pid) else "placeholder (no Google script added)")


if __name__ == "__main__":
    main()
