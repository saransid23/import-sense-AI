# ============================================================
# CORE: PDF Ingester
# Extracts text from government PDFs and chunks it for
# embedding. Uses PyMuPDF (fitz) for extraction.
# ============================================================

import io
import os
import re
import hashlib
import time
from typing import Optional

import aiohttp
import structlog

logger = structlog.get_logger(__name__)

try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False
    logger.warning("pdf_ingester.pymupdf_unavailable", msg="Install pymupdf for PDF support")

try:
    import pdfplumber
    PDFPLUMBER_AVAILABLE = True
except ImportError:
    PDFPLUMBER_AVAILABLE = False


HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/pdf,*/*",
}

CHUNK_SIZE = 400          # chars per chunk
CHUNK_OVERLAP = 80        # overlap between chunks
MAX_PDF_SIZE_MB = 20      # skip PDFs larger than this


async def download_pdf(url: str, timeout: int = 15) -> Optional[bytes]:
    """Download a PDF from a URL and return raw bytes."""
    try:
        connector = aiohttp.TCPConnector(ssl=False)
        async with aiohttp.ClientSession(headers=HEADERS, connector=connector) as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=timeout)) as resp:
                if resp.status != 200:
                    logger.warning("pdf_ingester.download_failed", url=url, status=resp.status)
                    return None
                content_length = int(resp.headers.get("Content-Length", 0))
                if content_length > MAX_PDF_SIZE_MB * 1024 * 1024:
                    logger.warning("pdf_ingester.too_large", url=url, size_mb=content_length / 1e6)
                    return None
                data = await resp.read()
                logger.info("pdf_ingester.downloaded", url=url, size_kb=len(data) // 1024)
                return data
    except Exception as e:
        logger.warning("pdf_ingester.download_exception", url=url, error=str(e))
        return None


def extract_text_pymupdf(pdf_bytes: bytes) -> str:
    """Extract all text from a PDF using PyMuPDF."""
    if not PYMUPDF_AVAILABLE:
        return ""
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        pages_text = []
        for page_num in range(min(len(doc), 50)):  # limit to first 50 pages
            page = doc.load_page(page_num)
            text = page.get_text("text")
            if text.strip():
                pages_text.append(text.strip())
        doc.close()
        return "\n\n".join(pages_text)
    except Exception as e:
        logger.warning("pdf_ingester.pymupdf_error", error=str(e))
        return ""


def extract_text_pdfplumber(pdf_bytes: bytes) -> str:
    """Fallback: extract text using pdfplumber."""
    if not PDFPLUMBER_AVAILABLE:
        return ""
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            texts = []
            for page in pdf.pages[:50]:
                t = page.extract_text()
                if t:
                    texts.append(t.strip())
            return "\n\n".join(texts)
    except Exception as e:
        logger.warning("pdf_ingester.pdfplumber_error", error=str(e))
        return ""


def clean_text(text: str) -> str:
    """Normalize extracted PDF text."""
    # Remove excessive whitespace/newlines
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    # Remove page number artifacts like "Page 1 of 23"
    text = re.sub(r"Page \d+ of \d+", "", text, flags=re.IGNORECASE)
    # Remove repeated dashes/underscores (table borders)
    text = re.sub(r"[-_=]{4,}", "", text)
    return text.strip()


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """
    Split text into overlapping chunks of approximately chunk_size characters.
    Tries to break at sentence boundaries.
    """
    # Split into sentences
    sentences = re.split(r"(?<=[.!?])\s+", text)
    chunks = []
    current = ""

    for sentence in sentences:
        if len(current) + len(sentence) <= chunk_size:
            current += " " + sentence
        else:
            if current.strip():
                chunks.append(current.strip())
            # Overlap: keep last `overlap` chars of previous chunk
            overlap_text = current[-overlap:] if len(current) > overlap else current
            current = overlap_text + " " + sentence

    if current.strip():
        chunks.append(current.strip())

    # Filter out empty or very short chunks
    return [c for c in chunks if len(c) >= 30]


async def ingest_pdf(url: str, source: str = "unknown", metadata: dict = None) -> dict:
    """
    Download and ingest a PDF from a government source.
    Returns { url, source, chunks, chunk_count, success }
    """
    logger.info("pdf_ingester.ingesting", url=url, source=source)

    pdf_bytes = await download_pdf(url)
    if not pdf_bytes:
        return {"url": url, "source": source, "success": False, "chunks": [], "error": "Download failed"}

    # Try PyMuPDF first, fallback to pdfplumber
    raw_text = extract_text_pymupdf(pdf_bytes)
    if not raw_text:
        raw_text = extract_text_pdfplumber(pdf_bytes)

    if not raw_text:
        return {"url": url, "source": source, "success": False, "chunks": [], "error": "Text extraction failed"}

    cleaned = clean_text(raw_text)
    chunks = chunk_text(cleaned)
    doc_hash = hashlib.md5(pdf_bytes).hexdigest()

    logger.info("pdf_ingester.done", url=url, chunks=len(chunks), chars=len(cleaned))

    return {
        "url": url,
        "source": source,
        "doc_hash": doc_hash,
        "chunks": chunks,
        "chunk_count": len(chunks),
        "total_chars": len(cleaned),
        "metadata": metadata or {},
        "ingested_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "success": True,
    }


async def ingest_pdf_list(pdf_links: list[dict]) -> list[dict]:
    """Ingest multiple PDFs concurrently (limited concurrency)."""
    import asyncio
    sem = asyncio.Semaphore(3)  # max 3 concurrent PDF downloads

    async def _safe_ingest(link: dict):
        async with sem:
            return await ingest_pdf(
                url=link["url"],
                source=link.get("source", "unknown"),
                metadata={"title": link.get("text", "")},
            )

    tasks = [_safe_ingest(link) for link in pdf_links]
    return await asyncio.gather(*tasks)
