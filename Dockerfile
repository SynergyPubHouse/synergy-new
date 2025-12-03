# Use official Node.js 18 image as base
FROM node:18-slim AS runtime

# Install system dependencies including LibreOffice
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice \
    fonts-dejavu \
    fonts-liberation \
    fonts-noto \
    fonts-freefont-ttf \
    libreoffice-common \
    libreoffice-writer \
    python3 \
    python3-pip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && fc-cache -f -v

# Verify LibreOffice installation
RUN soffice --version

# Set environment
ENV LIBREOFFICE_BIN=/usr/bin/soffice
ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=production
ENV USE_PUPPETEER_FALLBACK=false

# Set default locale
ENV LANG=C.UTF-8 \
    LANGUAGE=C.UTF-8 \
    LC_ALL=C.UTF-8

# Set working directory
WORKDIR /app

# Copy backend files
COPY backend/package*.json ./backend/
COPY backend/requirements.txt ./backend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm install --production && \
  pip install --no-cache-dir -r requirements.txt && \
  python -m spacy download en_core_web_sm

# Copy backend source code
COPY backend/ ./

# Copy frontend (if built)
COPY frontend/dist ./frontend/dist 2>/dev/null || true

# Create uploads directory
RUN mkdir -p uploads && chmod 755 uploads

# Create non-root user
RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start backend
CMD ["node", "server.js"]

