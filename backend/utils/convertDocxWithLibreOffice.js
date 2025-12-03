const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const os = require('os');

function expectedPdfPath(inputPath, outdir) {
  const parsed = path.parse(inputPath);
  return path.join(outdir || parsed.dir, parsed.name + '.pdf');
}

function runLibreOffice(bin, docxPath, outdir, timeoutMs) {
  return new Promise((resolve, reject) => {
    const args = ['--headless', '--convert-to', 'pdf', '--outdir', outdir, docxPath];
    const proc = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    let stdout = '';
    let finished = false;

    const timer = setTimeout(() => {
      if (finished) return;
      finished = true;
      try { proc.kill('SIGKILL'); } catch (_) {}
      reject(new Error(`LibreOffice timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('error', (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      reject(err);
    });

    proc.on('close', async (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      if (code !== 0) {
        return reject(new Error(`LibreOffice exited with code ${code}: ${stderr || stdout}`));
      }
      try {
        const pdfPath = expectedPdfPath(docxPath, outdir);
        const stats = await fs.stat(pdfPath);
        if (!stats || stats.size < 1024) {
          return reject(new Error('Generated PDF is too small or missing'));
        }
        resolve(pdfPath);
      } catch (e) {
        reject(new Error(`PDF output not found: ${e.message}`));
      }
    });
  });
}

function candidateBins() {
  const envBin = (process.env.LIBREOFFICE_BIN || '').trim();
  const list = [];
  if (envBin) list.push(envBin);

  if (process.platform === 'win32') {
    list.push('soffice');
    list.push('libreoffice');
    const pf = process.env['ProgramFiles'] || 'C:\\Program Files';
    const pfx86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    list.push(pf + '\\LibreOffice\\program\\soffice.exe');
    list.push(pf + '\\LibreOffice\\program\\soffice.com');
    if (pfx86) {
      list.push(pfx86 + '\\LibreOffice\\program\\soffice.exe');
      list.push(pfx86 + '\\LibreOffice\\program\\soffice.com');
    }
  } else if (process.platform === 'darwin') {
    list.push('soffice');
    list.push('libreoffice');
    list.push('/Applications/LibreOffice.app/Contents/MacOS/soffice');
  } else {
    // Linux (Render production): try explicit paths first
    list.push('/usr/bin/soffice');
    list.push('/usr/local/bin/soffice');
    list.push('soffice');
    list.push('libreoffice');
  }

  return list;
}

async function convertDocxWithLibreOffice(docxPath, timeoutMs = 300000) {
  console.log("[LO] convertDocxWithLibreOffice called for:", docxPath);

  const outdir = path.dirname(docxPath) || os.tmpdir();
  const candidates = candidateBins();
  console.log("[LO] Candidate LibreOffice binaries:", candidates);

  let lastErr = null;

  for (const bin of candidates) {
    try {
      // If bin is an absolute path, ensure it exists on disk (for Windows/macOS paths)
      if (bin.includes(path.sep) && !fsSync.existsSync(bin)) {
        console.log("[LO] Skipping non-existent binary:", bin);
        continue;
      }

      console.log("[LO] Trying LibreOffice binary:", bin);
      const pdfPath = await runLibreOffice(bin, docxPath, outdir, timeoutMs);
      console.log("[LO] LibreOffice conversion success:", pdfPath);
      return pdfPath;
    } catch (e) {
      console.error("[LO] LibreOffice attempt failed with", bin, "error:", e.message);
      lastErr = e;
      continue;
    }
  }

  const hint = process.platform === 'win32'
    ? 'Install LibreOffice and ensure soffice.exe is on PATH, or set LIBREOFFICE_BIN to e.g. C\\Program Files\\LibreOffice\\program\\soffice.exe'
    : 'Install LibreOffice and ensure soffice/libreoffice is on PATH, or set LIBREOFFICE_BIN with the binary path';

  const msg = `LibreOffice not found or failed to run. ${hint}. Last error: ${lastErr ? lastErr.message : 'unknown'}`;
  throw new Error(msg);
}


module.exports = { convertDocxWithLibreOffice };
