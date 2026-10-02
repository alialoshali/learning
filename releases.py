"""Version history of the site (newest first).

How to publish a new release:
  1. Add an entry at the TOP of RELEASES with the next version number and today's date.
  2. List the pages (slugs) it changed, so their "Updated" badge moves forward.
  3. Commit and push; the GitHub Pages workflow rebuilds the site.

Versions follow semantic versioning, MAJOR.MINOR.PATCH:
  MAJOR = the course is restructured (pages moved or removed),
  MINOR = new lessons or new sections,
  PATCH = corrections and small fixes.
"""
import os
from datetime import date

RELEASES = [
    {
        "version": "1.5.0", "date": "2026-10-02",
        "title": "Embeddings explained + versioning",
        "changes": [
            "Transformers, step 2: why embeddings exist (ids and one-hot vectors carry no meaning).",
            "Interactive similarity matrix: one-hot vs. learned embeddings.",
            "Interactive embedding map with nearest neighbours and cosine similarity.",
            "Word arithmetic explorer: gender, royalty, country→capital, past tense, plural and comparative relations.",
            "Site version, release date and per-page “updated” badges; this Releases page.",
        ],
        "pages": ["transformers", "releases"],
    },
    {
        "version": "1.4.0", "date": "2026-10-02",
        "title": "Neural networks: XOR, the race and depth made clear",
        "changes": [
            "How a hidden layer solves XOR: a 2-2-1 network worked by hand, with input and hidden space plots.",
            "A trained 4-neuron ANN next to logistic regression, showing what each hidden neuron learned.",
            "The race: architecture diagrams, a parameter table and measured conclusions.",
            "Depth vs. width: the folding idea, step by step, with the output after each layer.",
            "Every formula now explains every symbol.",
        ],
        "pages": ["neural-networks"],
    },
    {
        "version": "1.3.0", "date": "2026-10-02",
        "title": "Transformers rebuilt: 16 steps by hand",
        "changes": [
            "A live flowchart that follows you while you scroll.",
            "16 hand-computed steps for “I love → you”, from tokens to the next word.",
            "Training step (loss, gradient, update) and an LLM parameter calculator (GPT-2, GPT-3, Llama 2).",
        ],
        "pages": ["transformers"],
    },
    {
        "version": "1.2.0", "date": "2026-10-02",
        "title": "New homepage and richer explanations",
        "changes": [
            "Interactive homepage introducing AI, ML and deep learning.",
            "“How to read this graph” guides and key-term glossaries on linear regression, logistic regression and Transformers.",
            "Neural networks: NN vs. deep NN, live race and playground.",
        ],
        "pages": ["home", "linear-regression", "logistic-regression", "transformers", "neural-networks"],
    },
    {
        "version": "1.1.0", "date": "2026-10-01",
        "title": "The site goes online",
        "changes": [
            "Static build (freeze.py) and automatic deployment to GitHub Pages.",
        ],
        "pages": [],
    },
    {
        "version": "1.0.0", "date": "2026-10-01",
        "title": "First release",
        "changes": [
            "Interactive lessons: supervised, unsupervised, self-supervised and reinforcement learning, "
            "clustering, PCA, neural networks, CNNs, RNNs and Transformers.",
        ],
        "pages": ["machine-learning", "supervised-learning", "linear-regression", "logistic-regression",
                  "unsupervised-learning", "clustering", "pca", "self-supervised-learning",
                  "reinforcement-learning", "neural-networks", "cnn", "rnn", "transformers", "home"],
    },
]

CURRENT = RELEASES[0]


def nice_date(iso):
    d = date.fromisoformat(iso)
    return f"{d.day} {d.strftime('%b %Y')}"


def page_release(slug):
    """The newest release that changed this page (or None)."""
    for r in RELEASES:
        if slug in r["pages"]:
            return r
    return None


def build_info():
    sha = os.environ.get("GITHUB_SHA", "")[:7]
    return {"sha": sha, "built": date.today().isoformat()}
