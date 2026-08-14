from __future__ import annotations

import json
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
    sky, ground, left, right, rotation = SCENES[variant]
    prop_left, prop_right = PROMPT_PROPS.get(item["prompt"], (left, right))
    # Keep the object large and central. The changing scene, pose, and playful
    # props give children four distinct visual clues without printing the answer.
    object_y = 246 + (variant % 2) * 8
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{sky}"/><stop offset="1" stop-color="{ground}"/></linearGradient><filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="16" stdDeviation="8" flood-color="#344875" flood-opacity=".28"/></filter></defs>
<rect width="640" height="480" rx="42" fill="url(#bg)"/>
<circle cx="92" cy="90" r="54" fill="#fff" fill-opacity=".32"/><circle cx="552" cy="108" r="34" fill="#fff" fill-opacity=".28"/>
<text x="94" y="142" text-anchor="middle" font-size="52">{prop_left}</text><text x="546" y="388" text-anchor="middle" font-size="52">{prop_right}</text>
<ellipse cx="320" cy="391" rx="180" ry="28" fill="#344875" fill-opacity=".18"/>
<g transform="rotate({rotation} 320 {object_y})" filter="url(#shadow)"><text x="320" y="{object_y}" text-anchor="middle" dominant-baseline="middle" font-size="210">{item['emoji']}</text></g>
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
            if all(path.lower().endswith(".svg") for path in existing_images):
                category_manifest[item["english"]]["sources"] = [{"source": "local illustrated fallback"}]
            continue

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
