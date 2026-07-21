# Juan P. Aparicio website

Static professional website for `posadaaparicio.com`.

## Structure

- `index.html` - homepage.
- `research.html` - full research list with filterable paper cards.
- `teaching.html` - teaching, evaluations, supervision, and service.
- `cv.html` - web-readable economics job market CV summary and PDF link.
- `contact.html` - public contact options.
- `data/research.js` - source of truth for research cards.
- `data/econ-market-cv.json` - source for the economics job market CV.
- `tools/build_econ_market_cv.py` - regenerates the job market CV in `assets/docs/`.
- `tools/check_site.py` - validates internal references, page structure, metadata, and JSON-LD.

## Local preview

Run from this folder:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## GitHub Pages

This site is ready to publish from the repository root with GitHub Pages. The
`CNAME` file points Pages to `www.posadaaparicio.com`; DNS still needs to be
configured in the domain account before the custom domain resolves.

## Updating content

Edit `data/research.js` for paper titles, statuses, links, and visual-card metadata. Edit `data/econ-market-cv.json` for the job market CV and regenerate the website files:

```bash
/Users/pablo/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 tools/build_econ_market_cv.py
/Users/pablo/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 tools/build_public_cv.py
node tools/build_research_pages.mjs
/Users/pablo/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 tools/check_site.py
```

`Juan_P_Aparicio_public_CV.pdf` and `.txt` are compatibility aliases for old links. The public-CV builder now copies the current economics job-market CV to those paths; do not maintain a second CV source.

## Before publishing

- Confirm current affiliation wording.
- Review paper statuses and add missing paper links.
- Confirm that the generated research pages and compatibility CV aliases are current.
- Keep application-specific files inside ignored paths; this repository and its GitHub Pages output are public.
