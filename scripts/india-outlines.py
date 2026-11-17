#!/usr/bin/env python3
"""
India's name in the languages of India, as outlines, for the Work page's title: WorkHero.tsx
morphs each outline into the next. Run it again whenever WORK_PAGE.names in src/content/site.ts
changes; it rewrites src/components/work/india-outlines.ts.

    pip install uharfbuzz fonttools
    python3 scripts/india-outlines.py --fonts <dir>

<dir> holds a folder for each typeface below, named as Google Fonts names it (jost,
notosansdevanagari, ...), each with the typeface's font.ttf at the weight below: the file that
fonts.googleapis.com/css2?family=<Family>:wght@<weight> links to when it's asked for without a
browser's user agent (it then serves TTF).

Each word is shaped by HarfBuzz, as a browser shapes it (its letters joined and reordered as its
script needs), and drawn from its typeface. INDIA is laid out as the title sets it (Jost, its
letters spaced 0.32em apart with as much before them, `.tracked`, in a box as high as its font size
with the line's height at 1); each name stands about as tall as INDIA's capitals (its script's
height, below), never wider than INDIA's letters, centred where they are.
"""

import argparse
import json
import pathlib
import re

import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / "src/content/site.ts"
OUT = ROOT / "src/components/work/india-outlines.ts"

UNIT = 1000  # the title's font size, in the outlines' units
TRACK = 0.32  # INDIA's letter spacing, and the space before it, in em

TITLE = ("jost", 400, "INDIA")
# each script's typeface (and the weight its font.ttf is), and how tall its letters with their
# marks stand to INDIA's capitals: more where marks above and below take much of it (Arabic's
# dots, Kannada's and Tamil's vowel signs), so each reads the same size
SCRIPTS = {
    "devanagari": ("notosansdevanagari", 300, 1.0),
    "bengali": ("notosansbengali", 300, 1.0),
    "tamil": ("notosanstamil", 300, 1.2),
    "gujarati": ("notosansgujarati", 300, 1.0),
    "telugu": ("notosanstelugu", 300, 1.2),
    "gurmukhi": ("notosansgurmukhi", 300, 1.0),
    "arabic": ("notosansarabic", 300, 1.7),
    "kannada": ("notosanskannada", 300, 1.3),
    "odia": ("notosansoriya", 300, 1.0),
    "malayalam": ("notosansmalayalam", 300, 1.1),
    "olchiki": ("notosansolchiki", 400, 1.0),
    "meetei": ("notosansmeeteimayek", 300, 1.1),
}


def names_from_site():
    """WORK_PAGE.names, in order: (word, script)."""
    src = SITE.read_text(encoding="utf-8")
    block = re.search(r"names:\s*\[(.*?)\]\s*as\s", src, re.S)
    if not block:
        raise SystemExit("couldn't find WORK_PAGE.names in " + str(SITE))
    return re.findall(r'word:\s*"([^"]+)",\s*script:\s*"([a-z]+)"', block.group(1))


class Face:
    def __init__(self, path):
        self.tt = TTFont(path)
        self.glyphs = self.tt.getGlyphSet()
        self.order = self.tt.getGlyphOrder()
        self.upem = self.tt["head"].unitsPerEm
        self.hb = hb.Font(hb.Face(hb.Blob.from_file_path(str(path))))

    def shape(self, text, track=0.0):
        """The word's glyphs, left to right, each (name, x, y) in font units from its pen."""
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        hb.shape(self.hb, buf, {})
        x = track * self.upem
        out = []
        for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
            out.append((self.order[info.codepoint], x + pos.x_offset, pos.y_offset))
            x += pos.x_advance + track * self.upem
        return out, x

    def draw(self, placed, pen, transform):
        """Draw the placed glyphs through `transform` (font units, y up -> out units)."""
        for name, x, y in placed:
            a, b, c, d, e, f = transform
            self.glyphs[name].draw(TransformPen(pen, (a, b, c, d, a * x + c * y + e, b * x + d * y + f)))

    def ink(self, placed):
        pen = BoundsPen(self.glyphs)
        self.draw(placed, pen, (1, 0, 0, 1, 0, 0))
        return pen.bounds  # xMin, yMin, xMax, yMax, font units, y up


def path_of(face, placed, transform):
    pen = SVGPathPen(face.glyphs, ntos=lambda v: str(round(v)))
    face.draw(placed, pen, transform)
    # one closed contour per "M"
    return re.sub(r"\s+", " ", pen.getCommands()).strip()


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--fonts", required=True, type=pathlib.Path)
    fonts = ap.parse_args().fonts

    # INDIA, as the title sets it
    jost = Face(fonts / TITLE[0] / "font.ttf")
    k = UNIT / jost.upem
    os2, hhea = jost.tt["OS/2"], jost.tt["hhea"]
    use_typo = bool(os2.fsSelection & (1 << 7))
    asc = (os2.sTypoAscender if use_typo else hhea.ascent) * k
    desc = -(os2.sTypoDescender if use_typo else hhea.descent) * k
    baseline = (UNIT - (asc + desc)) / 2 + asc  # in a box as high as the font size (line-height 1)
    placed, width = jost.shape(TITLE[2], TRACK)
    box = round(width * k)
    india = (k, 0, 0, -k, 0, baseline)
    x0, y0, x1, y1 = jost.ink(placed)
    cx, cy = (x0 + x1) / 2 * k, baseline - (y0 + y1) / 2 * k  # where INDIA's letters are centred
    ink_w, cap = (x1 - x0) * k, (y1 - y0) * k
    shapes = [{"word": TITLE[2], "d": path_of(jost, placed, india)}]

    faces = {}
    for word, script in names_from_site():
        if script not in SCRIPTS:
            raise SystemExit(f"no typeface for script {script!r} ({word})")
        folder, _weight, height = SCRIPTS[script]
        face = faces.get(folder) or faces.setdefault(folder, Face(fonts / folder / "font.ttf"))
        placed, _ = face.shape(word)
        a0, b0, a1, b1 = face.ink(placed)
        s = min(cap * height / (b1 - b0), ink_w / (a1 - a0))  # out units per font unit
        mx, my = (a0 + a1) / 2, (b0 + b1) / 2
        shapes.append({"word": word, "d": path_of(face, placed, (s, 0, 0, -s, cx - mx * s, cy + my * s))})

    # (laid out as the repo's Prettier lays it out)
    body = "\n".join(
        f"  {{\n    word: {json.dumps(sh['word'], ensure_ascii=False)},\n    d: {json.dumps(sh['d'])},\n  }},"
        for sh in shapes
    )
    OUT.write_text(
        "/*\n"
        "  Generated by scripts/india-outlines.py from WORK_PAGE.names in src/content/site.ts: run it\n"
        "  again when the names change; don't edit by hand. India's name in each language as outlines,\n"
        "  for the Work page's title (WorkHero.tsx): INDIA first, then each name in order, in the title's\n"
        "  box (`INDIA_BOX` wide, 1000 high: its font size), each sized and centred as the title. Each `d`\n"
        "  is SVG path data, one closed contour per M.\n"
        "*/\n"
        f"export const INDIA_BOX = {box};\n"
        "export const INDIA_SHAPES: { word: string; d: string }[] = [\n"
        f"{body}\n"
        "];\n",
        encoding="utf-8",
    )
    print(f"{len(shapes)} outlines, {OUT.stat().st_size // 1024} KB -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
