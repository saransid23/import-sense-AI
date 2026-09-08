# ============================================================
# CORE: Live Government Web Scraper
# Fetches regulatory content from DGFT, CBIC, ICEGATE,
# FSSAI, CDSCO, DoT, WPC, MeitY, BIS, MNRE
# ============================================================

import asyncio
import hashlib
import time
from typing import Optional
from urllib.parse import urljoin, urlparse

import aiohttp
import diskcache
import structlog
from bs4 import BeautifulSoup

logger = structlog.get_logger(__name__)

# ─── In-process disk cache (TTL-based) ───────────────────────
_cache = diskcache.Cache("./data/scraper_cache")
CACHE_TTL = 3600  # 1 hour for most pages

# ─── Government source registry ──────────────────────────────
SOURCES = {
    "DGFT": {
        "base": "https://dgft.gov.in",
        "notifications": "https://dgft.gov.in/CP/",
        "itchs": "https://dgft.gov.in/CP/?opt=itchs",
        "policy": "https://dgft.gov.in/CP/?opt=FTP",
    },
    "CBIC": {
        "base": "https://www.cbic.gov.in",
        "notifications": "https://www.cbic.gov.in/htdocs-cbec/customs",
        "tariff": "https://www.cbic.gov.in/htdocs-cbec/customs/cst2024-25/cst2024-25-idx.htm",
        "circulars": "https://www.cbic.gov.in/htdocs-cbec/customs/cst-act22-23/file/Customs-Circulars-2024-25.pdf",
    },
    "ICEGATE": {
        "base": "https://www.icegate.gov.in",
        "tariff": "https://www.icegate.gov.in/Webappl/",
    },
    "FSSAI": {
        "base": "https://www.fssai.gov.in",
        "imports": "https://www.fssai.gov.in/cms/food-import.php",
        "regulations": "https://www.fssai.gov.in/cms/regulation.php",
    },
    "CDSCO": {
        "base": "https://cdsco.gov.in",
        "drugs": "https://cdsco.gov.in/opencms/opencms/en/Drugs/Drugs/",
        "notifications": "https://cdsco.gov.in/opencms/opencms/en/Notifications/Notifications/",
    },
    "DoT": {
        "base": "https://dot.gov.in",
        "licensing": "https://dot.gov.in/spectrum-management/wpc-wing",
        "circulars": "https://dot.gov.in/circularsnew",
    },
    "WPC": {
        "base": "https://dot.gov.in",
        "approvals": "https://dot.gov.in/spectrum-management/equipment-type-approval",
    },
    "MeitY": {
        "base": "https://www.meity.gov.in",
        "notifications": "https://www.meity.gov.in/notifications",
        "it_act": "https://www.meity.gov.in/content/it-act-2000",
    },
    "BIS": {
        "base": "https://www.bis.gov.in",
        "crs": "https://www.bis.gov.in/index.php/testing-and-certification/product-certification/compulsory-registration-scheme/",
        "notifications": "https://www.bis.gov.in/index.php/about-bis/notifications/",
    },
    "MNRE": {
        "base": "https://mnre.gov.in",
        "policies": "https://mnre.gov.in/solar-energy/",
        "notifications": "https://mnre.gov.in/notification/",
    },
    "CPCB": {
        "base": "https://cpcb.nic.in",
        "ewaste": "https://cpcb.nic.in/e-waste/",
    },
}

# ─── HTTP Headers ─────────────────────────────────────────────
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-IN,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
}


def _cache_key(url: str) -> str:
    return hashlib.md5(url.encode()).hexdigest()


async def fetch_page(url: str, ttl: int = CACHE_TTL, timeout: int = 10) -> Optional[str]:
    """Fetch HTML content with cache. Returns raw HTML or None on failure."""
    ck = _cache_key(url)
    if ck in _cache:
        logger.debug("scraper.cache_hit", url=url)
        return _cache[ck]

    try:
        connector = aiohttp.TCPConnector(ssl=False)
        async with aiohttp.ClientSession(headers=HEADERS, connector=connector) as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=timeout)) as resp:
                if resp.status == 200:
                    html = await resp.text(errors="replace")
                    _cache.set(ck, html, expire=ttl)
                    logger.info("scraper.fetched", url=url, size=len(html))
                    return html
                else:
                    logger.warning("scraper.non200", url=url, status=resp.status)
                    return None
    except Exception as e:
        logger.warning("scraper.failed", url=url, error=str(e))
        return None


def extract_text_blocks(html: str, min_length: int = 40, max_length: int = 800) -> list[str]:
    """Parse HTML and return meaningful text blocks for NLP processing."""
    soup = BeautifulSoup(html, "lxml")

    # Remove boilerplate
    for tag in soup(["script", "style", "nav", "footer", "header", "noscript", "iframe"]):
        tag.decompose()

    blocks = []
    for el in soup.find_all(["p", "li", "td", "th", "h1", "h2", "h3", "h4", "div", "span"]):
        text = el.get_text(separator=" ", strip=True)
        text = " ".join(text.split())  # collapse whitespace
        if min_length <= len(text) <= max_length:
            blocks.append(text)

    # Deduplicate while preserving order
    seen = set()
    unique_blocks = []
    for b in blocks:
        key = b[:60]
        if key not in seen:
            seen.add(key)
            unique_blocks.append(b)

    return unique_blocks


def extract_links(html: str, base_url: str, extensions: tuple = (".pdf", ".htm", ".html")) -> list[dict]:
    """Extract relevant links (PDFs, notification pages) from a page."""
    soup = BeautifulSoup(html, "lxml")
    links = []
    seen = set()
    for a in soup.find_all("a", href=True):
        href = a["href"]
        full_url = urljoin(base_url, href)
        # Only same-domain and matching extension
        if urlparse(full_url).netloc == urlparse(base_url).netloc:
            ext = urlparse(full_url).path.lower()
            if any(ext.endswith(e) for e in extensions) and full_url not in seen:
                seen.add(full_url)
                links.append({
                    "url": full_url,
                    "text": a.get_text(strip=True)[:120],
                    "is_pdf": full_url.lower().endswith(".pdf"),
                })
    return links[:30]  # cap to avoid explosion


async def scrape_source(source_key: str, page_key: str = "notifications") -> dict:
    """
    Scrape a registered government source and return structured content.
    Returns: { source, url, text_blocks, links, fetched_at, success }
    """
    source = SOURCES.get(source_key, {})
    url = source.get(page_key, source.get("base", ""))
    if not url:
        return {"source": source_key, "success": False, "error": "Unknown source"}

    html = await fetch_page(url)
    if not html:
        return {"source": source_key, "url": url, "success": False, "error": "Fetch failed"}

    text_blocks = extract_text_blocks(html)
    links = extract_links(html, url)

    return {
        "source": source_key,
        "url": url,
        "text_blocks": text_blocks,
        "pdf_links": [l for l in links if l["is_pdf"]],
        "page_links": [l for l in links if not l["is_pdf"]],
        "block_count": len(text_blocks),
        "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "success": True,
    }


async def scrape_multiple(source_keys: list[str]) -> list[dict]:
    """Concurrently scrape multiple government sources."""
    tasks = [scrape_source(k) for k in source_keys]
    results = await asyncio.gather(*tasks, return_exceptions=False)
    return list(results)


def invalidate_cache(url: str):
    """Force-evict a URL from the cache (for manual refresh)."""
    ck = _cache_key(url)
    if ck in _cache:
        del _cache[ck]
