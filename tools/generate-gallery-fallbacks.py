from __future__ import annotations

import json
import math
import re
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src" / "main.jsx"
MANIFEST_PATH = ROOT / "src" / "gallery-manifest.json"
OUTPUT_ROOT = ROOT / "public" / "images" / "gallery"

SCENES = [
    ("#d8f5ff", "#b6c6ff", "☀️", "🌿", 0),
    ("#fff4b5", "#ffd49b", "✨", "🧺", -5),
    ("#d9ffd9", "#a8e9d6", "💧", "🍃", 5),
    ("#f3d8ff", "#cbbaff", "🌙", "⭐", -3),
]
# The old fallback only changed the background and left the same emoji in the
# same place.  These poses deliberately change the subject's scale, position,
# rotation, framing, and foreground scene so every frame is a different view
# of the object rather than a recoloured copy.
POSES = [
    {"x": 320, "y": 245, "size": 208, "rotation": -7, "frame": "plate"},
    {"x": 268, "y": 228, "size": 176, "rotation": 12, "frame": "close"},
    {"x": 354, "y": 247, "size": 232, "rotation": -14, "frame": "branch"},
    {"x": 320, "y": 232, "size": 184, "rotation": 8, "frame": "sticker"},
]
PROMPT_PROPS = {
    "میوه": ("🍃", "🧺"),
    "رنگ": ("🎨", "✨"),
    "سبزی": ("🌱", "🥗"),
    "وسیله نقلیه": ("🛣️", "🚦"),
    "لباس": ("🧺", "✨"),
    "عضو بدن": ("🩺", "❤️"),
    "خوراکی": ("🍽️", "🍴"),
    "پدیدهٔ طبیعت": ("☀️", "🌈"),
    "وسیله": ("🏠", "💡"),
}


def star_points(cx: float, cy: float, outer: float, inner: float, rotation: float = -90) -> str:
    """Return a five-point star polygon for the starfruit illustrations."""
    points = []
    for index in range(10):
        angle = math.radians(rotation + index * 36)
        radius = outer if index % 2 == 0 else inner
        points.append(f"{cx + radius * math.cos(angle):.1f},{cy + radius * math.sin(angle):.1f}")
    return " ".join(points)


