import sys
import os
import json
import re
from pathlib import Path

try:
    import pymupdf
except ImportError:
    pymupdf = None

import docx2txt

def log(msg):
    print(f"[textExtractor] {msg}", file=sys.stderr)

def extract_pdf_metadata_title(file_path):
    """Extract title from PDF metadata"""
    if pymupdf is None:
        log("PyMuPDF not available, skipping PDF metadata title extraction")
        return None
    try:
        doc = pymupdf.open(file_path)
        metadata = doc.metadata
        doc.close()
        
        if metadata and metadata.get("title"):
            title = metadata["title"].strip()
            if len(title) > 10 and not title.endswith(".pdf"):
                return title
    except Exception as e:
        log(f"Metadata extraction failed: {e}")
    return None

def extract_title_from_first_lines(file_path):
    """
    Extract title from the very first lines of the PDF.
    Combines consecutive lines until hitting author/affiliation markers.
    """
    if pymupdf is None:
        log("PyMuPDF not available, skipping PDF first-lines title extraction")
        return None
    try:
        doc = pymupdf.open(file_path)
        page = doc[0]
        
        # Get text blocks with position info
        blocks = page.get_text("dict")["blocks"]
        doc.close()
        
        # Extract all text spans with their positions and font sizes
        text_items = []
        for block in blocks:
            if "lines" not in block:
                continue
            for line in block["lines"]:
                for span in line["spans"]:
                    text_items.append({
                        "text": span["text"].strip(),
                        "y": span["bbox"][1],  # y-coordinate (vertical position)
                        "size": span["size"],
                        "flags": span["flags"]
                    })
        
        # Sort by vertical position (top to bottom)
        text_items.sort(key=lambda x: x["y"])
        
        # Find the largest font size (likely title)
        if text_items:
            max_font_size = max(item["size"] for item in text_items if item["text"])
            
            # Collect all lines with the largest font size at the top
            title_parts = []
            for item in text_items[:15]:  # Check first 15 text items
                text = item["text"]
                
                # Skip empty or very short text
                if not text or len(text) < 3:
                    continue
                
                # Skip obvious non-title content
                lower = text.lower()
                if any(x in lower for x in ["abstract", "keyword", "doi:", "email", "@", "www.", "http"]):
                    break
                
                # Stop at author patterns
                if re.search(r'^[A-Z][a-z]+\s+[A-Z][a-z]+\s*[\d,¹²³⁴⁵]', text):
                    break
                if re.search(r'university|department|institute|college', lower):
                    break
                
                # Collect lines with large font size (title lines)
                if item["size"] >= max_font_size - 2:  # Allow small variance
                    title_parts.append(text)
                elif title_parts:  # Stop if font size drops after collecting title
                    break
            
            if title_parts:
                # Combine all title parts
                full_title = " ".join(title_parts)
                full_title = re.sub(r'\s+', ' ', full_title).strip()
                
                # Validate length
                if 15 <= len(full_title) <= 500:
                    return full_title
        
    except Exception as e:
        log(f"First lines extraction failed: {e}")
    
    return None

def extract_title_from_text_content(lines):
    """
    Fallback: Extract title from text lines.
    Combines consecutive lines from the top until hitting a stop marker.
    """
    title_lines = []
    
    for i, line in enumerate(lines[:30]):  # Check first 30 lines
        l = line.strip()
        
        # Skip empty lines
        if not l:
            if title_lines:  # If we already have title content, empty line might mean end
                break
            continue
        
        lower = l.lower()
        
        # === STOP CONDITIONS ===
        # Stop at Abstract
        if re.search(r'\babstract\b', lower):
            break
        
        # Stop at author patterns (Name followed by number or superscript)
        if re.search(r'[A-Z][a-z]+\s+[A-Z][a-z]+\s*[\d¹²³⁴⁵⁶⁷⁸⁹]', l):
            break
        
        # Stop at multiple names with commas (author list)
        if l.count(',') >= 2 and re.search(r'[A-Z][a-z]+', l):
            break
        
        # Stop at affiliations
        if any(x in lower for x in ["university", "department", "institute", "college", "@", "email", "doi"]):
            break
        
        # Stop at dates
        if re.search(r'\b(received|accepted|published|submitted)[\s:]+\d', lower):
            break
        
        # === COLLECT TITLE LINES ===
        # Line looks like title (starts with capital, reasonable length)
        if l[0].isupper() and len(l) > 10:
            title_lines.append(l)
            
            # If line ends with period (but not abbreviation), it might be end of title
            if l.endswith('.') and not re.search(r'\b[A-Z]\.$', l):  # Not "U.S." etc
                break
        
        # If we already have title lines, continue only if reasonable
        elif title_lines and len(l) > 15:
            title_lines.append(l)
        
        # Stop collecting after we have substantial content
        if len(" ".join(title_lines)) > 200:
            break
    
    if title_lines:
        full_title = " ".join(title_lines)
        full_title = re.sub(r'\s+', ' ', full_title).strip()
        
        # Clean up common issues
        full_title = re.sub(r'\s*\n\s*', ' ', full_title)
        
        # Validate
        if 15 <= len(full_title) <= 500:
            return full_title
    
    return None

