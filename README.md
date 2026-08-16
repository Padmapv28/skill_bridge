\# Resume Parsing \& Extraction — ML Module


<<<<<<< HEAD

Backend service that turns an uploaded resume (PDF or DOCX) into clean,
=======
\## Repository Structure
>>>>>>> f5d6e6c92df02537577577e39acc26b9e19104b6

structured JSON: name, contact info, skills, education, experience,

projects, and certifications.



This module owns \*\*text extraction, structured parsing, and a REST API\*\* for

resume ingestion. It does not implement any frontend or storage — it's a

self-contained pipeline that other services (prediction, roadmap generation,

etc.) call to turn a raw resume file into structured data they can work with.



\---



\## 1. Architecture

Client (frontend / other services, not part of this module)

|

| POST /api/upload-resume (multipart file upload)

v

FastAPI app (src/main.py)

|

|-- validation --> file type (.pdf/.docx), size (<=5MB), non-empty

|

v

resume\_extractor.py --> PDF/DOCX -> raw plain text

| pdfplumber (primary) -> PyMuPDF (fallback)

| python-docx (paragraphs + tables)

v

resume\_parser.py --> raw text -> structured JSON

| spaCy NER -> name

| regex -> email, phone

| skills taxonomy -> skills (524 curated terms)

| rule-based -> education, experience,

| section parsing projects, certifications

v

JSON response (200) matching docs/resume\_fields.md

or a clear error (400 / 422) if the file is invalid/unparseable





Each layer only depends on the layer below it: the API calls the extractor,

the extractor hands text to the parser, the parser returns structured data.

Nothing reaches into another layer's internals.



\---



\## 2. Repository Structure

ml/

├── src/

│ ├── resume\_extractor.py # PDF/DOCX -> raw text

│ ├── resume\_parser.py # raw text -> structured JSON

│ ├── main.py # FastAPI app: POST /api/upload-resume

│ └── build\_taxonomy.py # generates skills\_taxonomy.json

├── data/
│ ├── skills\_taxonomy.json # 524-skill matching taxonomy

│ └── sample\_resumes/ # 26 sample resumes for testing

└── docs/

└── resume\_fields.md # output JSON schema (contract for other modules)


<<<<<<< HEAD

\---



\## 3. Extraction logic



`resume\_extractor.py` exposes one function: `extract\_text(file\_path) -> str`.



| File type | Strategy |

|---|---|

| `.pdf` | `pdfplumber` first. If the result is empty or suspiciously short (a strong signal of a scanned/image-only PDF), falls back to `PyMuPDF`. |

| `.docx` | `python-docx`, reading both paragraphs and table cells (many resumes use tables for two-column skill layouts). |



Corrupted files and scanned/image-only PDFs raise a `ResumeExtractionError`

with a clear message rather than failing silently or crashing.



\*\*Known limitation:\*\* true two-column PDF layouts can scramble reading order

during extraction — `pdfplumber` reads left-to-right per horizontal band,

which interleaves left/right column content. This is an upstream limitation

of the extraction library, not the parsing logic. Single-column PDFs, DOCX

files, and table-layout DOCX files are unaffected.



\## 4. Parsing logic



`resume\_parser.py` exposes one function: `parse\_resume(text) -> dict`.



\- \*\*Name\*\* — spaCy NER (`en\_core\_web\_sm`) run on the resume's first line only

&#x20; (name is reliably the first line in every resume format tested; restricting

&#x20; to one line avoids NER merging multiple header lines into one entity).

\- \*\*Email / phone\*\* — regex.

\- \*\*Skills\*\* — word-boundary matched against a 524-term curated taxonomy

&#x20; (`data/skills\_taxonomy.json`) covering programming languages, frameworks,

&#x20; cloud/DevOps, data/ML, design, business tools, soft skills, and

&#x20; domain-specific engineering skills.

\- \*\*Education / experience / projects\*\* — section-header detection, then

&#x20; rule-based line parsing keyed on trailing date ranges (e.g. `"May 2025 -

&#x20; Jul 2025"`) to distinguish a new entry from a description/bullet line.

&#x20; Institution vs. degree ordering is resolved with keyword heuristics rather

&#x20; than assuming a fixed left/right order, since resumes vary.



Parsing rules were tuned and debugged against 6 distinct real-world resume

formats (not just synthetic test data) to handle varied section-header

wording, separator styles, and field ordering.



\## 5. API



\### `POST /api/upload-resume`



| Status | Meaning |

|---|---|

| `200` | Success — structured resume JSON returned |

| `400` | Bad request — wrong file type, empty file, or file over 5MB |

| `422` | File was valid but could not be extracted/parsed (corrupted file, scanned/image-only PDF) |



Full response schema: \[`docs/resume\_fields.md`](docs/resume\_fields.md).



\## 6. Setup \& running
=======
\## ml/ -- Resume Parsing Module



Takes an uploaded resume (PDF or DOCX) and returns structured JSON: name, email,
phone, skills, education, experience, projects, and certifications.



>>>>>>> f5d6e6c92df02537577577e39acc26b9e19104b6

\### Setup


```bash

cd src

pip install pdfplumber PyMuPDF python-docx spacy rapidfuzz fastapi uvicorn python-multipart

python -m spacy download en\_core\_web\_sm



<<<<<<< HEAD
=======


\### Running the API


```bash

cd ml/src

>>>>>>> f5d6e6c92df02537577577e39acc26b9e19104b6
python -m uvicorn main:app --reload

```



Interactive API docs: `http://127.0.0.1:8000/docs`



<<<<<<< HEAD
\### Using the modules directly (without the API)
=======
>>>>>>> f5d6e6c92df02537577577e39acc26b9e19104b6

\### Using the modules directly


```python

from resume\_extractor import extract\_text

from resume\_parser import parse\_resume



raw\_text = extract\_text("path/to/resume.pdf")

result = parse\_resume(raw\_text)

```



<<<<<<< HEAD
\## 7. Testing
=======
>>>>>>> f5d6e6c92df02537577577e39acc26b9e19104b6

\### Output schema


All 26 files in `data/sample\_resumes/` were used to validate the pipeline —

a mix of real and synthetic resumes across PDF/DOCX, single-column,

table-layout, and two-column formats, plus two deliberate edge cases (one

corrupted file, one scanned/image-only PDF) to confirm error handling.

<<<<<<< HEAD
Both success and failure paths were verified through the live API, not just

the standalone modules.
=======

\### API responses


| Status | Meaning |

|---|---|

| 200 | Success -- structured resume JSON returned |

| 400 | Bad request -- wrong file type, empty file, or file over 5MB |

| 422 | File was valid but could not be extracted/parsed (e.g. corrupted file, scanned/image-only PDF) |




\### Known limitations



\- Two-column PDF layouts: pdfplumber's default text extraction can scramble

&#x20; reading order on true two-column PDF resumes (columns get interleaved

&#x20; line-by-line). Single-column PDFs, DOCX files, and table-layout DOCX files

&#x20; all extract correctly. A layout-aware extraction pass (e.g. using bounding

&#x20; boxes) would be needed to fully resolve this.

\- Rule-based parsing (education/experience/projects) is tuned against a range

&#x20; of real resume formats but, like any rule-based system, may not perfectly

&#x20; handle every possible resume layout.




\### Testing


All 26 sample resumes in ml/data/sample\_resumes/ were used to validate the

extraction and parsing pipeline, including two deliberate edge cases (one

corrupted file, one scanned/image-only PDF) to confirm error handling works

correctly end-to-end, including through the live API.
>>>>>>> f5d6e6c92df02537577577e39acc26b9e19104b6