def starfruit_svg(variant: int) -> str:
    """Draw four unmistakable carambola views without a network asset.

    A five-point star by itself teaches the child the wrong object.  These
    scenes use the fruit's long ridged body, cut cross-sections, leaves and a
    basket so the animation reads as *starfruit* rather than a star icon.
    """
    sky, ground, left, right, _ = SCENES[variant]
    defs = '''<linearGradient id="carambolaSkin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c8ef63"/><stop offset=".48" stop-color="#f8d84a"/><stop offset="1" stop-color="#e9a82e"/></linearGradient>
<linearGradient id="carambolaCut" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6a7"/><stop offset="1" stop-color="#f7c83b"/></linearGradient>'''

    def whole(cx: int, cy: int, scale: float = 1, rotation: int = 0) -> str:
        return f'''<g transform="translate({cx} {cy}) rotate({rotation}) scale({scale})">
<path d="M-150 0 C-143-34-119-54-82-56 L-25-86 L0-62 L25-86 L82-56 C119-54 143-34 150 0 C143 34 119 54 82 56 L25 86 L0 62 L-25 86 L-82 56 C-119 54-143 34-150 0Z" fill="url(#carambolaSkin)" stroke="#b47a22" stroke-width="7"/>
<path d="M-78-48 C-38-20-35 20-78 48 M-24-78 C-2-38-2 38-24 78 M24-78 C2-38 2 38 24 78 M78-48 C38-20 35 20 78 48" fill="none" stroke="#fff4a0" stroke-width="10" stroke-linecap="round" opacity=".86"/>
<path d="M-112-16 C-76-42-31-42 5-23" fill="none" stroke="#fffbd0" stroke-width="8" stroke-linecap="round" opacity=".72"/>
<path d="M-139 0 L-165-23" stroke="#5b8e45" stroke-width="10" stroke-linecap="round"/>
<path d="M-166-23 C-197-43-214-38-227-18 C-200-17-182-8-168 7" fill="#58a85e" stroke="#397947" stroke-width="6"/>
</g>'''

    def slice_view(cx: int, cy: int, radius: int, rotation: int = 0) -> str:
        points = star_points(cx, cy, radius, radius * .44, -90 + rotation)
        inner = star_points(cx, cy, radius * .72, radius * .30, -90 + rotation)
        seeds = ''.join(f'<ellipse cx="{cx + dx}" cy="{cy + dy}" rx="5" ry="9" fill="#a87727" transform="rotate({rotation} {cx + dx} {cy + dy})"/>' for dx, dy in [(-16,-16),(17,-10),(-12,18),(18,18),(0,0)])
        return f'''<g filter="url(#shadow)"><polygon points="{points}" fill="url(#carambolaCut)" stroke="#c58a2a" stroke-width="8"/><polygon points="{inner}" fill="#fff6b2" opacity=".84"/>{seeds}</g>'''

    if variant == 0:
        object_art = f'''<ellipse cx="320" cy="387" rx="188" ry="28" fill="#344875" fill-opacity=".18"/>{whole(320,238,1.02,-4)}'''
    elif variant == 1:
        object_art = f'''<ellipse cx="330" cy="385" rx="198" ry="30" fill="#344875" fill-opacity=".16"/>{whole(430,250,.62,12)}{slice_view(205,225,105,-8)}{slice_view(245,350,58,7)}{slice_view(405,355,62,-12)}'''
    elif variant == 2:
        object_art = f'''<path d="M76 348 C182 301 269 315 331 346 C407 383 483 350 566 292" fill="none" stroke="#7a4d2e" stroke-width="17" stroke-linecap="round"/>
<path d="M150 322 C117 274 78 282 54 316 C103 316 129 335 157 357 M448 348 C474 296 511 288 545 314 C506 328 480 349 461 372" fill="#63b965" stroke="#3b8b4b" stroke-width="7"/>{whole(295,210,.68,-15)}{whole(438,294,.47,11)}'''
    else:
        object_art = f'''<rect x="86" y="305" width="468" height="80" rx="40" fill="#b77a3e" stroke="#8f5b2e" stroke-width="7"/>{whole(218,238,.58,-10)}{whole(373,236,.62,8)}{whole(470,258,.45,-12)}{slice_view(316,340,60,4)}'''
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{sky}"/><stop offset="1" stop-color="{ground}"/></linearGradient><filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="16" stdDeviation="8" flood-color="#344875" flood-opacity=".28"/></filter>{defs}</defs>
<rect width="640" height="480" rx="42" fill="url(#bg)"/>
<circle cx="92" cy="90" r="54" fill="#fff" fill-opacity=".32"/><circle cx="552" cy="108" r="34" fill="#fff" fill-opacity=".28"/>
<text x="94" y="142" text-anchor="middle" font-size="52">{left}</text><text x="546" y="388" text-anchor="middle" font-size="52">{right}</text>
<g filter="url(#shadow)">{object_art}</g>
<path d="M62 406 Q150 368 230 405 T398 405 T578 406" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="8" stroke-linecap="round"/>
</svg>'''


# The downloadable gallery is kept for entries that already have four real
# raster photos.  Some of the less common fruits have no local source because
# network access is unavailable in the build environment.  Give those entries
# a subject-specific illustrated gallery instead of repeating one emoji on
# four coloured backgrounds.  Each profile below describes the fruit body;
# ``fruit_scene`` then changes the view (whole, cut, branch, basket).
FRUIT_PROFILES = {
    "apricot": ("stone", "#ffad52", "#d66b2c", "#5b9e4d"),
    "raspberry": ("berry", "#d83160", "#9f1747", "#4b9a55"),
    "blueberry": ("berry", "#6688dc", "#394f9f", "#4b8f62"),
    "blackberry": ("berry", "#583a91", "#30215e", "#4b8f62"),
    "passionfruit": ("seed", "#9e4fbd", "#632b83", "#4b9755"),
    "dragonfruit": ("dragon", "#f06493", "#c72d68", "#4a9d5a"),
    "jackfruit": ("spiky", "#9fc34d", "#5c8e2b", "#4c9956"),
    "durian": ("durian", "#9daf43", "#62752b", "#467e4d"),
    "olive": ("olive", "#819b46", "#3f5f2a", "#518e50"),
    "quince": ("stone", "#f5c94d", "#bf8c24", "#5b9e4d"),
    "mulberry": ("berry", "#7f3b91", "#4c235c", "#4b8f62"),
    "nectarine": ("stone", "#f07d43", "#b9362c", "#55964d"),
    "gooseberry": ("berry", "#a7d75a", "#5f9b31", "#4b9557"),
    "pineapple": ("pineapple", "#f2ad42", "#c66c25", "#4e9b55"),
    "lemon": ("citrus", "#f5d548", "#c49c1f", "#4b9b53"),
    "pomegranate": ("pomegranate", "#d94749", "#8e2636", "#4a8f52"),
    "date": ("date", "#8e543a", "#4c2a25", "#4b8f52"),
    "coconut": ("coconut", "#8b5b45", "#573525", "#4b8f52"),
    "avocado": ("avocado", "#69a94f", "#35713c", "#4b9355"),
    "papaya": ("papaya", "#f39443", "#c4572b", "#4b9252"),
    "guava": ("guava", "#96bd62", "#5d8b3d", "#4b9355"),
    "mandarin": ("citrus", "#f39a35", "#bd6021", "#4b9652"),
    "persimmon": ("stone", "#f18434", "#b64924", "#4b9252"),
    "lychee": ("lychee", "#ef8e8a", "#b84e5f", "#4b9355"),
    "rambutan": ("rambutan", "#e96055", "#a92f3b", "#4b9355"),
    "currant": ("berry", "#aa334d", "#711e3a", "#4b9355"),
    "elderberry": ("berry", "#4e4a93", "#2e2b62", "#4b9355"),
    "jujube": ("date", "#a86143", "#5a302b", "#4b9355"),
    "medlar": ("stone", "#c38c55", "#80542d", "#4b9355"),
    "loquat": ("stone", "#efb449", "#bd7226", "#4b9355"),
    # A few downloaded sets contained non-fruit subjects (for example kiwi
    # birds and cherry fruit flies).  Prefer a clear local fruit illustration
    # until verified photo sources can be added.
    "cantaloupe": ("stone", "#f0b34e", "#a96c24", "#4b9653"),
    "cherry": ("berry", "#d9364e", "#8f213b", "#4b9355"),
    "cranberry": ("berry", "#c43d4f", "#7d1f36", "#4b9355"),
    "fig": ("seed", "#8a4c91", "#4d285c", "#4b9355"),
    "kiwi": ("stone", "#79a844", "#4d742d", "#4b9355"),
}

FORCE_ILLUSTRATED = {"cantaloupe", "cherry", "cranberry", "fig", "kiwi"}


def _fruit_whole(kind: str, color: str, dark: str, leaf: str, *, scale: float = 1, rotation: int = 0, cut: bool = False) -> str:
    """Return one subject-specific fruit drawing for the fallback gallery."""
    if kind == "berry":
        berries = ''.join(
            f'<circle cx="{x}" cy="{y}" r="{r}" fill="{color}" stroke="{dark}" stroke-width="6"/>'
            for x, y, r in [(267, 245, 42), (322, 218, 50), (377, 246, 43), (292, 297, 42), (350, 300, 43)]
        )
        highlight = '<circle cx="307" cy="211" r="10" fill="#fff" fill-opacity=".55"/>'
        return f'<g transform="rotate({rotation} 320 260) scale({scale})">{berries}{highlight}<path d="M315 177 Q300 143 269 153" fill="none" stroke="{leaf}" stroke-width="12" stroke-linecap="round"/></g>'
    if kind in {"stone", "citrus"}:
        body = f'<ellipse cx="320" cy="253" rx="108" ry="88" fill="{color}" stroke="{dark}" stroke-width="8"/>'
        if kind == "citrus" or cut:
            body += f'<ellipse cx="320" cy="253" rx="78" ry="68" fill="#fff4bd" stroke="{dark}" stroke-width="5"/>'
            body += ''.join(f'<path d="M320 253 L{320 + dx} {253 + dy}" stroke="{color}" stroke-width="5" stroke-linecap="round"/>' for dx, dy in [(0,-58),(51,-30),(56,31),(0,58),(-55,30),(-51,-30)])
        else:
            body += '<path d="M267 215 Q308 181 354 198" fill="none" stroke="#fff3ab" stroke-width="13" stroke-linecap="round" opacity=".8"/>'
        return f'<g transform="rotate({rotation} 320 253) scale({scale})">{body}<path d="M320 169 C334 144 356 139 374 153" fill="none" stroke="{leaf}" stroke-width="11" stroke-linecap="round"/></g>'
    if kind == "seed":
        shell = f'<circle cx="320" cy="250" r="105" fill="{color}" stroke="{dark}" stroke-width="9"/>'
        inside = '<circle cx="320" cy="250" r="77" fill="#ffd78e" stroke="#f6e3b0" stroke-width="7"/>'
        seeds = ''.join(f'<circle cx="{320 + dx}" cy="{250 + dy}" r="7" fill="#8e4339"/>' for dx, dy in [(-35,-32),(0,-43),(35,-28),(-46,5),(-11,-1),(27,5),(-28,36),(8,33),(42,34)])
        return f'<g transform="rotate({rotation} 320 250) scale({scale})">{shell}{inside}{seeds}</g>'
    if kind == "dragon":
        scales = ''.join(f'<path d="M{250 + i * 24} {190 + (i % 2) * 18} l-22-24 l6 35 l-24 17 l35-4" fill="#5cab61" stroke="#43864c" stroke-width="4"/>' for i in range(6))
        return f'<g transform="rotate({rotation} 320 250) scale({scale})"><ellipse cx="320" cy="250" rx="116" ry="83" fill="{color}" stroke="{dark}" stroke-width="9"/>{scales}<ellipse cx="285" cy="222" rx="19" ry="12" fill="#fff" fill-opacity=".5"/></g>'
    if kind in {"spiky", "durian"}:
        spikes = ''.join(f'<path d="M{220 + i * 33} 178 l16-38 l16 38" fill="{color}" stroke="{dark}" stroke-width="6"/>' for i in range(7))
        return f'<g transform="rotate({rotation} 320 250) scale({scale})"><ellipse cx="320" cy="260" rx="122" ry="83" fill="{color}" stroke="{dark}" stroke-width="8"/>{spikes}<path d="M268 226 Q314 191 364 210" fill="none" stroke="#e7ea94" stroke-width="10" stroke-linecap="round"/></g>'
    if kind == "pineapple":
        leaves = '<path d="M320 174 C283 125 289 96 302 77 C318 115 331 124 331 172 M334 171 C347 116 373 97 391 92 C377 132 362 149 354 179 M309 171 C266 145 239 143 220 153 C251 178 274 184 304 188" fill="#62ad55" stroke="#3e8747" stroke-width="7"/>'
        body = f'<ellipse cx="320" cy="269" rx="92" ry="119" fill="{color}" stroke="{dark}" stroke-width="9"/>'
        diamonds = ''.join(f'<path d="M{260 + col * 30} {190 + row * 32} l12 12 l-12 12 l-12-12Z" fill="#f7d66e" opacity=".9"/>' for row in range(4) for col in range(3))
        return f'<g transform="rotate({rotation} 320 260) scale({scale})">{leaves}{body}{diamonds}</g>'
    if kind == "pomegranate":
        arils = ''.join(f'<circle cx="{320 + dx}" cy="{250 + dy}" r="8" fill="#ffb26e"/>' for dx, dy in [(-35,-35),(0,-42),(35,-30),(-43,0),(-12,-3),(24,3),(45,12),(-30,34),(4,33),(32,38)])
        return f'<g transform="rotate({rotation} 320 250) scale({scale})"><circle cx="320" cy="250" r="103" fill="{color}" stroke="{dark}" stroke-width="9"/>{arils}<path d="M287 164 Q320 140 353 164 L340 183 L320 174 L300 183Z" fill="{leaf}"/></g>'
    if kind == "date":
        return f'<g transform="rotate({rotation} 320 250) scale({scale})"><ellipse cx="320" cy="250" rx="68" ry="112" fill="{color}" stroke="{dark}" stroke-width="8"/><path d="M285 180 Q324 215 300 310" fill="none" stroke="#d99962" stroke-width="9" stroke-linecap="round" opacity=".6"/><path d="M320 144 Q337 125 357 132" fill="none" stroke="{leaf}" stroke-width="11" stroke-linecap="round"/></g>'
    if kind == "coconut":
        return f'<g transform="rotate({rotation} 320 250) scale({scale})"><circle cx="320" cy="250" r="103" fill="{color}" stroke="{dark}" stroke-width="10"/><circle cx="320" cy="250" r="74" fill="#fff3d2" stroke="#d4b782" stroke-width="6"/><circle cx="292" cy="225" r="8" fill="#60412c"/><circle cx="320" cy="214" r="8" fill="#60412c"/><circle cx="347" cy="226" r="8" fill="#60412c"/></g>'
    if kind == "avocado":
        return f'<g transform="rotate({rotation} 320 250) scale({scale})"><path d="M320 145 C251 150 220 215 239 282 C256 341 307 357 354 321 C394 290 405 222 371 174 C358 156 341 146 320 145Z" fill="{color}" stroke="{dark}" stroke-width="9"/><path d="M320 169 C278 175 263 223 275 272 C287 313 320 325 349 296 C374 270 379 222 355 187 C346 175 334 169 320 169Z" fill="#fff0a5"/><circle cx="329" cy="273" r="32" fill="#9b633c" stroke="#704226" stroke-width="7"/></g>'
    if kind == "papaya":
        seeds = ''.join(f'<circle cx="{300 + (i % 3) * 18}" cy="{224 + (i // 3) * 22}" r="6" fill="#7d3b2c"/>' for i in range(9))
        return f'<g transform="rotate({rotation} 320 250) scale({scale})"><path d="M320 140 C274 151 256 199 261 258 C267 319 298 351 333 332 C370 311 392 256 375 205 C362 164 343 143 320 140Z" fill="{color}" stroke="{dark}" stroke-width="9"/><ellipse cx="320" cy="245" rx="50" ry="72" fill="#ffd978"/>{seeds}</g>'
    if kind == "guava":
        return f'<g transform="rotate({rotation} 320 250) scale({scale})"><ellipse cx="320" cy="250" rx="108" ry="90" fill="{color}" stroke="{dark}" stroke-width="9"/><ellipse cx="320" cy="250" rx="79" ry="63" fill="#f8a3a0" stroke="#d46a66" stroke-width="6"/>{''.join(f'<circle cx="{320 + dx}" cy="{250 + dy}" r="5" fill="#6d4b37"/>' for dx, dy in [(-28,-20),(0,-28),(29,-18),(-38,12),(-8,7),(22,13),(-20,34),(12,31)])}</g>'
    if kind in {"lychee", "rambutan"}:
        hairs = ''.join(f'<path d="M{320 + dx} {250 + dy} l{dx // 2} {dy // 2}" stroke="{dark}" stroke-width="5" stroke-linecap="round"/>' for dx, dy in [(-70,-56),(-30,-88),(18,-88),(63,-52),(-90,0),(85,10),(-55,66),(10,85),(63,59)]) if kind == "rambutan" else ''
        return f'<g transform="rotate({rotation} 320 250) scale({scale})">{hairs}<circle cx="320" cy="250" r="96" fill="{color}" stroke="{dark}" stroke-width="9"/><path d="M272 204 Q316 173 357 193" fill="none" stroke="#ffc1a7" stroke-width="10" stroke-linecap="round" opacity=".7"/></g>'
    if kind == "olive":
        return f'<g transform="rotate({rotation} 320 250) scale({scale})"><ellipse cx="272" cy="240" rx="44" ry="67" fill="{color}" stroke="{dark}" stroke-width="7"/><ellipse cx="326" cy="264" rx="44" ry="67" fill="{color}" stroke="{dark}" stroke-width="7"/><ellipse cx="378" cy="230" rx="44" ry="67" fill="{color}" stroke="{dark}" stroke-width="7"/><path d="M326 169 Q335 137 359 128" fill="none" stroke="{leaf}" stroke-width="10" stroke-linecap="round"/></g>'
    return f'<g transform="rotate({rotation} 320 250) scale({scale})"><ellipse cx="320" cy="250" rx="105" ry="82" fill="{color}" stroke="{dark}" stroke-width="8"/></g>'


def fruit_scene(english: str, variant: int) -> str:
    kind, color, dark, leaf = FRUIT_PROFILES.get(english, ("stone", "#f2a34c", "#a85f29", "#4b9555"))
    if variant == 0:
        return f'<ellipse cx="320" cy="390" rx="175" ry="28" fill="#344875" fill-opacity=".18"/>{_fruit_whole(kind, color, dark, leaf, scale=1.0, rotation=-5)}'
    if variant == 1:
        return f'{_fruit_whole(kind, color, dark, leaf, scale=.64, rotation=10, cut=True)}<g transform="translate(-105 85) scale(.48)">{_fruit_whole(kind, color, dark, leaf, cut=True)}</g><g transform="translate(105 93) scale(.48)">{_fruit_whole(kind, color, dark, leaf, cut=True, rotation=-12)}</g>'
    if variant == 2:
        return f'''<path d="M74 354 C170 306 254 318 330 347 C409 377 487 350 566 296" fill="none" stroke="#7b5131" stroke-width="17" stroke-linecap="round"/>