def extract_pdf_text(file_path):
    if pymupdf is None:
        raise RuntimeError("PyMuPDF (pymupdf) is not installed")
    doc = pymupdf.open(file_path)
    text = "\n".join(page.get_text("text") for page in doc)
    doc.close()
    text = re.sub(r'\r\n|\r|\f', '\n', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def get_pdf_title(file_path, lines):
    """Main title extraction with priority order"""
    
    # Priority 1: PDF Metadata Title
    title = extract_pdf_metadata_title(file_path)
    if title and len(title) > 10:
        log(f"✓ Title from METADATA: {title[:60]}...")
        return title
    
    # Priority 2: First lines with font analysis (BEST for academic papers)
    title = extract_title_from_first_lines(file_path)
    if title and len(title) > 15:
        log(f"✓ Title from FIRST LINES: {title[:60]}...")
        return title
    
    # Priority 3: Text content analysis
    title = extract_title_from_text_content(lines)
    if title and len(title) > 15:
        log(f"✓ Title from TEXT CONTENT: {title[:60]}...")
        return title
    
    # Fallback: First long line
    for line in lines[:20]:
        if len(line) > 30 and line[0].isupper():
            log(f"⚠ Title from FALLBACK: {line[:60]}...")
            return line
    
    # Last resort: Filename
    return Path(file_path).stem.replace("_", " ").replace("-", " ")

def extract_keywords_after_abstract(lines):
    abstract_found = False
    keywords = ""

    for i, line in enumerate(lines):
        lower = line.lower().strip()

        if not abstract_found and re.search(r'\babstract\b', lower):
            abstract_found = True
            continue

        if not abstract_found:
            continue

        if re.search(r'\bkey ?words?\b', lower) and "index terms" not in lower:
            cleaned = re.sub(r'^.*?\bkey ?words?\b[:\-–—.\s]*', '', line, flags=re.I).strip()
            parts = [cleaned] if cleaned else []

            j = i + 1
            while j < len(lines):
                nxt = lines[j].strip()
                nxt_lower = nxt.lower()

                if not nxt:
                    break
                if re.search(r'\b(introduction|1\.|i\.|background|method|related work)\b', nxt_lower):
                    break
                if re.search(r'^\d+\.', nxt):
                    break

                parts.append(nxt)
                j += 1

            raw_keywords = " ".join(parts)
            raw_keywords = re.sub(r'[;\-/|]', ',', raw_keywords)
            raw_keywords = re.sub(r'\s+,', ',', raw_keywords)
            raw_keywords = re.sub(r',\s+', ', ', raw_keywords)
            keywords = raw_keywords.strip(" ,.;")
            break

    return keywords

def extract_abstract(lines):
    for i, line in enumerate(lines):
        if re.search(r'\babstract\b', line, re.I):
            after_colon = re.sub(r'^.*?\babstract\b[:\-–—.]*\s*', '', line, flags=re.I).strip()
            abstract_parts = [after_colon] if after_colon else []

            j = i + 1
            while j < len(lines):
                nxt = lines[j].strip()
                nxt_lower = nxt.lower()
                if re.search(r'\b(keywords?|index terms?|introduction|1\.|i\.)\b', nxt_lower):
                    break
                if nxt:
                    abstract_parts.append(nxt)
                j += 1

            abstract = re.sub(r'\s+', ' ', " ".join(abstract_parts)).strip()
            return abstract
    return ""

# ================= MAIN =================
if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python textExtractor.py <file_path>"}))
        sys.exit(1)

    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(json.dumps({"error": "File not found"}))
        sys.exit(1)

    ext = Path(file_path).suffix.lower()

    try:
        if ext == ".pdf":
            text = extract_pdf_text(file_path)
            lines = [line.strip() for line in text.split("\n") if line.strip()]
            title = get_pdf_title(file_path, lines)
        elif ext in [".doc", ".docx"]:
            text = docx2txt.process(file_path)
            lines = [line.strip() for line in text.split("\n") if line.strip()]
            title = extract_title_from_text_content(lines) or Path(file_path).stem
        else:
            print(json.dumps({"error": "Only PDF/DOC/DOCX supported"}))
            sys.exit(1)

        abstract = extract_abstract(lines)
        keywords = extract_keywords_after_abstract(lines)

        result = {
            "title": title,
            "abstract": abstract,
            "keywords": keywords,
            "word_count": len(text.split()),
            "status": "success"
        }

        print(json.dumps(result, ensure_ascii=False))
        log("✓ Extraction SUCCESS")

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        log(f"✗ FAILED: {e}")
        sys.exit(1)
