# LibreOffice Docker Image Setup

## Quick Start

### Option 1: Use Pre-Built Image (Recommended)

If you don't want to build your own image, you can use a publicly available LibreOffice base image:

```bash
# Update Dockerfile to use:
FROM libreoffice:latest
```

Or use an Alpine-friendly variant:

```bash
FROM astuetz/libreoffice:latest
```

### Option 2: Build Your Own Base Image

If you want to build and push your own LibreOffice base image to Docker Hub:

1. **Install Docker** on your machine (if not already installed)

2. **Build the base image locally:**
   ```bash
   cd c:\Users\UnivisionzWin\Desktop\new\ syergy\Synergy-World-Press
   docker build -t yourdockerusername/synergy-base:latest -f Dockerfile.base .
   ```

3. **Log in to Docker Hub:**
   ```bash
   docker login
   ```

4. **Push to Docker Hub:**
   ```bash
   docker push yourdockerusername/synergy-base:latest
   ```

5. **Update `Dockerfile`** to use your image:
   ```dockerfile
   FROM yourdockerusername/synergy-base:latest AS runtime
   ```

6. **Push your code to git:**
   ```bash
   git add Dockerfile Dockerfile.base
   git commit -m "Use custom LibreOffice Docker base image"
   git push origin features/dev-prince
   ```

7. **On Render Dashboard:**
   - Go to synergy-world-press service
   - Click **Manual Deploy**
   - Watch the build — it should now use your pre-built base image with LibreOffice already installed

### Option 3: Use Public LibreOffice Image (Fastest)

The easiest approach: use an existing public LibreOffice Docker image:

```dockerfile
FROM libreoffice/libreoffice:latest
```

Then:
```bash
git add Dockerfile
git commit -m "Use public LibreOffice Docker image"
git push origin features/dev-prince
```

## Troubleshooting

If LibreOffice still isn't found after deploy:

1. Check Render logs for `soffice --version` output
2. Verify `LIBREOFFICE_BIN=/usr/bin/soffice` is set in render.yaml
3. Try Option 3 (public image) first — it's the most reliable

## Which Option?

- **Option 1 (Pre-built public)**: Fastest, no build time, most reliable ✅ **Recommended**
- **Option 2 (Build your own)**: Full control, but takes time to build
- **Option 3 (Public LibreOffice image)**: Simple, official, works well

Choose Option 1 or 3 for fastest results.
