# Juan P. Aparicio website

Static professional website for `posadaaparicio.com`.

## Structure

- `index.html` - homepage.
- `research.html` - full research list with filterable paper cards.
- `teaching.html` - teaching, evaluations, supervision, and service.
- `cv.html` - web-readable CV summary and public CV PDF link.
- `contact.html` - public contact options.
- `data/research.js` - source of truth for research cards.
- `data/public-cv.md` - source for the public PDF CV.
- `tools/build_public_cv.py` - regenerates `assets/docs/Juan_P_Aparicio_public_CV.pdf`.

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

Edit `data/research.js` for paper titles, statuses, links, and visual-card metadata. Edit `data/public-cv.md` for the public CV and regenerate the PDF:

```bash
/Users/pablo/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 tools/build_public_cv.py
```

## Before publishing

- Confirm current affiliation wording.
- Review paper statuses and add missing paper links.
- Add a confirmed LinkedIn URL if desired.
- Point `posadaaparicio.com` to the chosen host after the static version is approved.
