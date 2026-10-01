"""Single source of truth for the site index (right-hand toolbar).

Each node: slug (URL + template name), title, optional children.
To add a page: add a node here, then create templates/pages/<slug>.html
(pages without a template show a "coming soon" placeholder).
"""

"""Single source of truth for the site index (right-hand toolbar).

Each node: slug (URL + template name), title, optional children.
To add a page: add a node here, then create templates/pages/<slug>.html
(pages without a template show a "coming soon" placeholder).
"""

NAV = {
    "slug": "home", "title": "Home", "children": [
        {"slug": "machine-learning", "title": "Machine learning", "children": [
            # --- Learning paradigms (classified by type of feedback) ---
            {"slug": "supervised-learning", "title": "Supervised learning", "children": [
                {"slug": "linear-regression", "title": "Linear regression"},
                {"slug": "logistic-regression", "title": "Logistic regression"},
            ]},
            {"slug": "unsupervised-learning", "title": "Unsupervised learning", "children": [
                {"slug": "clustering", "title": "Clustering"},
                {"slug": "pca", "title": "PCA"},
            ]},
            {"slug": "self-supervised-learning", "title": "Self-supervised learning"},
            {"slug": "reinforcement-learning", "title": "Reinforcement learning"},
            # --- Model families (classified by architecture) ---
            {"slug": "neural-networks", "title": "Neural networks and Deep learning", "children": [

                    {"slug": "cnn", "title": "Convolutional networks (CNNs)"},
                    {"slug": "rnn", "title": "Recurrent networks (RNNs)"},
                    {"slug": "transformers", "title": "Transformers"},

            ]},
        ]},
    ],
}


def find(slug, node=NAV, trail=()):
    """Return (node, trail_of_ancestors) for slug, or (None, ())."""
    if node["slug"] == slug:
        return node, trail
    for child in node.get("children", []):
        hit = find(slug, child, trail + (node,))
        if hit[0]:
            return hit
    return None, ()


def url_for_slug(slug):
    return "/" if slug == "home" else "/" + slug
