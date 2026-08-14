from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
import mimetypes
import re
import time
from pathlib import Path
from urllib.parse import quote, urlencode
from urllib.error import HTTPError
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src" / "main.jsx"
MANIFEST_PATH = ROOT / "src" / "gallery-manifest.json"
OUTPUT_ROOT = ROOT / "public" / "images" / "gallery"
API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "KalamBazGallery/1.0 (educational game asset downloader)"
QUERY_SUFFIXES = {
    "میوه": "fruit",
    "رنگ": "color",
    "سبزی": "vegetable",
    "وسیله نقلیه": "vehicle",
    "لباس": "clothing",
    "عضو بدن": "human body",
    "خوراکی": "food",
    "پدیدهٔ طبیعت": "nature",
    "وسیله": "object",
}


def extract_items() -> list[dict]:
    source = SOURCE.read_text(encoding="utf-8")
    pattern = re.compile(
        r"makeCategory\('([^']*)',\s*'[^']*',\s*'([^']*)',\s*'([^']*)',",
        re.DOTALL,
    )
    result = []
    for category_index, match in enumerate(pattern.finditer(source), start=1):
        prompt = match.group(2)
        values = []
        seen = set()
        for index, raw in enumerate(match.group(3).split(";")):
            parts = raw.split("|")
            if len(parts) < 3:
                continue
            english = parts[2].strip()
            if not english or english in seen:
                continue
            seen.add(english)
            values.append(
                {
                    "category": category_index,
                    "prompt": prompt,
                    "index": index + 1,
                    "english": english,
                }
            )
        result.extend(values)
    return result


def request_json(url: str) -> dict:
    for attempt in range(3):
        try:
            request = Request(url, headers={"User-Agent": USER_AGENT})
            with urlopen(request, timeout=15) as response:
                return json.loads(response.read().decode("utf-8"))
        except HTTPError as error:
            if error.code != 429 or attempt == 4:
                raise
            time.sleep(3 + attempt * 3)
    raise RuntimeError("API retry limit reached")


def search_files(query: str) -> list[dict]:
    params = {
        "action": "query",
        "generator": "search",
        "gsrsearch": query,
        "gsrnamespace": "6",
        "gsrlimit": "20",
        "gsrwhat": "text",
        "prop": "imageinfo",
        "iiprop": "url|mime",
        "iiurlwidth": "320",
        "format": "json",
    }
    payload = request_json(f"{API}?{urlencode(params)}")
    pages = payload.get("query", {}).get("pages", {}).values()
    files = []
    seen = set()
    for page in sorted(pages, key=lambda item: item.get("index", 0)):
        info = (page.get("imageinfo") or [{}])[0]
        mime = info.get("mime", "")
        image_url = info.get("thumburl") or info.get("url")
        if not image_url or not mime.startswith("image/") or mime == "image/svg+xml":
            continue
        if image_url in seen:
            continue
        seen.add(image_url)
        files.append(
            {
                "title": page.get("title", ""),
                "pageid": page.get("pageid"),
                "url": image_url,
                "download_url": f"https://images.weserv.nl/?url={quote(image_url.split('?', 1)[0], safe='')}&w=320",
                "fallback_url": f"https://commons.m.wikimedia.org/wiki/Special:FilePath/{quote(page.get('title', '').replace('File:', '', 1), safe='')}?width=320",
                "mime": mime,
                "source": f"https://commons.wikimedia.org/?curid={page.get('pageid', '')}",
            }
        )
        if len(files) == 4:
            break
    return files


def extension(mime: str, url: str) -> str:
    guessed = mimetypes.guess_extension(mime) or Path(url.split("?", 1)[0]).suffix
    return ".jpg" if guessed in {".jpe", ".jpeg"} else (guessed or ".jpg")


def safe_slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-") or "item"


def download_bytes(urls: list[str]) -> bytes:
    last_error = None
    for url in urls:
        for attempt in range(3):
            try:
                request = Request(url, headers={"User-Agent": USER_AGENT})
                with urlopen(request, timeout=20) as response:
                    return response.read()
            except HTTPError as error:
                last_error = error
                if error.code == 404:
                    break
                if error.code != 429 or attempt == 4:
                    break
                time.sleep(3 + attempt * 3)
    if last_error:
        raise last_error
    raise RuntimeError("image download retry limit reached")


