import asyncio
import base64
import json
import os
import re
from typing import Optional
from urllib.parse import quote_plus, urlparse

import httpx
from openai import AsyncOpenAI

from models.schemas import (
    DESIGN_STYLES,
    ISRAELI_STORES,
    ROOM_TYPES,
    STORE_DOMAINS,
    ShoppingItem,
)

OG_IMAGE_RE = re.compile(
    r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
    re.IGNORECASE,
)
TWITTER_IMAGE_RE = re.compile(
    r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']',
    re.IGNORECASE,
)

# Domains we trust for real Israeli product pages. URLs the AI returns must
# resolve to one of these — otherwise we fall back to a Google site: search.
TRUSTED_PRODUCT_DOMAINS = {
    # Major Israeli home stores
    "ikea.com", "homecenter.co.il", "ace.co.il", "keter.com",
    "ivory.co.il", "castrodesign.co.il", "habitat.co.il",
    # Marketplaces with strong product pages in Israel
    "zap.co.il", "ksp.co.il", "bug.co.il", "shufersal.co.il",
    "fox-home.co.il", "urbanika.co.il", "americanshop.co.il",
}


def build_store_search_url(store: str, query: str) -> str:
    """Fallback: Google `site:<store-domain>` search if web search fails."""
    encoded_query = quote_plus(query)
    domain = STORE_DOMAINS.get(store)
    if domain:
        return f"https://www.google.com/search?q=site%3A{domain}+{encoded_query}"
    return f"https://www.google.com/search?q={encoded_query}+{quote_plus(store)}"


def build_google_shopping_url(query: str) -> str:
    """Build a Google Shopping search URL for cross-store comparison."""
    return f"https://www.google.com/search?tbm=shop&q={quote_plus(query)}"


def _extract_product_url(text: str) -> Optional[str]:
    """Extract a single trusted product URL from a model response.

    The model is asked to return only a URL, but defensively we accept any
    text that contains one and pick the first URL whose host is a trusted
    Israeli store domain.
    """
    if not text:
        return None
    candidates = re.findall(r"https?://[^\s)\]]+", text)
    for raw in candidates:
        url = raw.rstrip(".,;:)\"'>")
        try:
            host = urlparse(url).netloc.lower().lstrip("www.")
        except ValueError:
            continue
        if any(host == d or host.endswith("." + d) for d in TRUSTED_PRODUCT_DOMAINS):
            return url
    # No trusted match — return the first URL anyway (better than nothing if it's a real product)
    if candidates:
        return candidates[0].rstrip(".,;:)\"'>")
    return None

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


async def analyze_and_generate_design(
    images_base64: list[str],
    room_type: str,
    style: str,
    budget_nis: int,
) -> tuple[str, str, str]:
    """
    Returns (analysis, redesign_local_path, design_brief)
    Step 1: GPT-4o Vision analyzes the image(s) and produces a redesign brief.
    Step 2: gpt-image-1 takes the FIRST image and edits it img2img-style —
            preserving the room's actual layout, walls, windows, and perspective.

    redesign_local_path is the relative path under /uploads (e.g. "redesigns/abc.png").
    """
    style_info = DESIGN_STYLES.get(style, DESIGN_STYLES["modern"])
    room_label = ROOM_TYPES.get(room_type, room_type)
    style_label = style_info["label"]

    is_video = len(images_base64) > 1
    source_note = (
        f"You are looking at {len(images_base64)} frames from a video walkthrough of the same room — "
        "use ALL frames together to build a 3D understanding of the layout, dimensions, and existing items."
        if is_video
        else "You are looking at a single photo of the room."
    )

    analysis_prompt = f"""You are an expert interior designer. Analyze this {room_label}.

{source_note}

The client wants a redesign in {style_label} style ({style_info['description']}).
Budget: ₪{budget_nis:,} NIS.

Return a JSON object with exactly these fields:
{{
  "analysis": "Brief description of the current room — its layout, lighting, key items (2-3 sentences in Hebrew)",
  "design_brief": "Detailed English prompt describing the REDESIGN. Keep the SAME room layout, walls, windows, ceiling height, and floor — only change furniture, colors, materials, lighting fixtures, and decor to match the new style. Be specific about colors, materials, textures.",
  "key_changes": ["change 1 in Hebrew", "change 2", "change 3", "change 4", "change 5"]
}}

Return only valid JSON, no markdown."""

    image_messages = [
        {
            "type": "image_url",
            "image_url": {
                "url": f"data:image/jpeg;base64,{img}",
                "detail": "high",
            },
        }
        for img in images_base64
    ]

    vision_response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": analysis_prompt},
                    *image_messages,
                ],
            }
        ],
        max_tokens=1000,
        response_format={"type": "json_object"},
    )

    raw = vision_response.choices[0].message.content
    data = json.loads(raw)

    analysis = data.get("analysis", "")
    design_brief = data.get("design_brief", "")

    # img2img with gpt-image-1: pass the first frame as the input image,
    # the model will keep the room's structure and only restyle.
    edit_prompt = (
        f"Redesign this room in {style_label} style. "
        f"{design_brief} "
        "CRITICAL: keep the exact same room layout, walls, windows, doorways, ceiling, and floor plan. "
        "Only change the furniture, decor, lighting fixtures, wall colors, and materials. "
        "Photorealistic interior photography, professional lighting, no people, no text, no watermarks."
    )

    first_frame_bytes = base64.b64decode(images_base64[0])

    image_response = await client.images.edit(
        model="gpt-image-1",
        image=("room.jpg", first_frame_bytes, "image/jpeg"),
        prompt=edit_prompt[:4000],
        size="1536x1024",
        n=1,
    )

    redesign_b64 = image_response.data[0].b64_json
    redesign_bytes = base64.b64decode(redesign_b64)

    from services.storage_service import save_redesign_bytes
    redesign_path = save_redesign_bytes(redesign_bytes)

    return analysis, redesign_path, design_brief


