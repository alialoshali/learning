import os
from flask import Flask, render_template, abort
from navigation import NAV, find, url_for_slug
from releases import RELEASES, CURRENT, nice_date, page_release, build_info

app = Flask(__name__)
app.config["SITE_TITLE"] = "EPI learning"


@app.context_processor
def inject_nav():
    return {"nav": NAV, "site_title": app.config["SITE_TITLE"], "url_for_slug": url_for_slug,
            "release": CURRENT, "nice_date": nice_date, "page_release": page_release}


def show(slug):
    node, trail = find(slug)
    if not node:
        abort(404)
    page = os.path.join(app.root_path, "templates", "pages", f"{slug}.html")
    template = f"pages/{slug}.html" if os.path.exists(page) else "coming_soon.html"
    open_slugs = {n["slug"] for n in trail} | {slug}   # keep the path to this page expanded
    return render_template(template, node=node, trail=trail, active=slug, open_slugs=open_slugs)


@app.route("/")
def home():
    return show("home")


@app.route("/<slug>")
def page(slug):
    return show(slug)


@app.route("/releases")
def releases():
    node = {"title": "Releases", "slug": "releases"}
    return render_template("releases.html", node=node, trail=(), active="releases", open_slugs={"home"},
                           releases=RELEASES, build=build_info())


@app.errorhandler(404)
def not_found(_):
    return render_template("coming_soon.html", node={"title": "Page not found", "slug": ""},
                           trail=(), active="", open_slugs={"home"}, missing=True), 404


if __name__ == "__main__":
    app.run(debug=True, port=5000)