<path d="M158 326 C124 284 89 286 62 316 C109 319 133 336 157 357 M447 348 C472 302 510 292 544 313 C508 329 482 349 461 373" fill="{leaf}" stroke="#3b8648" stroke-width="7"/>{_fruit_whole(kind, color, dark, leaf, scale=.68, rotation=-12)}{_fruit_whole(kind, color, dark, leaf, scale=.46, rotation=12)}'''
    return f'''<rect x="86" y="307" width="468" height="79" rx="40" fill="#b7793f" stroke="#8e592c" stroke-width="7"/>{_fruit_whole(kind, color, dark, leaf, scale=.55, rotation=-10)}<g transform="translate(142 0)">{_fruit_whole(kind, color, dark, leaf, scale=.55, rotation=8)}</g><g transform="translate(70 92)">{_fruit_whole(kind, color, dark, leaf, scale=.38, rotation=-14, cut=True)}</g>'''


def safe_slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-") or "item"


def extract_items() -> list[dict]:
    source = SOURCE.read_text(encoding="utf-8")
    pattern = re.compile(
        r"makeCategory\('([^']*)',\s*'[^']*',\s*'([^']*)',\s*'([^']*)',",
        re.DOTALL,
    )
    result = []
    for category, match in enumerate(pattern.finditer(source), start=1):
        prompt = match.group(2)
        for raw in match.group(3).split(";"):
            parts = raw.split("|")
            if len(parts) < 3 or not parts[2].strip():
                continue
            result.append(
                {
                    "category": category,
                    "prompt": prompt,
                    "emoji": parts[0],
                    "english": parts[2].strip(),
                }
            )
    return result


def svg_for(item: dict, variant: int) -> str:
    if item["english"] == "starfruit":
        return starfruit_svg(variant)

    sky, ground, left, right, _ = SCENES[variant]
    prop_left, prop_right = PROMPT_PROPS.get(item["prompt"], (left, right))
    pose = POSES[variant]
    x = pose["x"]
    y = pose["y"]
    size = pose["size"]
    rotation = pose["rotation"]

    # Each pose has different object-focused foreground art.  This is kept
    # generic so it works for all nine categories, while the category props
    # still make fruit, vehicles, clothing, food, and nature feel distinct.
    if pose["frame"] == "plate":
        foreground = '''<ellipse cx="320" cy="381" rx="174" ry="30" fill="#fff" fill-opacity=".72" stroke="#d4dfff" stroke-width="7"/>
