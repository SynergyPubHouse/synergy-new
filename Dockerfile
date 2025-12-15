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
    # 🔥 ADD LibreOffice HERE
    libreoffice \
    libreoffice-writer \
    # 🔥 ADD Fonts for better PDF rendering
    fonts-liberation \
    fonts-dejavu \
    fonts-freefont-ttf \
    # 🔥 ADD Chromium for Puppeteer (if needed as fallback)
    chromium \
    && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# 3) Environment
ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=production
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
# 🔥 ADD Puppeteer environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 5) Create app directories
WORKDIR /app
RUN mkdir -p /tmp/.libreoffice && chmod 777 /tmp
RUN mkdir -p /home/appuser && chmod 755 /home/appuser

# --- Backend setup ---

# 6) Copy backend descriptors first for caching
COPY backend/package*.json ./backend/
COPY backend/requirements.txt ./backend/

WORKDIR /app/backend

# 7) Python virtualenv + requirements + spaCy model
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:${PATH}"

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    python -m spacy download en_core_web_sm --no-cache-dir

# 8) Install Node dependencies
RUN npm install --production

# 9) Copy the rest of the backend source
COPY backend/ ./

# 10) Uploads directory
RUN mkdir -p uploads && chmod 755 uploads

# --- User + runtime ---

# 11) Non-root user
RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /app /home/appuser /tmp/.libreoffice
USER appuser
ENV HOME=/home/appuser

EXPOSE 5000

# 12) Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
    CMD curl -f http://localhost:5000/health || exit 1

# 13) Start your Node server
CMD ["node", "server.js"]