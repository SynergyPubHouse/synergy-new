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
    output_dir = (
        os.path.dirname(input_file)
        if not output_file
        else os.path.dirname(os.path.abspath(output_file))
    )

    # LibreOffice executable paths (try multiple locations)
    libreoffice_paths = [
        r"C:\Program Files\LibreOffice\program\soffice.bin",
        r"C:\Program Files\LibreOffice\program\soffice.exe",
        r"C:\Program Files (x86)\LibreOffice\program\soffice.bin",
        r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
        "libreoffice",  # In case it's in PATH
        "soffice",  # Alternative command name
    ]

    libreoffice_exe = None
    for path in libreoffice_paths:
        if os.path.exists(path):
            libreoffice_exe = path
            break
        else:
            # Try to find it using where command
            try:
                result = subprocess.run(["where", path], capture_output=True, text=True)
                if result.returncode == 0:
                    libreoffice_exe = result.stdout.strip().split("\n")[0]
                    break
            except:
                continue

    if not libreoffice_exe:
        print(
            "LibreOffice not found. Please ensure LibreOffice is installed.",
            file=sys.stderr,
        )
        return False

    print(f"Using LibreOffice at: {libreoffice_exe}")

    try:
        # Create a temporary working directory for LibreOffice
        temp_dir = os.path.join(os.path.dirname(input_file), "temp_conversion")
        os.makedirs(temp_dir, exist_ok=True)

        # Copy input file to temp directory to avoid path issues
        import shutil

        temp_input = os.path.join(temp_dir, os.path.basename(input_file))
        shutil.copy2(input_file, temp_input)

        print(f"Converting {temp_input} using LibreOffice...")

        result = subprocess.run(
            [
                libreoffice_exe,
                "--headless",
                "--invisible",
                "--nodefault",
                "--nolockcheck",
                "--nologo",
                "--norestore",
                "--convert-to",
                "pdf:writer_pdf_Export",
                "--outdir",
                temp_dir,
                temp_input,
            ],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=60,
        )

        # Print LibreOffice output for debugging
        if result.stdout:
            print(f"LibreOffice stdout: {result.stdout}")
        if result.stderr:
            print(f"LibreOffice stderr: {result.stderr}")

        # Check if output file was generated in temp directory
        temp_pdf = os.path.join(temp_dir, Path(temp_input).with_suffix(".pdf").name)

        if os.path.exists(temp_pdf) and os.path.getsize(temp_pdf) > 0:
            # Determine final output path
            if output_file:
                final_output = os.path.abspath(output_file)
            else:
                final_output = str(Path(input_file).with_suffix(".pdf"))

            # Move the generated PDF to the final location
            shutil.move(temp_pdf, final_output)

            # Clean up temp directory
            try:
                shutil.rmtree(temp_dir)
            except:
                pass

            print(f"Conversion successful! PDF created at: {final_output}")
            return True
        else:
            print("PDF was not created or is empty", file=sys.stderr)
            # Clean up temp directory
            try:
                shutil.rmtree(temp_dir)
            except:
                pass
            return False

    except subprocess.TimeoutExpired:
        print("LibreOffice conversion timed out", file=sys.stderr)
        return False
    except subprocess.CalledProcessError as e:
        print(
            f"LibreOffice command failed with exit code {e.returncode}", file=sys.stderr
        )
        if e.stdout:
            print(f"stdout: {e.stdout}", file=sys.stderr)
        if e.stderr:
            print(f"stderr: {e.stderr}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"Unexpected error: {str(e)}", file=sys.stderr)
        return False


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(
            "Usage: python convertToPdf.py <input_file> [output_file]", file=sys.stderr
        )
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None

    success = convert_to_pdf(input_file, output_file)
    sys.exit(0 if success else 1)
