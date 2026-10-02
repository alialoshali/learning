"""Render the Flask site to static HTML for GitHub Pages.

Usage:  BASE_PATH=/learning python freeze.py      (output in ./build)
BASE_PATH is the URL prefix the site is served under (e.g. /<repo-name> on
https://<user>.github.io/<repo-name>/). Leave it empty for a root domain.
"""
import os
import re
import shutil

from app import app
from navigation import NAV

BASE = os.environ.get("BASE_PATH", "").rstrip("/")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "build")


def slugs(node):
    yield node["slug"]
    for child in node.get("children", []):
        yield from slugs(child)


def prefix(html):
    # Root-relative links ("/clustering", "/static/...") get the base path.
    # Protocol-relative URLs ("//host") are left alone.
    return re.sub(r'(href|src)="/(?!/)', lambda m: f'{m.group(1)}="{BASE}/', html)


def write(path, html):
    full = os.path.join(OUT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(prefix(html))


def main():
    shutil.rmtree(OUT, ignore_errors=True)
    client = app.test_client()
    for slug in slugs(NAV):
        url = "/" if slug == "home" else f"/{slug}"
        r = client.get(url)
        if r.status_code != 200:
            raise SystemExit(f"{url} returned {r.status_code}")
        write("index.html" if slug == "home" else f"{slug}/index.html", r.get_data(as_text=True))
        print("rendered", url)
    write("releases/index.html", client.get("/releases").get_data(as_text=True))
    print("rendered /releases")
    write("404.html", client.get("/__missing__").get_data(as_text=True))
    shutil.copytree(os.path.join(app.root_path, "static"), os.path.join(OUT, "static"))
    open(os.path.join(OUT, ".nojekyll"), "w").close()
    print(f"done -> {OUT} (base path '{BASE or '/'}')")


if __name__ == "__main__":
    main()