def load_manifest() -> dict:
    if not MANIFEST_PATH.exists():
        return {}
    try:
        return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def save_manifest(manifest: dict) -> None:
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def download_item(item: dict, manifest: dict, refresh: bool = False) -> None:
    category_key = str(item["category"])
    category_manifest = manifest.setdefault(category_key, {})
    english = item["english"]
    existing = category_manifest.get(english)
    if existing and not refresh and len(existing.get("images", [])) == 4:
        if all((ROOT / "public" / path.lstrip("/")).exists() for path in existing["images"]):
            return

    suffix = QUERY_SUFFIXES.get(item["prompt"], "")
    queries = [f"{item['english']} {suffix}".strip(), item["english"]]
    if item["prompt"] == "حیوان":
        queries.insert(0, f"{item['english']} animal")
    queries = list(dict.fromkeys(queries))
    files = []
    for query in queries:
        try:
            files = search_files(query)
        except Exception as error:  # keep the batch moving if one query fails
            print(f"search failed: {query}: {error}")
        if len(files) >= 4:
            break
        time.sleep(0.1)

    if len(files) < 4:
        # Keep a working gallery when a Wikimedia search is temporarily
        # incomplete or rate-limited.  An empty result must never erase the
        # existing four-frame set from the manifest.
        if not existing or len(existing.get("images", [])) != 4:
            category_manifest[english] = {"images": [], "sources": [], "query": queries[0]}
        print(f"no four images: {item['category']}/{english} ({len(files)})")
        return

    folder = OUTPUT_ROOT / category_key
    folder.mkdir(parents=True, exist_ok=True)
    if refresh and existing:
        for old_path in existing.get("images", []):
            (ROOT / "public" / old_path.lstrip("/")).unlink(missing_ok=True)
    if refresh or not existing or len(existing.get("images", [])) != 4:
        for partial in folder.glob(f"{safe_slug(english)}-*"):
            partial.unlink(missing_ok=True)
    paths = []
    sources = []
    for variant, file_info in enumerate(files, start=1):
        suffix = extension(file_info["mime"], file_info["url"])
        relative = Path("public") / "images" / "gallery" / category_key / f"{safe_slug(english)}-{variant}{suffix}"
        destination = ROOT / relative
        if not destination.exists():
            try:
                urls = [file_info.get("download_url"), file_info.get("fallback_url"), file_info["url"].split("?", 1)[0]]
                destination.write_bytes(download_bytes([url for url in urls if url]))
            except Exception as error:
                print(f"download failed: {file_info['url']}: {error}")
                paths = []
                break
        paths.append("/" + relative.relative_to("public").as_posix())
        sources.append(
            {
                "title": file_info["title"],
                "pageid": file_info["pageid"],
                "source": file_info["source"],
            }
        )
        time.sleep(0.35)
    if len(paths) == 4:
        category_manifest[english] = {"images": paths, "sources": sources, "query": queries[0]}
        print(f"saved: {item['category']}/{english}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", help="download one English item, for example monkey")
    parser.add_argument("--prompt", help="download one category prompt, for example حیوان")
    parser.add_argument("--limit", type=int, help="download only the first N items")
    parser.add_argument("--workers", type=int, default=1, help="controlled concurrent downloads")
    parser.add_argument("--refresh", action="store_true", help="replace existing four-image galleries")
    args = parser.parse_args()
    items = extract_items()
    if args.only:
        items = [item for item in items if item["english"] == args.only]
    if args.prompt:
        items = [item for item in items if item["prompt"] == args.prompt]
    if args.limit:
        items = items[: args.limit]
    manifest = load_manifest()
    if args.workers <= 1:
        for number, item in enumerate(items, start=1):
            print(f"[{number}/{len(items)}] {item['category']}/{item['english']}")
            download_item(item, manifest, args.refresh)
            save_manifest(manifest)
            time.sleep(0.5)
        return
    with ThreadPoolExecutor(max_workers=max(1, min(args.workers, 12))) as executor:
        futures = {executor.submit(download_item, item, manifest, args.refresh): item for item in items}
        for number, future in enumerate(as_completed(futures), start=1):
            item = futures[future]
            try:
                future.result()
                print(f"[{number}/{len(items)}] finished {item['category']}/{item['english']}")
            except Exception as error:
                print(f"[{number}/{len(items)}] failed {item['category']}/{item['english']}: {error}")
            save_manifest(manifest)


if __name__ == "__main__":
    main()
