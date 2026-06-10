"""Build the industry-facing resume PDF from data/industry-resume.md."""
import build_public_cv as base

base.SOURCE = base.ROOT / "data" / "industry-resume.md"
base.OUTPUT = base.ROOT / "assets" / "docs" / "Juan_Aparicio_Resume.pdf"
base.TEXT_OUTPUT = base.ROOT / "assets" / "docs" / "Juan_Aparicio_Resume.txt"
base.DOC_TITLE = "Juan P. Aparicio - Resume"
base.DOC_SUBJECT = "Resume for Juan P. Aparicio, economist and data scientist"

if __name__ == "__main__":
    base.build_pdf()
