FROM node:18-bullseye AS runtime

# Install LibreOffice and dependencies (Debian-based)
RUN apt-get update && \
    apt-get install -y \
      libreoffice \
      libreoffice-writer \
      libreoffice-common \
      libreoffice-core \
      default-jre-headless \
      fonts-dejavu \
      fonts-liberation \
      fonts-noto \
      fonts-freefont-ttf \
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
      curl \
      ca-certificates \
    && apt-get clean && rm -rf /var/lib/apt/lists/* \
    && fc-cache -f -v

# Ensure both soffice and libreoffice exist
RUN ln -sf /usr/bin/soffice /usr/bin/libreoffice || true

# 3) Environment so Node libs can find LibreOffice
ENV LIBREOFFICE_BIN=/usr/bin/soffice
ENV PATH="/usr/bin:/usr/lib/libreoffice/program:${PATH}"
ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=production
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

# 4) Quick verification at build time
RUN which soffice && soffice --version || echo "LibreOffice check failed at build"

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
RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /app /home/appuser
USER appuser
ENV HOME=/home/appuser

EXPOSE 5000

# 12) Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# 13) Start your Node server
CMD ["node", "server.js"]
