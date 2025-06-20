import sys
import docx2txt
import os
from pathlib import Path

def extract_text(file_path):
    """
    Extract text from a DOCX file
    :param file_path: Path to the DOCX file
    :return: Extracted text
    """
    try:
        # Check if file exists
        if not os.path.exists(file_path):
            print(f"Error: File '{file_path}' does not exist", file=sys.stderr)
            return None

        # Get file extension
        file_ext = Path(file_path).suffix.lower()
        
        # Check if it's a .doc or .docx file
        if file_ext not in ['.doc', '.docx']:
            print(f"Error: File must be a .doc or .docx file, got {file_ext}", file=sys.stderr)
            return None

        # Extract text
        text = docx2txt.process(file_path)
        return text

    except Exception as e:
        print(f"Error extracting text: {str(e)}", file=sys.stderr)
        return None

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python extract_text.py <file_path>", file=sys.stderr)
        sys.exit(1)

    file_path = sys.argv[1]
    text = extract_text(file_path)
    
    if text is not None:
        print(text)
        sys.exit(0)
    else:
        sys.exit(1) 