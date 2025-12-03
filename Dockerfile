# Multi-stage: Build backend + frontend using official LibreOffice image
FROM libreoffice/libreoffice:latest AS base-with-libreoffice

# Install Node.js and Python dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
  curl \
  gnupg \
  ca-certificates \
  python3 \
  python3-pip \
  && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  && apt-get clean && apt-get autoclean && apt-get autoremove -y \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Verify LibreOffice installed
RUN soffice --version || echo "LibreOffice verification"

# Runtime stage
FROM base-with-libreoffice AS runtime

# Set environment
ENV LIBREOFFICE_BIN=/usr/bin/soffice
ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=production
ENV USE_PUPPETEER_FALLBACK=false

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