async def generate_shopping_list(
    design_brief: str,
    room_type: str,
    style: str,
    budget_nis: int,
) -> list[ShoppingItem]:
    """
    Uses GPT-4o to generate a shopping list with Israeli stores and NIS prices.
    """
    style_info = DESIGN_STYLES.get(style, DESIGN_STYLES["modern"])
    room_label = ROOM_TYPES.get(room_type, room_type)
    style_label = style_info["label"]

    stores_list = "\n".join(
        f"- {name}: {url}" for name, url in ISRAELI_STORES.items()
    )

    shopping_prompt = f"""You are an expert interior designer and Israeli shopping advisor.

Design brief: {design_brief}
Room: {room_label}
Style: {style_label}
Total budget: ₪{budget_nis:,} NIS

Israeli stores available:
{stores_list}

Create a realistic shopping list for this redesign. Return a JSON object:
{{
  "items": [
    {{
      "name": "Product name in Hebrew (specific, like 'ספה תלת מושבית אפורה')",
      "description": "Short description in Hebrew (1 sentence)",
      "category": "furniture | lighting | decor | textiles | plants | storage | tools",
      "store": "Store name from the list above",
      "search_query": "Short Hebrew search query (2-4 words, descriptive — like 'ספה אפורה תלת מושבית' or 'מנורת תקרה לדים')",
      "estimated_price_nis": 1200,
      "priority": "essential | recommended | optional"
    }}
  ]
}}

Rules:
- 8-14 items total
- 3-4 essential items (must-haves for the design)
- 3-4 recommended items (important but not critical)
- 2-4 optional items (nice to have)
- Prices must be realistic for Israeli market in NIS
- essential items total should fit within budget
- Match items to the {style_label} style
- search_query MUST be specific enough to find the actual product (include color/material/size when relevant)
- Return only valid JSON, no markdown"""

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": shopping_prompt}],
        max_tokens=2000,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content
    data = json.loads(raw)

    raw_items = data.get("items", [])

    # For each item, do a real web search (in parallel) to find a specific product URL.
    # Falls back to Google site: search if the web search fails.
    product_urls = await asyncio.gather(
        *[
            find_product_url(
                name=it.get("name", ""),
                description=it.get("description", ""),
                store=it.get("store", "IKEA Israel"),
                search_query=it.get("search_query") or it.get("name", ""),
            )
            for it in raw_items
        ],
        return_exceptions=True,
    )

    # Fetch og:image for each found URL in parallel (best-effort)
    image_urls = await asyncio.gather(
        *[fetch_product_image(u if not isinstance(u, Exception) else None) for u in product_urls],
        return_exceptions=True,
    )

    items: list[ShoppingItem] = []
    for item_data, found_url, image_url in zip(raw_items, product_urls, image_urls):
        store = item_data.get("store", "IKEA Israel")
        search_query = item_data.get("search_query") or item_data.get("name", "")

        if isinstance(found_url, Exception) or not found_url:
            store_url = build_store_search_url(store, search_query)
        else:
            store_url = found_url

        clean_image = image_url if isinstance(image_url, str) else None

        items.append(
            ShoppingItem(
                name=item_data.get("name", ""),
                description=item_data.get("description", ""),
                category=item_data.get("category", "decor"),
                store=store,
                store_url=store_url,
                google_shopping_url=build_google_shopping_url(search_query),
                search_query=search_query,
                estimated_price_nis=int(item_data.get("estimated_price_nis", 0)),
                priority=item_data.get("priority", "recommended"),
                image_url=clean_image,
            )
        )

    return items


