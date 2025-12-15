FROM debian:bookworm-slim

# 🔥 Install everything in one layer
RUN apt-get update && apt-get install -y --no-install-recommends \
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
    # 🔥 LibreOffice - Install FULL package
    libreoffice \
    libreoffice-writer \
    libreoffice-common \
    # 🔥 Fonts
    fonts-liberation \
    fonts-liberation2 \
    fonts-dejavu \
    fonts-dejavu-core \
    fonts-freefont-ttf \
    fonts-noto \
    fontconfig \
    # 🔥 Chromium
    chromium \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    # 🔥 Verify LibreOffice installation
    && libreoffice --version \
    && which libreoffice \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# 🔥 Environment variables
ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=production
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
ENV HOME=/home/appuser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
# 🔥 ADD LibreOffice path to PATH
ENV PATH="/usr/bin:/usr/lib/libreoffice/program:${PATH}"

WORKDIR /app

# 🔥 Create directories with proper permissions BEFORE creating user
RUN mkdir -p /tmp/.libreoffice \
    && mkdir -p /app/backend/uploads \
    && mkdir -p /home/appuser/.config/libreoffice \
    && chmod -R 777 /tmp \
    && chmod -R 755 /app

# Backend setup
COPY backend/package*.json ./backend/
COPY backend/requirements.txt ./backend/

WORKDIR /app/backend

# Python virtualenv
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:${PATH}"

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt \
    && python -m spacy download en_core_web_sm --no-cache-dir

# Node dependencies
RUN npm install --production

# Copy source
COPY backend/ ./

# Create non-root user
RUN useradd -m -u 1001 appuser \
    && chown -R appuser:appuser /app /home/appuser /tmp/.libreoffice /opt/venv

USER appuser

# 🔥 Verify as appuser
RUN libreoffice --version && echo "LibreOffice OK as appuser"

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
    CMD curl -f http://localhost:5000/health || exit 1

CMD ["node", "server.js"]