<path d="M170 378 Q320 428 470 378" fill="none" stroke="#8aa1d8" stroke-width="8" stroke-linecap="round"/>'''
    elif pose["frame"] == "close":
        foreground = '''<circle cx="268" cy="228" r="130" fill="#fff" fill-opacity=".38" stroke="#fff" stroke-width="11"/>
<path d="M400 120 L505 120 L505 225" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".78"/>
<circle cx="474" cy="174" r="18" fill="#fff" fill-opacity=".8"/>'''
    elif pose["frame"] == "branch":
        foreground = '''<path d="M72 360 C176 309 245 315 320 346 C396 377 475 355 568 300" fill="none" stroke="#8a5a38" stroke-width="16" stroke-linecap="round"/>
<path d="M166 325 C133 286 105 285 77 313 C117 319 142 334 163 354" fill="#64b862" stroke="#3c9149" stroke-width="7"/>
<path d="M437 349 C471 302 504 292 536 311 C503 327 480 348 460 371" fill="#75c96a" stroke="#3c9149" stroke-width="7"/>'''
    else:
        foreground = '''<rect x="92" y="88" width="456" height="308" rx="46" fill="#fff" fill-opacity=".56" stroke="#fff" stroke-width="9"/>
<path d="M134 120 L196 120 M134 120 L134 182 M506 120 L444 120 M506 120 L506 182 M134 364 L196 364 M134 364 L134 302 M506 364 L444 364 M506 364 L506 302" fill="none" stroke="#8a9ee0" stroke-width="9" stroke-linecap="round"/>'''

    is_fruit_fallback = item["category"] == 2 and item["english"] in FRUIT_PROFILES
    if is_fruit_fallback:
        # Do not render the generic emoji at all for these entries.  The
        # subject-specific illustration changes from whole fruit to cut
        # fruit, branch, and basket views, which gives the child useful visual
        # evidence instead of four copies of the same glyph.
        subject = f'<g filter="url(#shadow)">{fruit_scene(item["english"], variant)}</g>'
        scene = ""
    else:
        # Add a second, smaller view only as a visual cue; the large transformed
        # subject remains the unmistakable object the child is learning.
        subject = f'<g transform="rotate({rotation} {x} {y})" filter="url(#shadow)"><text x="{x}" y="{y}" text-anchor="middle" dominant-baseline="middle" font-size="{size}">{item["emoji"]}</text></g>\n'
        subject += f'<text x="{560 if variant % 2 == 0 else 92}" y="{variant * 28 + 170}" text-anchor="middle" dominant-baseline="middle" font-size="62" opacity=".72">{item["emoji"]}</text>'
        scene = foreground
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{sky}"/><stop offset="1" stop-color="{ground}"/></linearGradient><filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="16" stdDeviation="8" flood-color="#344875" flood-opacity=".28"/></filter></defs>
<rect width="640" height="480" rx="42" fill="url(#bg)"/>
<circle cx="92" cy="90" r="54" fill="#fff" fill-opacity=".32"/><circle cx="552" cy="108" r="34" fill="#fff" fill-opacity=".28"/>
<text x="94" y="142" text-anchor="middle" font-size="52">{prop_left}</text><text x="546" y="388" text-anchor="middle" font-size="52">{prop_right}</text>
{scene}
{subject}
<path d="M62 406 Q150 368 230 405 T398 405 T578 406" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="8" stroke-linecap="round"/>
</svg>'''


