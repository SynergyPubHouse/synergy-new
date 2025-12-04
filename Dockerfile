# Use full Debian-based Node image (not slim!)
FROM node:18-bullseye AS runtime

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice \
    libreoffice-writer \
    libreoffice-common \
    fonts-dejavu \
    fonts-liberation \
    fonts-noto \
    fonts-freefont-ttf \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && fc-cache -f -v

# Install build tools required for spaCy / blis
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    make \
    libopenblas-dev \
    liblapack-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# ✅ FIX: Create symlink so "libreoffice" command works
RUN ln -sf /usr/bin/soffice /usr/bin/libreoffice

# Verify LibreOffice installation (both commands)
RUN which soffice && soffice --version
RUN which libreoffice && libreoffice --version

# Set environment - provide both paths
ENV LIBREOFFICE_BIN=/usr/bin/soffice
ENV SOFFICE_BIN=/usr/bin/soffice
ENV PATH="/usr/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=production
ENV USE_PUPPETEER_FALLBACK=false

# Set default locale
ENV LANG=C.UTF-8 \
    LANGUAGE=C.UTF-8 \
    LC_ALL=C.UTF-8

WORKDIR /app

# Copy backend files
COPY backend/package*.json ./backend/
COPY backend/requirements.txt ./backend/

# Install backend dependencies
WORKDIR /app/backend

# Python venv
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    python -m spacy download en_core_web_sm --no-cache-dir

# Install Node dependencies
RUN npm install --production

# Copy backend source
COPY backend/ ./        

# Uploads directory
RUN mkdir -p uploads && chmod 755 uploads

# ✅ FIX: Create temp directory for LibreOffice with proper permissions
RUN mkdir -p /tmp/.libreoffice && chmod 777 /tmp/.libreoffice

# Non-root user
RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /app
USER appuser

# ✅ FIX: Set HOME for LibreOffice profile
ENV HOME=/home/appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
    CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]