"""Dependency-free quality gate for the static academic website."""

from __future__ import annotations

from collections import Counter
from html.parser import HTMLParser
import json
from pathlib import Path
from urllib.parse import unquote, urlparse


ROOT = Path(__file__).resolve().parents[1]


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
        if self._json_ld:
            self._json_chunks.append(data)

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

    if errors:
        print("Site checks failed:")
        for error in errors:
            print(f"- {error}")
        raise SystemExit(1)

    print(f"Site checks passed for {len(pages)} HTML pages.")


if __name__ == "__main__":
    main()
