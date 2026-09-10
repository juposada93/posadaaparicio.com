"""Dependency-free quality gate for the static academic website."""

from __future__ import annotations

from collections import Counter
from html.parser import HTMLParser
import json
from pathlib import Path
from urllib.parse import unquote, urlparse


ROOT = Path(__file__).resolve().parents[1]


def normalized_text(value: str) -> str:
    return " ".join(
        value.replace("\u2018", "'")
        .replace("\u2019", "'")
        .replace("\u201c", "'")
        .replace("\u201d", "'")
        .replace('"', "'")
        .replace("(", " ")
        .replace(")", " ")
        .replace(":", " ")
        .split()
    )


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.refs: list[str] = []
        self.ids: list[str] = []
        self.title_count = 0
        self.h1_count = 0
        self.main_count = 0
        self.has_description = False
        self.has_canonical = False
        self._json_ld = False
        self._json_chunks: list[str] = []
        self.json_ld: list[str] = []
        self.text_chunks: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if values.get("id"):
            self.ids.append(values["id"] or "")
        if tag in {"a", "link"} and values.get("href"):
            self.refs.append(values["href"] or "")
        if tag in {"img", "script", "iframe"} and values.get("src"):
            self.refs.append(values["src"] or "")
        if tag == "title":
            self.title_count += 1
        elif tag == "h1":
            self.h1_count += 1
        elif tag == "main":
            self.main_count += 1
        elif tag == "meta" and values.get("name") == "description":
            self.has_description = True
        elif tag == "link" and values.get("rel") == "canonical":
            self.has_canonical = True
        elif tag == "script" and values.get("type") == "application/ld+json":
            self._json_ld = True
            self._json_chunks = []

    def handle_data(self, data: str) -> None:
        self.text_chunks.append(data)
        if self._json_ld:
            self._json_chunks.append(data)

    @property
    def visible_text(self) -> str:
        return " ".join(" ".join(self.text_chunks).split())

    def handle_endtag(self, tag: str) -> None:
        if tag == "script" and self._json_ld:
            self.json_ld.append("".join(self._json_chunks))
            self._json_ld = False


def local_target(page: Path, ref: str) -> tuple[Path, str] | None:
    if ref.startswith(("http://", "https://", "mailto:", "tel:", "data:", "javascript:")):
        return None
    parsed = urlparse(ref)
    if not parsed.path:
        return page, parsed.fragment
    path = unquote(parsed.path)
    target = ROOT / path.lstrip("/") if path.startswith("/") else page.parent / path
    if path.endswith("/"):
        target /= "index.html"
    return target.resolve(), parsed.fragment


