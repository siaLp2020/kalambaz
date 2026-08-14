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
    """Draw four genuinely different starfruit views without a network asset."""
    sky, ground, left, right, _ = SCENES[variant]
    if variant == 0:
        object_art = f'''<ellipse cx="320" cy="390" rx="174" ry="27" fill="#344875" fill-opacity=".18"/>
<polygon points="{star_points(320,238,142,58,-90)}" fill="#ffd447" stroke="#e49b24" stroke-width="9"/>
<polygon points="{star_points(291,205,42,17,-90)}" fill="#fff0a8" opacity=".82"/>
<path d="M320 108 C350 82 382 91 397 113 C369 113 348 125 331 145" fill="none" stroke="#3e9b55" stroke-width="14" stroke-linecap="round"/>'''
    elif variant == 1:
        object_art = f'''<circle cx="270" cy="228" r="119" fill="#ffffff" fill-opacity=".62" stroke="#ffffff" stroke-width="10"/>
<polygon points="{star_points(270,228,102,42,-90)}" fill="#ffe15b" stroke="#e49b24" stroke-width="8"/>
<polygon points="{star_points(423,310,64,26,-90)}" fill="#ffca3a" stroke="#e49b24" stroke-width="7"/>
<polygon points="{star_points(174,345,48,19,-90)}" fill="#ffd95b" stroke="#e49b24" stroke-width="6"/>
<path d="M213 204 L327 260 M218 264 L318 196" stroke="#fff4b1" stroke-width="9" stroke-linecap="round" opacity=".9"/>'''
    elif variant == 2:
        object_art = f'''<path d="M95 351 C176 297 258 318 326 345 C398 373 473 348 548 298" fill="none" stroke="#7c522f" stroke-width="17" stroke-linecap="round"/>
<path d="M177 320 C139 276 107 284 82 314 C121 318 145 334 168 354" fill="#64bb66" stroke="#3f8f4c" stroke-width="7"/>
<polygon points="{star_points(328,218,136,56,-90)}" fill="#ffc83d" stroke="#df8f22" stroke-width="9"/>
<polygon points="{star_points(462,319,61,25,-90)}" fill="#ffe36b" stroke="#df8f22" stroke-width="7"/>
<circle cx="303" cy="188" r="16" fill="#fff6b4" opacity=".86"/>'''
    else:
        object_art = f'''<rect x="95" y="94" width="450" height="300" rx="44" fill="#ffffff" fill-opacity=".68" stroke="#ffffff" stroke-width="8"/>
<polygon points="{star_points(320,238,118,49,-90)}" fill="#ffd13f" stroke="#df8f22" stroke-width="9"/>
<polygon points="{star_points(193,330,54,23,-90)}" fill="#ffe478" stroke="#df8f22" stroke-width="7"/>
<polygon points="{star_points(446,331,54,23,-90)}" fill="#ffbd37" stroke="#df8f22" stroke-width="7"/>
<path d="M273 126 Q320 100 367 126" fill="none" stroke="#fff7c8" stroke-width="11" stroke-linecap="round"/>'''
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{sky}"/><stop offset="1" stop-color="{ground}"/></linearGradient><filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="16" stdDeviation="8" flood-color="#344875" flood-opacity=".28"/></filter></defs>
<rect width="640" height="480" rx="42" fill="url(#bg)"/>
<circle cx="92" cy="90" r="54" fill="#fff" fill-opacity=".32"/><circle cx="552" cy="108" r="34" fill="#fff" fill-opacity=".28"/>
<text x="94" y="142" text-anchor="middle" font-size="52">{left}</text><text x="546" y="388" text-anchor="middle" font-size="52">{right}</text>
<g filter="url(#shadow)">{object_art}</g>
<path d="M62 406 Q150 368 230 405 T398 405 T578 406" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="8" stroke-linecap="round"/>
</svg>'''


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

    # Add a second, smaller view only as a visual cue; the large transformed
    # subject remains the unmistakable object the child is learning.
    mini = f'<text x="{560 if variant % 2 == 0 else 92}" y="{variant * 28 + 170}" text-anchor="middle" dominant-baseline="middle" font-size="62" opacity=".72">{item["emoji"]}</text>'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{sky}"/><stop offset="1" stop-color="{ground}"/></linearGradient><filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="16" stdDeviation="8" flood-color="#344875" flood-opacity=".28"/></filter></defs>
<rect width="640" height="480" rx="42" fill="url(#bg)"/>
<circle cx="92" cy="90" r="54" fill="#fff" fill-opacity=".32"/><circle cx="552" cy="108" r="34" fill="#fff" fill-opacity=".28"/>
<text x="94" y="142" text-anchor="middle" font-size="52">{prop_left}</text><text x="546" y="388" text-anchor="middle" font-size="52">{prop_right}</text>
{foreground}
<g transform="rotate({rotation} {x} {y})" filter="url(#shadow)"><text x="{x}" y="{y}" text-anchor="middle" dominant-baseline="middle" font-size="{size}">{item['emoji']}</text></g>
{mini}
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
        real_images = restore_real_gallery(item, existing)
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
