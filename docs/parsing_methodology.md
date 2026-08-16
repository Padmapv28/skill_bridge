# Resume Parsing Methodology

**Module owner:** Member A
**Files:** `resume_extractor.py`, `resume_parser.py`, `skills_taxonomy.json`, `main.py`

This document explains how the resume parsing pipeline turns an uploaded PDF/DOCX file into structured JSON, what libraries power each step, and where the known limitations are.

---

## 1. Overview

The pipeline runs in two stages:

1. **Text extraction** (`resume_extractor.py`) — converts a PDF or DOCX file into raw plain text.
2. **Structured parsing** (`resume_parser.py`) — takes that raw text and extracts name, email, phone, skills, education, experience, projects, and certifications as structured JSON.

These are deliberately kept as separate modules: extraction only cares about getting *any* readable text out of a file format; parsing only cares about turning readable text into structured fields, regardless of where that text came from. This separation made it possible to test and fix each stage independently.

---

## 2. Text Extraction

### Libraries used
| Library | Role |
|---|---|
| `pdfplumber` | Primary PDF text extraction |
| `PyMuPDF` (`fitz`) | Fallback PDF extraction + page rasterization for OCR |
| `pytesseract` + `Pillow` | OCR for scanned/image-only PDFs |
| `python-docx` | DOCX text extraction |

### How it works

**PDFs** go through a three-step fallback chain, each step only running if the previous one fails to produce meaningful text:

1. **`pdfplumber`** extracts text page by page. This is the primary method because it handles standard single-column resume layouts well.
2. **`PyMuPDF` fallback** — if `pdfplumber` returns little or no text (e.g. certain malformed PDFs, or PDFs where `pdfplumber`'s layout heuristics fail), the file is re-extracted with PyMuPDF, which uses a different underlying text-extraction approach and sometimes succeeds where `pdfplumber` doesn't.
3. **OCR fallback** — if both text-based methods fail (typically because the PDF is a scanned image with no embedded text layer at all), each page is rasterized to an image using PyMuPDF at 300 DPI, and `pytesseract` runs OCR on the image to recover text.

A page is judged to have failed extraction using a simple heuristic: average characters extracted per page falls below a threshold (20 chars/page). This catches both fully blank extractions and PDFs where only a tiny amount of stray text (e.g. page numbers) was recoverable.

If all three methods fail, extraction raises a specific error (`ScannedPDFError`) rather than crashing, which the API layer turns into a user-facing message.

**DOCX** files are extracted directly with `python-docx`, pulling text from both paragraphs and table cells (resumes sometimes use tables for layout, e.g. a skills grid).

### Error handling

Extraction failures are raised as typed exceptions rather than one generic error, so the API can respond differently depending on the cause:

- `UnsupportedFileTypeError` — file isn't `.pdf` or `.docx`
- `CorruptedFileError` — file exists but can't be opened/parsed at all
- `ScannedPDFError` — PDF has no usable text layer, and OCR (if available) couldn't recover meaningful text either

---

## 3. Structured Parsing (NLP Extraction)

### Libraries used
| Library | Role |
|---|---|
| `spaCy` (`en_core_web_sm`) | Named Entity Recognition (NER) for name detection |
| `rapidfuzz` | Fuzzy string matching for section header detection |
| `re` (regex) | Email, phone, dates, degree/institution keyword matching |

### Name extraction
The first non-empty line of the resume is run through spaCy's NER model, looking for a `PERSON` entity. If spaCy doesn't confidently tag a person, a fallback heuristic accepts the first line as the name if it's short (≤5 words), has no digits, and isn't an email address — this covers cases where a name is stylized in a way spaCy doesn't recognize (e.g. unusual capitalization or fonts converted to unusual Unicode).

### Contact info
- **Email** is extracted with a standard email regex.
- **Phone** is extracted by scanning the first 15 lines for a number-like pattern, then validating that the digit count (after removing formatting characters) falls between 7 and 15 — filtering out things like zip codes or stray numbers that aren't phone numbers.

### Section detection
Resumes are split into sections (education, experience, projects, skills, certifications, extracurricular, objective) by scanning line by line for header lines. Detection happens in two passes:

1. **Exact/synonym match** — each line is checked against a curated list of known header variants per section (e.g. "Projects" also matches "Portfolio," "What I've Built," "Selected Projects").
2. **Fuzzy match fallback** — for header-shaped lines (short, no trailing punctuation, no long digit runs) that don't exactly match a known variant, `rapidfuzz`'s `token_sort_ratio` scorer compares the line against all known header variants and accepts a match above an 82% similarity threshold. `token_sort_ratio` was chosen over a plain ratio because it's tolerant of word reordering (e.g. "Work History" vs "History of Work"), which is common in resumes that phrase headers unconventionally.

This two-pass approach keeps the common case (standard headers) fast and reliable via direct lookup, while still catching non-standard phrasing without requiring an exhaustive synonym list.

### Skills matching
Skills are matched against a curated taxonomy of 524 known skills (`skills_taxonomy.json`). Each skill is checked against the full resume text using a word-boundary regex, so partial matches inside other words are avoided (e.g. "R" as a skill won't match inside "Director"). Matching is case-insensitive but preserves the taxonomy's canonical casing in the output (e.g. "aws" in the resume still reports as "AWS").

### Education, experience, and projects
These sections use rule-based parsing rather than NER, because resume formatting for these fields is fairly structured (dates, degree abbreviations, institution names) and rule-based logic is more predictable and debuggable than a general-purpose model for this kind of semi-structured text:

- **Education** entries are identified by the presence of a degree keyword (e.g. "B.Tech," "M.S.," "Bachelor") or an institution keyword (e.g. "University," "College"). The line is split around a detected date/year, and the two resulting halves are classified as degree vs. institution based on which keyword each one contains.
- **Experience** entries are anchored on a detected date range (e.g. "Jan 2022 – Present"). The text before the date is split into title/company; text on following lines (until the next date range) becomes the description.
- **Projects** entries follow a similar anchor-and-accumulate pattern, with additional handling for a `[Technology, List]` bracket convention some resumes use to tag the tech stack for a project.
- **Certifications** are extracted as a flat list, splitting on commas within the certifications section.

---

## 4. Known Limitations

- **Complex multi-column PDFs**: While the PyMuPDF fallback recovers some two-column layouts that `pdfplumber` scrambles, neither library performs true visual/spatial reconstruction of column order. Severely irregular multi-column or infographic-style resumes may still interleave text from different columns.
- **OCR accuracy on low-quality scans**: OCR fallback depends on Tesseract's accuracy, which degrades on low-resolution scans, unusual fonts, or heavily stylized resume templates (e.g. resumes designed as graphics/images with decorative text).
- **Fuzzy header matching is heuristic, not semantic**: The fuzzy matcher catches reordered or slightly reworded headers, but won't catch headers that are semantically equivalent but lexically very different (e.g. a header with no word overlap with any known variant) without adding it to the synonym list manually.
- **Rule-based education/experience/project parsing assumes a date anchor**: Entries that don't include any recognizable date or date range (rare, but possible for ongoing/undated projects) may not be captured correctly.
- **Name extraction assumes the name appears on the first line**: Resumes with a graphical header (e.g. name embedded in a logo/image at the top, or a name that appears further down the page) may not extract a name correctly.

---

## 5. Error Handling Summary

The API (`main.py`, `POST /api/upload-resume`) maps extraction failures to specific HTTP responses instead of crashing:

| Failure | HTTP Status | User-facing message |
|---|---|---|
| Wrong file type | 400 | "Unsupported file type. Only .pdf and .docx are accepted." |
| File too large / empty | 400 | Size-specific message |
| Scanned PDF, OCR also failed | 422 | "We couldn't read any text from this PDF, even with OCR... please upload a text-based PDF or DOCX." |
| Corrupted file | 422 | "This file appears to be corrupted or unreadable." |
| Text extracted but couldn't be parsed | 422 | "Resume was extracted but could not be parsed into structured data." |