def main() -> None:
    pages = sorted(ROOT.glob("*.html")) + sorted((ROOT / "papers").glob("*.html"))
    parsed: dict[Path, PageParser] = {}
    errors: list[str] = []

    for page in pages:
        parser = PageParser()
        parser.feed(page.read_text(encoding="utf-8"))
        parsed[page.resolve()] = parser
        duplicate_ids = [item for item, count in Counter(parser.ids).items() if count > 1]
        if duplicate_ids:
            errors.append(f"{page.relative_to(ROOT)}: duplicate ids {duplicate_ids}")
        if parser.title_count != 1 or parser.h1_count != 1 or parser.main_count != 1:
            errors.append(
                f"{page.relative_to(ROOT)}: expected one title, h1, and main; "
                f"found {parser.title_count}, {parser.h1_count}, {parser.main_count}"
            )
        if page.name != "404.html" and (not parser.has_description or not parser.has_canonical):
            errors.append(f"{page.relative_to(ROOT)}: missing description or canonical link")
        for block in parser.json_ld:
            try:
                json.loads(block)
            except json.JSONDecodeError as exc:
                errors.append(f"{page.relative_to(ROOT)}: invalid JSON-LD: {exc}")

    for page, parser in parsed.items():
        for ref in parser.refs:
            target_and_fragment = local_target(page, ref)
            if target_and_fragment is None:
                continue
            target, fragment = target_and_fragment
            if not target.exists():
                errors.append(f"{page.relative_to(ROOT)}: missing local target {ref}")
                continue
            if fragment and target.suffix == ".html":
                target_parser = parsed.get(target)
                if target_parser and fragment not in target_parser.ids:
                    errors.append(f"{page.relative_to(ROOT)}: missing fragment target {ref}")

    canonical_cv = ROOT / "assets/docs/Juan_Aparicio_Economics_Job_Market_CV.pdf"
    legacy_cv = ROOT / "assets/docs/Juan_P_Aparicio_public_CV.pdf"
    canonical_text = ROOT / "assets/docs/Juan_Aparicio_Economics_Job_Market_CV.txt"
    legacy_text = ROOT / "assets/docs/Juan_P_Aparicio_public_CV.txt"
    if canonical_cv.read_bytes() != legacy_cv.read_bytes():
        errors.append("legacy PDF CV alias differs from the canonical job-market CV")
    if canonical_text.read_text(encoding="utf-8") != legacy_text.read_text(encoding="utf-8"):
        errors.append("legacy text CV alias differs from the canonical job-market CV")

    required_phrases = {
        ROOT / "index.html": "Job Market Paper",
        ROOT / "research.html": "Job Market Paper",
        ROOT / "cv.html": "Job Market Paper",
        ROOT / "papers/demobilizing-rebels.html": "Job Market Paper",
    }
    for page, phrase in required_phrases.items():
        if phrase not in page.read_text(encoding="utf-8"):
            errors.append(f"{page.relative_to(ROOT)}: missing required label {phrase!r}")

    cv_data = json.loads((ROOT / "data/econ-market-cv.json").read_text(encoding="utf-8"))
    cv_html = ROOT / "cv.html"
    cv_text = parsed[cv_html.resolve()].visible_text
    if cv_data["updated"] not in cv_text:
        errors.append("cv.html: freshness label differs from canonical CV data")
    normalized_cv_text = normalized_text(cv_text)
    cv_research_titles = [
        cv_data["job_market_paper"]["title"],
        *(item["title"] for item in cv_data["publications"]),
        *(item["title"] for item in cv_data["working_papers"]),
        *(item["title"] for item in cv_data.get("other_research", [])),
        *(item.split(" (with ", 1)[0] for item in cv_data["work_in_progress"]),
    ]
    for title in cv_research_titles:
        if normalized_text(title) not in normalized_cv_text:
            errors.append(f"cv.html: canonical research title missing or renamed: {title!r}")
    for language in cv_data["technical"]["languages"].split("; "):
        if normalized_text(language) not in normalized_cv_text:
            errors.append(f"cv.html: canonical language proficiency missing or renamed: {language!r}")

    plain_text = canonical_text.read_text(encoding="utf-8")
    for paper in cv_data["working_papers"]:
        summary = paper.get("summary")
        if not paper.get("show_summary_on_cv", True) and summary and summary in plain_text:
            errors.append(f"plain-text CV includes a suppressed summary: {paper['title']!r}")

    client_script = (ROOT / "assets/scripts/site.js").read_text(encoding="utf-8")
    if "compact ? item.shortTitle : item.title" in client_script:
        errors.append("site.js: fallback research renderer still abbreviates featured titles")
    if 'item.category === "working"' not in client_script:
        errors.append("site.js: fallback research renderer does not suppress working-paper dates")

    generated_sources = [ROOT / "index.html", ROOT / "research.html", *sorted((ROOT / "papers").glob("*.html"))]
    for page in generated_sources:
        source = page.read_text(encoding="utf-8")
        if '<p class="paper-venue">Working paper</p>' in source:
            errors.append(f"{page.relative_to(ROOT)}: duplicates generic working-paper venue and status")
        if 'data-research-category="working"' in source:
            forbidden_date_markup = {
                'name="citation_publication_date"': "citation metadata",
                '"datePublished"': "structured data",
                "  year = {": "BibTeX",
            }
            for marker, location in forbidden_date_markup.items():
                if marker in source:
                    errors.append(
                        f"{page.relative_to(ROOT)}: exposes a working-paper date in {location}"
                    )

    hiding_page = ROOT / "papers/hiding-the-children.html"
    if "No bunching appears at 18-19." not in parsed[hiding_page.resolve()].visible_text:
        errors.append("papers/hiding-the-children.html: displayed abstract differs from the current paper")
    if not (ROOT / "assets/images/og/hiding-the-children.png").exists():
        errors.append("missing dedicated social-preview image for Hiding the Children")

    for page in pages:
        source = page.read_text(encoding="utf-8")
        if 'href="https://scholar.google.com/citations?user=ap4duGUAAAAJ&hl=en"' in source:
            errors.append(f"{page.relative_to(ROOT)}: unescaped ampersand in Google Scholar link")

    if errors:
        print("Site checks failed:")
        for error in errors:
            print(f"- {error}")
        raise SystemExit(1)

    print(f"Site checks passed for {len(pages)} HTML pages.")


if __name__ == "__main__":
    main()
