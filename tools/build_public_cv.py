from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "public-cv.md"
OUTPUT = ROOT / "assets" / "docs" / "Juan_P_Aparicio_public_CV.pdf"


def inline_markup(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def build_pdf() -> None:
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="Name",
            parent=styles["Title"],
            fontName="Times-Bold",
            fontSize=25,
            leading=28,
            spaceAfter=8,
            textColor=colors.HexColor("#191814"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="Role",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=14,
            textColor=colors.HexColor("#3d3932"),
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Section",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=11.5,
            leading=14,
            textColor=colors.HexColor("#254f43"),
            spaceBefore=12,
            spaceAfter=5,
        )
    )
    styles.add(
        ParagraphStyle(
            name="BulletClean",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=8.7,
            leading=11.2,
            leftIndent=12,
            firstLineIndent=-7,
            spaceAfter=3,
            textColor=colors.HexColor("#26231f"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="BodyClean",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            spaceAfter=3,
            textColor=colors.HexColor("#26231f"),
        )
    )

    story = []
    lines = SOURCE.read_text(encoding="utf-8").splitlines()
    for line in lines:
        raw = line.strip()
        if not raw:
            story.append(Spacer(1, 3))
            continue
        if raw.startswith("# "):
            story.append(Paragraph(inline_markup(raw[2:]), styles["Name"]))
        elif raw.startswith("## "):
            story.append(Paragraph(inline_markup(raw[3:]).upper(), styles["Section"]))
        elif raw.startswith("- "):
            story.append(Paragraph("- " + inline_markup(raw[2:]), styles["BulletClean"]))
        else:
            story.append(Paragraph(inline_markup(raw), styles["Role"]))

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=letter,
        rightMargin=0.62 * inch,
        leftMargin=0.62 * inch,
        topMargin=0.52 * inch,
        bottomMargin=0.52 * inch,
        title="Juan P. Aparicio - Public CV",
        author="Juan P. Aparicio",
    )
    doc.build(story)


if __name__ == "__main__":
    build_pdf()
