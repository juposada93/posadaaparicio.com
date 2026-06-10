from pathlib import Path
import re
from html import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "public-cv.md"
OUTPUT = ROOT / "assets" / "docs" / "Juan_P_Aparicio_public_CV.pdf"
TEXT_OUTPUT = ROOT / "assets" / "docs" / "Juan_P_Aparicio_public_CV.txt"
LINK_RE = re.compile(r"\[([^\]]+)\]\(((?:https?://|mailto:)[^)]+)\)")
BOLD_RE = re.compile(r"\*\*([^*]+)\*\*")
LINK_COLOR = "#24546b"
SIDE_MARGIN = 0.44 * inch


def bold_markup(text: str) -> str:
    pieces = []
    last = 0
    for match in BOLD_RE.finditer(text):
        pieces.append(escape(text[last:match.start()]))
        pieces.append(f"<b>{escape(match.group(1))}</b>")
        last = match.end()
    pieces.append(escape(text[last:]))
    return "".join(pieces)


def inline_markup(text: str) -> str:
    pieces = []
    last = 0
    for match in LINK_RE.finditer(text):
        pieces.append(bold_markup(text[last:match.start()]))
        label = bold_markup(match.group(1))
        url = escape(match.group(2), quote=True)
        pieces.append(f'<a href="{url}" color="{LINK_COLOR}">{label}</a>')
        last = match.end()
    pieces.append(bold_markup(text[last:]))
    return "".join(pieces)


def plain_inline(text: str) -> str:
    text = BOLD_RE.sub(r"\1", text)
    return LINK_RE.sub(lambda match: f"{match.group(1)} ({match.group(2)})", text)


def build_text(lines: list[str]) -> None:
    output = []
    for line in lines:
        raw = line.strip()
        if not raw:
            output.append("")
            continue
        if raw.startswith("# "):
            output.append(raw[2:])
            continue
        if raw.startswith("## "):
            output.extend(["", raw[3:].upper()])
            continue
        if raw.startswith("- "):
            output.append("- " + plain_inline(raw[2:]))
            continue
        output.append(plain_inline(raw))

    TEXT_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    TEXT_OUTPUT.write_text("\n".join(output).strip() + "\n", encoding="utf-8")


def add_section_heading(story: list, title: str, styles) -> None:
    story.append(Paragraph(inline_markup(title).upper(), styles["Section"]))
    story.append(
        HRFlowable(
            width="100%",
            thickness=0.55,
            color=colors.HexColor("#d2c8b9"),
            spaceBefore=0,
            spaceAfter=4,
        )
    )


def parse_sections(lines: list[str], section_start: int) -> list[dict]:
    sections = []
    current = None

    for line in lines[section_start:]:
        raw = line.strip()
        if not raw:
            continue
        if raw.startswith("## "):
            current = {"title": raw[3:], "items": []}
            sections.append(current)
            continue
        if current is None:
            continue
        if raw.startswith("- "):
            current["items"].append(("bullet", raw[2:]))
        else:
            current["items"].append(("body", raw))

    return sections


def build_pdf() -> None:
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="Name",
            parent=styles["Title"],
            fontName="Times-Bold",
            fontSize=24,
            leading=27,
            spaceAfter=6,
            textColor=colors.HexColor("#191814"),
            alignment=TA_LEFT,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Role",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=12.6,
            textColor=colors.HexColor("#3d3932"),
            spaceAfter=2.5,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Contact",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=8.8,
            leading=11.4,
            textColor=colors.HexColor("#3d3932"),
            alignment=TA_LEFT,
            spaceAfter=2.3,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Profile",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=8.75,
            leading=11.3,
            textColor=colors.HexColor("#3d3932"),
            spaceBefore=1,
            spaceAfter=1,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Section",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=10.6,
            leading=12.4,
            textColor=colors.HexColor("#254f43"),
            spaceBefore=12,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="BulletClean",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=8.25,
            leading=10.65,
            leftIndent=14,
            firstLineIndent=-8,
            spaceAfter=3.25,
            textColor=colors.HexColor("#26231f"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="BulletCompact",
            parent=styles["BulletClean"],
            fontSize=8.05,
            leading=10.3,
            leftIndent=9,
            firstLineIndent=-7,
            spaceAfter=1.5,
        )
    )
    styles.add(
        ParagraphStyle(
            name="BodyClean",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=8.9,
            leading=11.8,
            spaceAfter=2.8,
            textColor=colors.HexColor("#26231f"),
        )
    )

    lines = SOURCE.read_text(encoding="utf-8").splitlines()
    build_text(lines)
    section_start = next(i for i, line in enumerate(lines) if line.startswith("## "))
    header_lines = [line.strip() for line in lines[:section_start] if line.strip()]
    name = header_lines[0][2:] if header_lines and header_lines[0].startswith("# ") else "Juan P. Aparicio"
    role = header_lines[1] if len(header_lines) > 1 else ""
    contact_prefixes = ("Email:", "Website:", "ORCID:", "LinkedIn:", "GitHub:", "Google Scholar:")
    profile_lines = [
        line for line in header_lines[2:]
        if not line.startswith(contact_prefixes)
    ]
    contact_lines = [
        line for line in header_lines[2:]
        if line.startswith(contact_prefixes)
    ]
    story = [
        Paragraph(inline_markup(name), styles["Name"]),
        Paragraph(inline_markup(role), styles["Role"]),
        *[Paragraph(inline_markup(item), styles["Profile"]) for item in profile_lines],
        *[Paragraph(inline_markup(item), styles["Contact"]) for item in contact_lines],
        HRFlowable(width="100%", thickness=0.65, color=colors.HexColor("#d2c8b9"), spaceBefore=4, spaceAfter=7),
    ]

    for section in parse_sections(lines, section_start):
        add_section_heading(story, section["title"], styles)
        items = section["items"]
        for kind, text in items:
            if kind == "bullet":
                story.append(Paragraph("- " + inline_markup(text), styles["BulletClean"]))
            else:
                story.append(Paragraph(inline_markup(text), styles["Role"]))

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=letter,
        rightMargin=SIDE_MARGIN,
        leftMargin=SIDE_MARGIN,
        topMargin=0.48 * inch,
        bottomMargin=0.48 * inch,
        title="Juan P. Aparicio - Public CV",
        author="Juan P. Aparicio",
    )
    doc.build(story)


if __name__ == "__main__":
    build_pdf()
