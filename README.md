\# Skill Bridge


\## Repository Structure

skill\_bridge/

├── frontend/ # Frontend application (in progress)

└── ml/ # Resume parsing \& data extraction pipeline (Member A)

├── src/

│ ├── resume\_extractor.py # PDF/DOCX -> raw text

│ ├── resume\_parser.py # Raw text -> structured JSON

│ └── main.py # FastAPI endpoint (POST /api/upload-resume)

├── data/
│ ├── skills\_taxonomy.json # 524-skill matching taxonomy

│ └── sample\_resumes/ # 26 sample resumes (PDF/DOCX, varied formats)

└── docs/

└── resume\_fields.md # JSON output schema (contract for other modules)


\## ml/ -- Resume Parsing Module



Takes an uploaded resume (PDF or DOCX) and returns structured JSON: name, email,
phone, skills, education, experience, projects, and certifications.




\### Setup


```bash

cd ml/src

pip install pdfplumber PyMuPDF python-docx spacy rapidfuzz fastapi uvicorn python-multipart

python -m spacy download en\_core\_web\_sm

```




\### Running the API


```bash

cd ml/src

python -m uvicorn main:app --reload

```



Then open http://127.0.0.1:8000/docs for the interactive Swagger UI, or send a

POST request to http://127.0.0.1:8000/api/upload-resume with a PDF/DOCX file

under the `file` field.




\### Using the modules directly


```python

from resume\_extractor import extract\_text

from resume\_parser import parse\_resume



raw\_text = extract\_text("path/to/resume.pdf")

result = parse\_resume(raw\_text)  # returns a dict matching docs/resume\_fields.md

```




\### Output schema


See ml/docs/resume\_fields.md for the full JSON schema returned by both

parse\_resume() and the API endpoint.




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

