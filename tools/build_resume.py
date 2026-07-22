"""Build the private industry-facing resume PDF and text artifacts."""

from html import escape
from pathlib import Path
import re

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "industry-resume.md"
OUTPUT = ROOT / "assets" / "docs" / "Juan_Aparicio_Resume.pdf"
TEXT_OUTPUT = ROOT / "assets" / "docs" / "Juan_Aparicio_Resume.txt"
BOLD_RE = re.compile(r"\*\*([^*]+)\*\*")


def markup(text: str) -> str:
    pieces = []
    last = 0
    for match in BOLD_RE.finditer(text):
        pieces.append(escape(text[last : match.start()]))
        pieces.append(f"<b>{escape(match.group(1))}</b>")
        last = match.end()
    pieces.append(escape(text[last:]))
    return "".join(pieces)


def plain(text: str) -> str:
    return BOLD_RE.sub(r"\1", text)


def build_text(lines: list[str]) -> None:
    rendered = []
    for line in lines:
        raw = line.strip()
        if raw.startswith("# "):
            rendered.append(raw[2:])
        elif raw.startswith("## "):
            rendered.extend(["", raw[3:].upper()])
        else:
            rendered.append(plain(raw))
    TEXT_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    TEXT_OUTPUT.write_text("\n".join(rendered).strip() + "\n", encoding="utf-8")


def build_pdf() -> Path:
    lines = SOURCE.read_text(encoding="utf-8").splitlines()
    build_text(lines)

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            "ResumeName",
            parent=styles["Title"],
            fontName="Times-Bold",
            fontSize=23,
            leading=25,
            textColor=colors.HexColor("#191814"),
            spaceAfter=5,
        )
    )
    styles.add(
        ParagraphStyle(
            "ResumeLead",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=8.8,
            leading=11.2,
            textColor=colors.HexColor("#3d3932"),
            spaceAfter=2.5,
        )
    )
    styles.add(
        ParagraphStyle(
            "ResumeSection",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=10.5,
            leading=12,
            textColor=colors.HexColor("#254f43"),
            spaceBefore=7,
            spaceAfter=2,
        )
    )
    styles.add(
        ParagraphStyle(
            "ResumeBody",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=8.25,
            leading=10.5,
            textColor=colors.HexColor("#26231f"),
            spaceAfter=2.2,
        )
    )
    styles.add(
        ParagraphStyle(
            "ResumeBullet",
            parent=styles["ResumeBody"],
            leftIndent=12,
            firstLineIndent=-8,
            spaceAfter=2.4,
        )
    )

    story = []
    first_section = next(i for i, line in enumerate(lines) if line.startswith("## "))
    header = [line.strip() for line in lines[:first_section] if line.strip()]
    story.append(Paragraph(markup(header[0][2:]), styles["ResumeName"]))
    for line in header[1:]:
        story.append(Paragraph(markup(line), styles["ResumeLead"]))
    story.append(
        HRFlowable(
            width="100%",
            thickness=0.65,
            color=colors.HexColor("#d2c8b9"),
            spaceBefore=3,
            spaceAfter=4,
        )
    )

    for line in lines[first_section:]:
        raw = line.strip()
        if not raw:
            continue
        if raw.startswith("## "):
            story.append(Paragraph(markup(raw[3:].upper()), styles["ResumeSection"]))
            story.append(
                HRFlowable(
                    width="100%",
                    thickness=0.45,
                    color=colors.HexColor("#d2c8b9"),
                    spaceBefore=0,
                    spaceAfter=3,
                )
            )
        elif raw.startswith("- "):
            story.append(Paragraph("• " + markup(raw[2:]), styles["ResumeBullet"]))
        else:
            story.append(Paragraph(markup(raw), styles["ResumeBody"]))

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    document = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=letter,
        leftMargin=0.44 * inch,
        rightMargin=0.44 * inch,
        topMargin=0.38 * inch,
        bottomMargin=0.34 * inch,
        title="Juan P. Aparicio - Resume",
        author="Juan P. Aparicio",
        subject="Private industry-facing resume",
    )
    document.build(story)
    return OUTPUT


if __name__ == "__main__":
    print(build_pdf())
