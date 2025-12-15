FROM debian:bookworm-slim AS runtime

# Install Node.js 18, LibreOffice, and required dependencies
RUN apt-get update && \
    apt-get install -y \
    curl \
    ca-certificates \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    gcc \
    g++ \
    make \
    libopenblas-dev \
    liblapack-dev \
    python3-dev \
    # ✅ LibreOffice (ALREADY HAVE)
    libreoffice \
    libreoffice-writer \
    # 🔥🔥 ADD THESE FOR BETTER SUPPORT:
    libreoffice-calc \
    libreoffice-impress \
    libreoffice-draw \
    # ✅ Fonts (ADD MORE)
    fonts-liberation \
    fonts-liberation2 \
    fonts-dejavu \
    fonts-dejavu-core \
    fonts-dejavu-extra \
    fonts-freefont-ttf \
    # 🔥🔥 ADD THESE IMPORTANT FONTS:
    fonts-noto \
    fonts-noto-cjk \
    fonts-opensymbol \
    fonts-crosextra-carlito \
    fonts-crosextra-caladea \
    # Chromium for Puppeteer
    chromium \
    && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# 🔥🔥 ADD: Verify LibreOffice installation
RUN libreoffice --version

# Environment
ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=production
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
# Puppeteer environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 🔥🔥 ADD THESE LIBREOFFICE VARIABLES:
ENV LIBREOFFICE_PATH=/usr/bin/libreoffice
ENV LIBREOFFICE_BIN=/usr/bin/soffice
ENV USE_LOCAL_LIBREOFFICE=true
ENV USE_REMOTE_CONVERTER=false
ENV USE_PUPPETEER_FALLBACK=false
ENV SAL_USE_VCLPLUGIN=svp
ENV SAL_DISABLE_OPENCL=1

# Create app directories
WORKDIR /app
# 🔥🔥 IMPROVED: Better temp directory setup for LibreOffice
RUN mkdir -p /tmp/.libreoffice /tmp/libreoffice-profiles /tmp/uploads /tmp/conversions && \
    chmod -R 777 /tmp
RUN mkdir -p /home/appuser && chmod 755 /home/appuser

# --- Backend setup ---

# Copy backend descriptors first for caching
COPY backend/package*.json ./backend/
COPY backend/requirements.txt ./backend/

WORKDIR /app/backend

# Python virtualenv + requirements + spaCy model
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:${PATH}"

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    python -m spacy download en_core_web_sm --no-cache-dir

# Install Node dependencies
RUN npm install --production

# Copy the rest of the backend source
COPY backend/ ./

# Uploads directory
RUN mkdir -p uploads && chmod 755 uploads

# --- User + runtime ---

# Non-root user
# 🔥🔥 IMPROVED: Give appuser ownership of all temp directories
RUN useradd -m -u 1001 appuser && \
    chown -R appuser:appuser /app /home/appuser /tmp/.libreoffice /tmp/libreoffice-profiles /tmp/uploads /tmp/conversions
    
USER appuser
ENV HOME=/home/appuser

EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
    CMD curl -f http://localhost:5000/health || exit 1

# Start your Node server
CMD ["node", "server.js"]