async def find_product_url(
    name: str, description: str, store: str, search_query: str
) -> Optional[str]:
    """Use GPT-4o with live web search to find a specific Israeli product page.

    Returns a URL to a product detail page, or None if nothing trustworthy was found.
    Each call is a small Google search performed by the model in real-time, so the
    URLs are guaranteed to be ones that *exist right now* (not hallucinated).
    """
    domain_hint = STORE_DOMAINS.get(store, "")
    prompt = f"""Search the web for a specific product page in an Israeli online store.

Product I need: {name}
Description: {description}
Search query (Hebrew): {search_query}
Preferred store: {store} ({domain_hint})

Find ONE specific product page (not a search results page, not a category page) on a real Israeli online store. Acceptable stores include: IKEA Israel (ikea.com/il), HomeCenter, ACE, Keter, Ivory, Castro Home, Habitat, Zap, KSP, Fox Home, Urbanika.

The page must currently exist and be a single-product page where the user can read details and add to cart.

Return ONLY the URL — no explanation, no markdown, no quotes. Just the URL on its own line."""

    # Try the Responses API with web_search_preview tool first — this is the
    # "blessed" web-search path and works with the standard gpt-4o model.
    try:
        rsp = await client.responses.create(
            model="gpt-4o",
            tools=[{"type": "web_search_preview"}],
            input=prompt,
        )
        text = getattr(rsp, "output_text", "") or ""
        url = _extract_product_url(text)
        if url:
            print(f"[find_product_url] OK '{name}' -> {url}")
            return url
        print(f"[find_product_url] no URL in response for '{name}': {text[:200]!r}")
    except Exception as e:
        print(f"[find_product_url] responses API failed for '{name}': {type(e).__name__}: {e}")

    # Fallback: try the dedicated search-preview chat model.
    try:
        response = await client.chat.completions.create(
            model="gpt-4o-search-preview",
            web_search_options={"search_context_size": "low"},
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
        )
        text = response.choices[0].message.content or ""
        url = _extract_product_url(text)
        if url:
            print(f"[find_product_url] OK (chat fallback) '{name}' -> {url}")
            return url
        print(f"[find_product_url] no URL from chat fallback for '{name}': {text[:200]!r}")
    except Exception as e:
        print(f"[find_product_url] chat fallback failed for '{name}': {type(e).__name__}: {e}")

    return None


async def fetch_product_image(url: Optional[str]) -> Optional[str]:
    """Best-effort fetch of og:image from a product page. Returns None on any error."""
    if not url or not url.startswith(("http://", "https://")):
        return None
    if "google.com/search" in url:
        return None

    try:
        async with httpx.AsyncClient(
            timeout=8.0,
            follow_redirects=True,
            headers={"User-Agent": "Mozilla/5.0 (compatible; HomAI/1.0)"},
        ) as http_client:
            r = await http_client.get(url)
            if r.status_code != 200:
                return None
            html = r.text[:200_000]
    except Exception:
        return None

    for pattern in (OG_IMAGE_RE, TWITTER_IMAGE_RE):
        m = pattern.search(html)
        if m:
            img = m.group(1)
            if img.startswith("//"):
                img = "https:" + img
            elif img.startswith("/"):
                from urllib.parse import urlparse as _urlparse
                p = _urlparse(url)
                img = f"{p.scheme}://{p.netloc}{img}"
            return img
    return None


async def edit_design(
    redesign_path_or_url: str,
    edit_prompt_he: str,
    room_type: str,
    style: str,
) -> str:
    """Edit an existing redesign image using a Hebrew text prompt.
    Returns the relative path (e.g. 'redesigns/abc.png')."""
    from services.storage_service import UPLOADS_DIR, save_redesign_bytes

    style_info = DESIGN_STYLES.get(style, DESIGN_STYLES["modern"])
    room_label = ROOM_TYPES.get(room_type, room_type)

    if redesign_path_or_url.startswith("/uploads/"):
        rel = redesign_path_or_url[len("/uploads/"):]
        image_bytes = (UPLOADS_DIR / rel).read_bytes()
    elif redesign_path_or_url.startswith(("redesigns/", "originals/")):
        image_bytes = (UPLOADS_DIR / redesign_path_or_url).read_bytes()
    else:
        async with httpx.AsyncClient(timeout=60.0) as http_client:
            r = await http_client.get(redesign_path_or_url)
            r.raise_for_status()
            image_bytes = r.content

    full_prompt = (
        f"This is a {style_info['label']} {room_label}. "
        f"User edit request (translate from Hebrew): {edit_prompt_he}. "
        "Apply this change while keeping the rest of the room IDENTICAL — "
        "same layout, same other furniture, same walls, same lighting style. "
        "Photorealistic, professional interior photography, no people, no text."
    )

    response = await client.images.edit(
        model="gpt-image-1",
        image=("redesign.png", image_bytes, "image/png"),
        prompt=full_prompt[:4000],
        size="1536x1024",
        n=1,
    )

    new_bytes = base64.b64decode(response.data[0].b64_json)
    return save_redesign_bytes(new_bytes)