def restore_real_gallery(item: dict, existing: dict) -> list[str]:
    """Recover complete real-photo sets from the previous production build."""
    source_folder = ROOT / "dist" / "images" / "gallery" / str(item["category"])
    if not source_folder.exists():
        return []
    slug = safe_slug(item["english"])
    candidates = {
        path.stem.rsplit("-", 1)[1]: path
        for path in source_folder.glob(f"{slug}-*")
        if path.is_file() and path.suffix.lower() != ".svg" and path.stem.rsplit("-", 1)[-1].isdigit()
    }
    if sorted(candidates) != ["1", "2", "3", "4"]:
        return []
    destination_folder = OUTPUT_ROOT / str(item["category"])
    destination_folder.mkdir(parents=True, exist_ok=True)
    images = []
    for variant in range(1, 5):
        source = candidates[str(variant)]
        destination = destination_folder / source.name
        shutil.copy2(source, destination)
        images.append("/" + destination.relative_to(ROOT / "public").as_posix())
    return images


def main() -> None:
    try:
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        manifest = {}

    referenced = {
        path.lstrip("/")
        for category in manifest.values()
        for entry in category.values()
        for path in entry.get("images", [])
    }
    # Keep the animal gallery untouched; it is owned by the WebP animation
    # path. Clean only stale partial files in the nine new gallery folders.
    if OUTPUT_ROOT.exists():
        for folder in OUTPUT_ROOT.iterdir():
            if folder.is_dir() and folder.name != "1":
                for stale in folder.iterdir():
                    if stale.is_file() and stale.relative_to(ROOT).as_posix() not in referenced:
                        stale.unlink(missing_ok=True)

    for item in extract_items():
        if item["category"] == 1:
            continue
        category_key = str(item["category"])
        category_manifest = manifest.setdefault(category_key, {})
        slug = safe_slug(item["english"])
        existing = category_manifest.get(item["english"], {})
        existing_images = existing.get("images", [])
        force_illustrated = item["category"] == 2 and item["english"] in FORCE_ILLUSTRATED
        real_images = [] if force_illustrated else restore_real_gallery(item, existing)
        if real_images:
            category_manifest[item["english"]] = {
                "images": real_images,
                "sources": existing.get("sources", [{"source": "local photo gallery"}]),
                "query": existing.get("query", item["english"]),
            }
            continue
        if len(existing_images) == 4 and all((ROOT / "public" / path.lstrip("/")).exists() for path in existing_images):
            if not all(path.lower().endswith(".svg") for path in existing_images):
                continue
            # SVG fallbacks are regenerated on every run so improvements to
            # the four illustrated poses replace the old background-only set.

        folder = OUTPUT_ROOT / category_key
        folder.mkdir(parents=True, exist_ok=True)
        # A rate-limited download can leave one or two partial photos behind.
        # Remove only this item's incomplete variants before writing the local
        # four-frame fallback so the manifest never points at broken files.
        for partial in folder.glob(f"{slug}-*"):
            partial.unlink(missing_ok=True)
        images = []
        for variant in range(4):
            relative = Path("public") / "images" / "gallery" / category_key / f"{slug}-{variant + 1}.svg"
            destination = ROOT / relative
            destination.write_text(svg_for(item, variant), encoding="utf-8")
            images.append("/" + relative.relative_to("public").as_posix())
        category_manifest[item["english"]] = {
            "images": images,
            "sources": [{"source": "local illustrated fallback"}],
            "query": existing.get("query", item["english"]),
        }

    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
