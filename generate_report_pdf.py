from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from xml.sax.saxutils import escape


ROOT = Path(__file__).resolve().parent
MD_PATH = ROOT / "Application-Architecture-Report.md"
PDF_PATH = ROOT / "Application-Architecture-Report.pdf"


def build_pdf(md_text: str) -> None:
    styles = getSampleStyleSheet()
    normal = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10.5,
        leading=14,
        spaceAfter=5,
    )
    h1 = ParagraphStyle(
        "H1",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        spaceBefore=8,
        spaceAfter=10,
    )
    h2 = ParagraphStyle(
        "H2",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        spaceBefore=8,
        spaceAfter=6,
    )
    h3 = ParagraphStyle(
        "H3",
        parent=styles["Heading3"],
        fontName="Helvetica-Bold",
        fontSize=11.5,
        leading=14,
        spaceBefore=6,
        spaceAfter=4,
    )

    story = []
    for raw in md_text.splitlines():
        line = raw.rstrip()
        if not line:
            story.append(Spacer(1, 6))
            continue

        if line.startswith("# "):
            story.append(Paragraph(escape(line[2:].strip()), h1))
            continue
        if line.startswith("## "):
            story.append(Paragraph(escape(line[3:].strip()), h2))
            continue
        if line.startswith("### "):
            story.append(Paragraph(escape(line[4:].strip()), h3))
            continue
        if line.startswith("#### "):
            story.append(Paragraph(f"<b>{escape(line[5:].strip())}</b>", normal))
            continue

        if line.startswith("- "):
            story.append(Paragraph(f"&#8226; {escape(line[2:].strip())}", normal))
            continue
        if line[0].isdigit() and ". " in line[:4]:
            story.append(Paragraph(escape(line), normal))
            continue

        story.append(Paragraph(escape(line), normal))

    doc = SimpleDocTemplate(
        str(PDF_PATH),
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title="Global AI Skill Challenge Report",
        author="Codex",
    )
    doc.build(story)


if __name__ == "__main__":
    content = MD_PATH.read_text(encoding="utf-8")
    build_pdf(content)
    print(f"PDF generated: {PDF_PATH}")
