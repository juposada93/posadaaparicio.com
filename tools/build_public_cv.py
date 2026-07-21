"""Maintain legacy public-CV URLs as aliases of the current job-market CV."""

from pathlib import Path
import shutil


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "assets" / "docs"
ALIASES = {
    DOCS / "Juan_Aparicio_Economics_Job_Market_CV.pdf": DOCS / "Juan_P_Aparicio_public_CV.pdf",
    DOCS / "Juan_Aparicio_Economics_Job_Market_CV.txt": DOCS / "Juan_P_Aparicio_public_CV.txt",
}


def build_aliases() -> None:
    for source, destination in ALIASES.items():
        if not source.exists():
            raise FileNotFoundError(f"Missing canonical CV artifact: {source}")
        shutil.copy2(source, destination)


if __name__ == "__main__":
    build_aliases()
