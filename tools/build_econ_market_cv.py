from __future__ import annotations

import json
import shutil
from html import escape
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    CondPageBreak,
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "econ-market-cv.json"
OUTPUT_DIR = ROOT / "output" / "pdf"
PDF_OUTPUT = OUTPUT_DIR / "Juan_Aparicio_Economics_Job_Market_CV.pdf"
TEXT_OUTPUT = OUTPUT_DIR / "Juan_Aparicio_Economics_Job_Market_CV.txt"
WEBSITE_PDF_OUTPUT = ROOT / "assets" / "docs" / "Juan_Aparicio_Economics_Job_Market_CV.pdf"
WEBSITE_TEXT_OUTPUT = ROOT / "assets" / "docs" / "Juan_Aparicio_Economics_Job_Market_CV.txt"

INK = colors.HexColor("#20201d")
MUTED = colors.HexColor("#55514b")
ACCENT = colors.HexColor("#24594f")
RULE = colors.HexColor("#cfc7ba")
LINK = "#24546b"


def linked(text: str, url: str | None = None, bold: bool = False) -> str:
    label = escape(text)
    if bold:
        label = f"<b>{label}</b>"
    if not url:
        return label
    return f'<a href="{escape(url, quote=True)}" color="{LINK}">{label}</a>'


def build_styles():
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="CVName",
            parent=styles["Title"],
            fontName="Times-Bold",
            fontSize=24,
            leading=27,
            alignment=TA_CENTER,
            textColor=INK,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CVContact",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=10,
            leading=12.2,
            alignment=TA_CENTER,
            textColor=MUTED,
            spaceAfter=1,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CVSection",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=11.2,
            leading=13.2,
            textColor=ACCENT,
            spaceBefore=8,
            spaceAfter=2,
            keepWithNext=True,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CVSubsection",
            parent=styles["Heading3"],
            fontName="Helvetica-Bold",
            fontSize=10.3,
            leading=12.4,
            textColor=INK,
            spaceBefore=5,
            spaceAfter=2,
            keepWithNext=True,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CVBody",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=10,
            leading=12.15,
            textColor=INK,
            spaceAfter=3.2,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CVBodyTight",
            parent=styles["CVBody"],
            leading=11.8,
            spaceAfter=2,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CVDate",
            parent=styles["CVBody"],
            fontName="Helvetica-Bold",
            textColor=MUTED,
            alignment=TA_LEFT,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CVEntryTitle",
            parent=styles["CVBody"],
            fontName="Helvetica-Bold",
            fontSize=10.2,
            leading=12.4,
            spaceAfter=1,
            keepWithNext=True,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CVMeta",
            parent=styles["CVBody"],
            fontName="Helvetica-Oblique",
            textColor=MUTED,
            leading=11.8,
            spaceAfter=1.6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CVAbstract",
            parent=styles["CVBody"],
            leftIndent=9,
            rightIndent=7,
            borderColor=RULE,
            borderWidth=0,
            borderPadding=0,
            leading=12.4,
            spaceBefore=1,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CVBullet",
            parent=styles["CVBody"],
            leftIndent=13,
            firstLineIndent=-8,
            bulletIndent=0,
            leading=12.15,
            spaceAfter=2.2,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CVReference",
            parent=styles["CVBody"],
            leading=12,
            spaceAfter=0,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CVReferenceCompact",
            parent=styles["CVReference"],
            fontSize=8.7,
            leading=10.2,
        )
    )
    return styles


def section_components(title: str, styles) -> list:
    return [
        Paragraph(escape(title).upper(), styles["CVSection"]),
        HRFlowable(
            width="100%",
            thickness=0.55,
            color=RULE,
            spaceBefore=0,
            spaceAfter=4,
        ),
    ]


def section_heading(story: list, title: str, styles, minimum_space: float = 0.72 * inch) -> None:
    story.append(CondPageBreak(minimum_space))
    story.extend(section_components(title, styles))


def dated_table(items: list[dict], styles, label_key: str, institution_key: str = "institution") -> Table:
    rows = []
    for item in items:
        left = Paragraph(escape(item["dates"]), styles["CVDate"])
        title = escape(item[label_key])
        institution = escape(item.get(institution_key, ""))
        first_line = f"<b>{title}</b>"
        if institution:
            first_line += f", {institution}"
        details = item.get("details")
        if details:
            first_line += f"<br/>{escape(details)}"
        right = Paragraph(first_line, styles["CVBodyTight"])
        rows.append([left, right])
    table = Table(rows, colWidths=[1.22 * inch, 5.02 * inch], hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (0, -1), 8),
                ("RIGHTPADDING", (1, 0), (1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2.4),
            ]
        )
    )
    return table


