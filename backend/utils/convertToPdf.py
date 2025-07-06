# import sys
# import os
# from pathlib import Path
# import win32com.client
# import time
# import pythoncom

# def convert_to_pdf(input_file, output_file=None):
#     """
#     Convert a DOCX file to PDF using Microsoft Word
#     :param input_file: Path to the input DOCX file
#     :param output_file: Path to the output PDF file (optional)
#     """
#     word = None
#     try:
#         # Initialize COM
#         pythoncom.CoInitialize()
        
#         # Convert to absolute paths
#         input_file = os.path.abspath(input_file)
#         if not output_file:
#             output_file = str(Path(input_file).with_suffix('.pdf'))
#         output_file = os.path.abspath(output_file)

#         print(f"Converting: {input_file} -> {output_file}")

#         # Check if input file exists
#         if not os.path.exists(input_file):
#             print(f"Error: Input file '{input_file}' does not exist", file=sys.stderr)
#             return False

#         # Get file extension
#         file_ext = Path(input_file).suffix.lower()
        
#         # Check if it's a .doc or .docx file
#         if file_ext not in ['.doc', '.docx']:
#             print(f"Error: Input file must be a .doc or .docx file, got {file_ext}", file=sys.stderr)
#             return False

#         # Initialize Word with retry
#         for attempt in range(3):  # Try 3 times
#             try:
#                 word = win32com.client.DispatchEx('Word.Application')
#                 word.Visible = False
#                 word.DisplayAlerts = False
#                 break
#             except Exception as e:
#                 print(f"Attempt {attempt + 1} failed to start Word: {str(e)}", file=sys.stderr)
#                 if word:
#                     try:
#                         word.Quit()
#                     except:
#                         pass
#                 time.sleep(2)  # Wait before retry
#                 if attempt == 2:  # Last attempt failed
#                     raise

#         # Open and convert
#         print("Opening document...")
#         doc = word.Documents.Open(input_file)
#         print("Saving as PDF...")
#         doc.SaveAs2(output_file, FileFormat=17)
#         doc.Close(False)
        
#         # Verify PDF was created
#         if os.path.exists(output_file) and os.path.getsize(output_file) > 0:
#             print("Conversion completed successfully!")
#             return True
#         else:
#             print("Error: PDF file was not created or is empty", file=sys.stderr)
#             return False

#     except Exception as e:
#         print(f"Error converting file: {str(e)}", file=sys.stderr)
#         return False

#     finally:
#         if word:
#             try:
#                 word.Quit()
#                 time.sleep(1)  # Give Word time to close properly
#             except:
#                 pass
#         pythoncom.CoUninitialize()

# if __name__ == "__main__":
#     # Check if input file is provided
#     if len(sys.argv) < 2:
#         print("Usage: python docxtopdf.py <input_file> [output_file]", file=sys.stderr)
#         sys.exit(1)

#     input_file = sys.argv[1]
#     output_file = sys.argv[2] if len(sys.argv) > 2 else None

#     # Convert the file
#     success = convert_to_pdf(input_file, output_file)
#     sys.exit(0 if success else 1) 


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
