# EPI learning – AI/ML teaching site (Flask)

## Run
    python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
    pip install -r requirements.txt
    python app.py            # http://127.0.0.1:5000

## Structure
- `navigation.py` – the index tree (right toolbar). Add/rename topics here.
- `templates/base.html` – page template: top bar, lesson header, right index.
- `templates/pages/<slug>.html` – one file per lesson; missing files show a placeholder.
- `static/style.css`, `static/app.js` – styles, font-size control, tree toggling.
- `static/logo.svg` – replace with your logo (keep the filename or edit base.html).

## Move the index to the left
In `static/style.css` change `.wrap` to `grid-template-columns: var(--index-w) minmax(0,1fr)`
and add `.index { order: -1; }`.

## Interactive lessons (lesson kit)
The lessons for Machine learning, Supervised, Unsupervised, Self-supervised, Reinforcement learning,
Clustering, PCA, Neural networks, CNN and RNN share a small kit:
- `templates/_lesson_head.html` / `_lesson_scripts.html` – include these in `{% block head %}` and at the end of `{% block content %}`.
- `static/lesson.css` – two-column layout (text left, sticky live figure right), callouts (`.callout.tf` = orange "Transformer link"), tables, controls.
- `static/lesson.js` – `window.L` helpers: `L.plot()` canvas plots, `L.bind()` sliders, `L.seg()` button groups, `L.pointer()` mouse/touch, `L.runner()` play/pause, `L.tex()` maths.
- `static/vendor/katex/` – KaTeX bundled locally, so formulas render offline. Write maths as `\( … \)` inline or `$$ … $$` display.
- Wrap page HTML/JS in `{% raw %} … {% endraw %}` so Jinja ignores `{#`, `{{` in CSS/JS/LaTeX.

## Publish online (GitHub Pages)
GitHub Pages serves static files only, so `freeze.py` renders every page of the Flask app to plain HTML in `build/`.
The workflow `.github/workflows/pages.yml` does this automatically on every push to `main` and deploys it.

One-time setup: repository **Settings → Pages → Build and deployment → Source: GitHub Actions**.
The site is then at `https://<user>.github.io/<repo>/`.

Local preview of the static build: `BASE_PATH=/learning python freeze.py`, then serve the folder that contains `build/` renamed to `learning/`.

## Versions and releases

The site version, release date and the change history live in `releases.py`.
To publish a release, add an entry at the top of `RELEASES` (version, date, title, changes, changed page slugs), then push.
The version is shown in the top bar and the sidebar, every lesson shows an "Updated" badge with the release that last changed it,
and the full history is on the `/releases` page.
