# Use full Debian-based Node image (not slim!)
FROM node:18-bullseye AS runtime

# ✅ Install LibreOffice with all dependencies
RUN apt-get update && apt-get install -y \
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
    curl \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && fc-cache -f -v

# Install build tools required for spaCy
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    make \
    libopenblas-dev \
    liblapack-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# ✅ Create symlink for libreoffice command
RUN ln -sf /usr/bin/soffice /usr/bin/libreoffice || true

# ✅ Verify LibreOffice installed
RUN which soffice && soffice --version || echo "LibreOffice check"

# Environment variables
ENV LIBREOFFICE_BIN=/usr/bin/soffice
ENV PATH="/usr/bin:/usr/lib/libreoffice/program:$PATH"
ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=production
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

# Create directories
RUN mkdir -p /tmp/.libreoffice && chmod 777 /tmp
RUN mkdir -p /home/appuser && chmod 755 /home/appuser

WORKDIR /app

# Copy backend files
COPY backend/package*.json ./backend/
COPY backend/requirements.txt ./backend/

WORKDIR /app/backend

# Python setup
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    python -m spacy download en_core_web_sm --no-cache-dir

# Node dependencies
RUN npm install --production

# Copy source
COPY backend/ ./

# Uploads directory
RUN mkdir -p uploads && chmod 755 uploads

# Non-root user
RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /app /home/appuser
USER appuser

ENV HOME=/home/appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
    CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]