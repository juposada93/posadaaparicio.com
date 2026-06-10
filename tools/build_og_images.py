"""Generate per-paper Open Graph card images (1200x630 PNG) from data/research.js.

Run after editing data/research.js, before tools/build_research_pages.mjs
(the page builder links /assets/images/og/<id>.png when the file exists).
"""
import json
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "images" / "og"
W, H = 1200, 630
PAPER = "#f7f1e7"
INK = "#191814"
MUTED = "#666058"
GEORGIA = "/System/Library/Fonts/Supplemental/Georgia.ttf"
HELVETICA = "/System/Library/Fonts/Helvetica.ttc"


def load_items():
    js = (ROOT / "data" / "research.js").read_text(encoding="utf-8")
    dump = subprocess.run(
        ["node", "-e",
         "const c={window:{}};require('vm').runInNewContext("
         "require('fs').readFileSync('data/research.js','utf8'),c);"
         "console.log(JSON.stringify(c.window.JPA_RESEARCH))"],
        cwd=ROOT, capture_output=True, text=True, check=True,
    )
    return json.loads(dump.stdout)


def wrap_text(draw, text, font, max_width):
    lines, line = [], ""
    for word in text.split():
        trial = f"{line} {word}".strip()
        if draw.textlength(trial, font=font) <= max_width:
            line = trial
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def card(item):
    img = Image.new("RGB", (W, H), PAPER)
    draw = ImageDraw.Draw(img)
    accent = (item.get("visual") or {}).get("accent", "#24546b")

    # faint vertical grid, echoing the site background
    for x in range(0, W, 72):
        draw.line([(x, 0), (x, H)], fill="#ede5d8", width=1)
    # accent bar
    draw.rectangle([0, 0, 18, H], fill=accent)

    name_font = ImageFont.truetype(HELVETICA, 30)
    title_font = ImageFont.truetype(GEORGIA, 58)
    meta_font = ImageFont.truetype(HELVETICA, 28)

    margin = 70
    draw.text((margin, 56), "JUAN P. APARICIO", font=name_font, fill=accent)
    draw.line([(margin, 110), (margin + 64, 110)], fill=accent, width=3)

    title = item["title"]
    lines = wrap_text(draw, title, title_font, W - margin * 2)
    if len(lines) > 5:
        lines = lines[:5]
        lines[-1] += " …"
    y = 150
    for line in lines:
        draw.text((margin, y), line, font=title_font, fill=INK)
        y += 74

    meta = f"{item.get('venue', '')} · {item.get('year', '')}".strip(" ·")
    draw.text((margin, H - 86), meta[:90], font=meta_font, fill=MUTED)

    return img


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for item in load_items():
        path = OUT_DIR / f"{item['id']}.png"
        card(item).save(path, optimize=True)
        print(f"wrote {path.relative_to(ROOT)} ({path.stat().st_size // 1024}KB)")


if __name__ == "__main__":
    main()