def research_entry(item: dict, styles, include_summary: bool = True) -> KeepTogether:
    title = linked(item["title"], item.get("url"), bold=True)
    flowables = [Paragraph(title, styles["CVEntryTitle"])]

    meta_bits = []
    if item.get("authors"):
        meta_bits.append(escape(item["authors"]))
    if item.get("coauthors"):
        meta_bits.append(escape(item["coauthors"]))
    if item.get("venue"):
        meta_bits.append(f"<i>{escape(item['venue'])}</i>")
    if item.get("status"):
        meta_bits.append(escape(item["status"]))
    if meta_bits:
        flowables.append(Paragraph(". ".join(meta_bits) + ".", styles["CVMeta"]))

    if item.get("note"):
        flowables.append(Paragraph(escape(item["note"]), styles["CVBodyTight"]))
    if include_summary and item.get("summary"):
        flowables.append(Paragraph(escape(item["summary"]), styles["CVBodyTight"]))
    return KeepTogether(flowables)


def reference_table(references: list[dict], styles) -> Table:
    columns = 4 if len(references) == 4 else 3
    reference_style = styles["CVReferenceCompact"] if columns == 4 else styles["CVReference"]
    cells = []
    for ref in references:
        email_text = escape(ref["email"])
        if (columns == 4 or len(ref["email"]) > 28) and "@" in ref["email"]:
            local, domain = ref["email"].split("@", 1)
            email_text = f"{escape(local)}<br/>@{escape(domain)}"
        email = f'<a href="mailto:{escape(ref["email"], quote=True)}" color="{LINK}">{email_text}</a>'
        cells.append(
            Paragraph(
                f"<b>{escape(ref['name'])}</b><br/>"
                f"{escape(ref.get('short_title', ref['title']))}<br/>"
                f"{escape(ref.get('short_institution', ref['institution']))}<br/>"
                f"{email}",
                reference_style,
            )
        )
    while len(cells) % columns:
        cells.append(Paragraph("", reference_style))
    rows = [cells[index : index + columns] for index in range(0, len(cells), columns)]
    table = Table(rows, colWidths=[6.24 * inch / columns] * columns, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (0, -1), 0),
                ("LEFTPADDING", (1, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-2, -1), 8),
                ("RIGHTPADDING", (-1, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return table


def draw_page(canvas, doc, data) -> None:
    canvas.saveState()
    width, height = letter

    if doc.page > 1:
        canvas.setFont("Helvetica-Bold", 8.6)
        canvas.setFillColor(MUTED)
        canvas.drawString(0.62 * inch, height - 0.34 * inch, data["name"])
        canvas.setFont("Helvetica", 8.6)
        canvas.drawRightString(width - 0.62 * inch, height - 0.34 * inch, data["document_title"])
        canvas.setStrokeColor(RULE)
        canvas.setLineWidth(0.45)
        canvas.line(0.62 * inch, height - 0.43 * inch, width - 0.62 * inch, height - 0.43 * inch)

    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.4)
    canvas.line(0.62 * inch, 0.43 * inch, width - 0.62 * inch, 0.43 * inch)
    canvas.setFont("Helvetica", 8.4)
    canvas.setFillColor(MUTED)
    canvas.drawString(0.62 * inch, 0.27 * inch, f"Updated {data['updated']}")
    canvas.drawRightString(width - 0.62 * inch, 0.27 * inch, f"Page {doc.page}")
    canvas.restoreState()


def build_pdf(data: dict) -> None:
    styles = build_styles()
    story = []

    contact = data["contact"]
    story.append(Paragraph(escape(data["name"]), styles["CVName"]))
    contact_line_1 = " &nbsp;&bull;&nbsp; ".join(
        [
            linked(contact["email"], f"mailto:{contact['email']}") ,
            escape(contact["phone"]),
            escape(contact["location"]),
        ]
    )
    contact_line_2 = " &nbsp;&bull;&nbsp; ".join(
        [
            linked("Website", contact["website"]),
            linked("Google Scholar", contact["scholar"]),
            linked("ORCID", contact["orcid"]),
        ]
    )
    story.append(Paragraph(contact_line_1, styles["CVContact"]))
    story.append(Paragraph(contact_line_2, styles["CVContact"]))
    story.append(Spacer(1, 2))

    section_heading(story, "Academic Appointments", styles)
    story.append(dated_table(data["academic_appointments"], styles, "title"))

    section_heading(story, "Education", styles)
    story.append(dated_table(data["education"], styles, "degree"))

    section_heading(story, "Research and Teaching Fields", styles)
    fields = data["fields"]
    story.append(Paragraph(f"<b>Research fields:</b> {escape(fields['research'])}", styles["CVBodyTight"]))
    story.append(Paragraph(f"<b>Research interests:</b> {escape(fields['interests'])}", styles["CVBodyTight"]))
    story.append(Paragraph(f"<b>Teaching fields:</b> {escape(fields['teaching'])}", styles["CVBodyTight"]))

    references_block = section_components("References", styles) + [reference_table(data["references"], styles)]
    story.append(CondPageBreak(1.65 * inch))
    story.append(KeepTogether(references_block))

    jmp = data["job_market_paper"]
    jmp_title = linked(jmp["title"], jmp["url"], bold=True)
    jmp_block = section_components("Job Market Paper", styles) + [
        Paragraph(jmp_title, styles["CVEntryTitle"]),
        Paragraph(
            f"{escape(jmp['coauthors'])}. <i>{escape(jmp['status'])}</i>.",
            styles["CVMeta"],
        ),
        Paragraph(f"<b>Abstract.</b> {escape(jmp['abstract'])}", styles["CVAbstract"]),
    ]
    story.append(CondPageBreak(2.75 * inch))
    story.append(KeepTogether(jmp_block))

    section_heading(story, "Peer-Reviewed Publications", styles, minimum_space=2.0 * inch)
    for item in data["publications"]:
        story.append(research_entry(item, styles, include_summary=False))

    section_heading(story, "Working Papers", styles)
    for item in data["working_papers"]:
        story.append(research_entry(item, styles, include_summary=item.get("show_summary_on_cv", True)))

    story.append(Paragraph("Other discussion paper", styles["CVSubsection"]))
    for item in data["other_research"]:
        story.append(research_entry(item, styles, include_summary=False))

    story.append(Paragraph("Work in progress", styles["CVSubsection"]))
    for item in data["work_in_progress"]:
        story.append(Paragraph(f"- {escape(item)}", styles["CVBullet"]))

    grants_block = section_components("Grants and Awards", styles) + [
        dated_table(data["grants_and_awards"], styles, "title", institution_key="unused")
    ]
    story.append(CondPageBreak(2.15 * inch))
    story.append(KeepTogether(grants_block))

    presentations_block = section_components("Selected Presentations", styles)
    presentations_block.extend(
        Paragraph(f"- {escape(item)}", styles["CVBullet"]) for item in data["presentations"]
    )
    story.append(CondPageBreak(1.55 * inch))
    story.append(KeepTogether(presentations_block))

    section_heading(story, "Teaching Experience", styles)
    story.append(dated_table(data["teaching"], styles, "course"))

    section_heading(story, "Other Professional and Policy Experience", styles)
    story.append(dated_table(data["professional_experience"], styles, "title"))
    report = data["policy_report"]
    story.append(Paragraph(linked(report["title"], report["url"], bold=True), styles["CVEntryTitle"]))
    story.append(
        Paragraph(
            f"<i>{escape(report['venue'])}</i>. {escape(report['note'])}",
            styles["CVBodyTight"],
        )
    )

    section_heading(story, "Service and Supervision", styles)
    for item in data["service"]:
        story.append(Paragraph(f"- {escape(item)}", styles["CVBullet"]))

    if data.get("include_technical", True):
        story.append(Spacer(1, 4))
        story.append(
            Paragraph(
                f"<b>Software:</b> {escape(data['technical']['software'])}. "
                f"<b>Languages:</b> {escape(data['technical']['languages'])}.",
                styles["CVBodyTight"],
            )
        )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(PDF_OUTPUT),
        pagesize=letter,
        leftMargin=0.62 * inch,
        rightMargin=0.62 * inch,
        topMargin=0.58 * inch,
        bottomMargin=0.56 * inch,
        title=f"{data['name']} - {data['document_title']}",
        author=data["name"],
        subject="Academic economics job market curriculum vitae",
        keywords=[
            "Juan P. Aparicio",
            "economics job market",
            "applied microeconomics",
            "political economy",
            "development economics",
            "conflict",
            "research reproducibility",
        ],
    )
    doc.build(
        story,
        onFirstPage=lambda canvas, doc: draw_page(canvas, doc, data),
        onLaterPages=lambda canvas, doc: draw_page(canvas, doc, data),
    )
    WEBSITE_PDF_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(PDF_OUTPUT, WEBSITE_PDF_OUTPUT)


