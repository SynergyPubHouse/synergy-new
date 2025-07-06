import sys
import os
import subprocess
from pathlib import Path

def convert_to_pdf(input_file, output_file=None):
    """
    Convert a DOCX file to PDF using LibreOffice
    """
    input_file = os.path.abspath(input_file)
    if not os.path.exists(input_file):
        print(f"Input file '{input_file}' does not exist", file=sys.stderr)
        return False

    # Set output directory
    output_dir = os.path.dirname(input_file) if not output_file else os.path.dirname(os.path.abspath(output_file))

    try:
        result = subprocess.run([
            "libreoffice",
            "--headless",
            "--convert-to", "pdf",
            "--outdir", output_dir,
            input_file
        ], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        # Print LibreOffice output (optional for debugging)
        print(result.stdout.decode())
        print(result.stderr.decode(), file=sys.stderr)

        # Check if output file was generated
        generated_pdf = Path(input_file).with_suffix('.pdf')
        output_path = os.path.join(output_dir, generated_pdf.name)

        if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            print("Conversion successful!")
            return True
        else:
            print("PDF was not created or is empty", file=sys.stderr)
            return False

    except subprocess.CalledProcessError as e:
        print(f"Error running LibreOffice: {e.stderr.decode()}", file=sys.stderr)
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python convertToPdf.py <input_file> [output_file]", file=sys.stderr)
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None

    success = convert_to_pdf(input_file, output_file)
    sys.exit(0 if success else 1)
