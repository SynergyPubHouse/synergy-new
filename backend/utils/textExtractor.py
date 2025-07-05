import sys
import io
import docx2txt
import os
from pathlib import Path
import spacy
import json
import re

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def extract_text(file_path):
    """
    Extract text from a DOCX file
    :param file_path: Path to the DOCX file
    :return: Extracted text
    """
    try:
        print(f"[textExtractor] Starting extraction for: {file_path}", file=sys.stderr)
        # Check if file exists
        if not os.path.exists(file_path):
            print(json.dumps({"error": f"File '{file_path}' does not exist"}))
            return None

        # Get file extension
        file_ext = Path(file_path).suffix.lower()
        
        # Check if it's a .doc or .docx file
        if file_ext not in ['.doc', '.docx']:
            print(json.dumps({"error": f"File must be a .doc or .docx file, got {file_ext}"}))
            return None

        # Extract text
        text = docx2txt.process(file_path)
        if text is None:
            print(f"[textExtractor] Warning: Extracted text is None", file=sys.stderr)
        elif text.strip() == '':
            print(f"[textExtractor] Warning: Extracted text is empty", file=sys.stderr)
        else:
            print(f"[textExtractor] Extraction successful. Text length: {len(text)}", file=sys.stderr)
        return text

    except Exception as e:
        print(f"[textExtractor] Error extracting text: {str(e)}", file=sys.stderr)
        return None

def extract_title_abstract_keywords(text):
    nlp = spacy.load("en_core_web_sm")
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    title = lines[0] if lines else ""
    abstract = ""
    keywords = ""

    # Find abstract
    for i, line in enumerate(lines):
        if line.lower().startswith("abstract"):
            if len(line.split()) > 1:
                abstract = line[len("abstract"):].strip(": .-")
            else:
                abstract_lines = []
                for next_line in lines[i+1:]:
                    if next_line == "" or next_line.lower().startswith(("keywords", "key words", "introduction", "background")):
                        break
                    abstract_lines.append(next_line)
                abstract = " ".join(abstract_lines)
            break

    # Find keywords (anywhere in the document)
    for idx, line in enumerate(lines):
        # Match variations like "Keywords:", "KEYWORDS", "Key words", etc.
        match = re.match(r'^(keywords?|key words?)[:\-\. ]*(.*)$', line, re.IGNORECASE)
        if match:
            possible_keywords = match.group(2).strip()
            if possible_keywords:
                keywords = possible_keywords
            else:
                # If nothing after the heading, try the next line
                if idx + 1 < len(lines):
                    keywords = lines[idx + 1].strip()
            break

    return title, abstract, keywords

if __name__ == "__main__":
    print(f"[textExtractor] Script started with args: {sys.argv}", file=sys.stderr)
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python textExtractor.py <file_path>"}))
        sys.exit(1)

    file_path = sys.argv[1]
    text = extract_text(file_path)
    
    if text is not None:
        title, abstract, keywords = extract_title_abstract_keywords(text)
        print(json.dumps({
            "title": title,
            "abstract": abstract,
            "keywords": keywords,
            "full_text": text
        }))
        print(f"[textExtractor] Script finished successfully.", file=sys.stderr)
        sys.exit(0)
    else:
        print(f"[textExtractor] Script finished with extraction failure.", file=sys.stderr)
        sys.exit(1) 