def build_text(data: dict) -> None:
    lines = [
        data["name"],
        data["document_title"],
        f"Updated {data['updated']}",
        f"{data['contact']['location']} | {data['contact']['phone']} | {data['contact']['email']}",
        f"{data['contact']['website']} | {data['contact']['scholar']} | {data['contact']['orcid']}",
        "",
    ]

    def heading(title: str) -> None:
        lines.extend([title.upper(), ""])

    def dated(items: list[dict], label_key: str) -> None:
        for item in items:
            institution = item.get("institution", "")
            line = f"{item['dates']} | {item[label_key]}"
            if institution:
                line += f", {institution}"
            lines.append(line)
            if item.get("details"):
                lines.append(item["details"])
        lines.append("")

    heading("Academic Appointments")
    dated(data["academic_appointments"], "title")
    heading("Education")
    dated(data["education"], "degree")
    heading("Research and Teaching Fields")
    lines.extend(
        [
            f"Research fields: {data['fields']['research']}",
            f"Research interests: {data['fields']['interests']}",
            f"Teaching fields: {data['fields']['teaching']}",
            "",
        ]
    )
    heading("References")
    for ref in data["references"]:
        lines.extend(
            [
                ref["name"],
                ref["title"],
                ref["institution"],
                ref["email"],
                "",
            ]
        )
    heading("Job Market Paper")
    jmp = data["job_market_paper"]
    lines.extend(
        [
            jmp["title"],
            f"{jmp['coauthors']}. {jmp['status']}.",
            jmp["url"],
            f"Abstract: {jmp['abstract']}",
            "",
        ]
    )
    heading("Peer-Reviewed Publications")
    for item in data["publications"]:
        lines.append(item["title"])
        lines.append(f"{item.get('authors', '')}. {item.get('venue', '')}.")
        if item.get("note"):
            lines.append(item["note"])
        if item.get("url"):
            lines.append(item["url"])
        lines.append("")
    heading("Working Papers")
    for item in data["working_papers"] + data["other_research"]:
        lines.append(item["title"])
        lines.append(f"{item.get('authors', '')}. {item.get('status', '')}.")
        if item.get("summary"):
            lines.append(item["summary"])
        if item.get("url"):
            lines.append(item["url"])
        lines.append("")
    lines.append("Work in progress:")
    lines.extend(f"- {item}" for item in data["work_in_progress"])
    lines.append("")
    heading("Grants and Awards")
    dated(data["grants_and_awards"], "title")
    heading("Selected Presentations")
    lines.extend(f"- {item}" for item in data["presentations"])
    lines.append("")
    heading("Teaching Experience")
    dated(data["teaching"], "course")
    heading("Other Professional and Policy Experience")
    dated(data["professional_experience"], "title")
    lines.extend(
        [
            data["policy_report"]["title"],
            f"{data['policy_report']['venue']}. {data['policy_report']['note']}",
            data["policy_report"]["url"],
            "",
        ]
    )
    heading("Service and Supervision")
    lines.extend(f"- {item}" for item in data["service"])
    lines.append("")
    if data.get("include_technical", True):
        heading("Software and Languages")
        lines.extend(
            [
                f"Software: {data['technical']['software']}",
                f"Languages: {data['technical']['languages']}",
                "",
            ]
        )
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    TEXT_OUTPUT.write_text("\n".join(lines).strip() + "\n", encoding="utf-8")
    WEBSITE_TEXT_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(TEXT_OUTPUT, WEBSITE_TEXT_OUTPUT)


def main() -> None:
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    build_pdf(data)
    build_text(data)
    print(PDF_OUTPUT)
    print(TEXT_OUTPUT)
    print(WEBSITE_PDF_OUTPUT)
    print(WEBSITE_TEXT_OUTPUT)


if __name__ == "__main__":
    main()
