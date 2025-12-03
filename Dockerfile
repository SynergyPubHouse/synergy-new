# # Multi-stage build for Synergy World Press Application
# # Stage 1: Build the frontend
# FROM node:18-alpine AS frontend-builder

# WORKDIR /app/frontend

# # Copy frontend package files
# COPY frontend/package*.json ./

# # Install frontend dependencies
# RUN npm ci 

# # Copy the rest of the frontend code
# COPY frontend/ ./

# # Build the frontend
# RUN npm run build

# # Stage 2: Setup backend with Python support
# FROM python:3.10-slim AS backend

# # Install system dependencies
# RUN apt-get update && apt-get install -y \
#     curl \
#     gnupg \
#     build-essential \
#     libreoffice \
#     && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
#     && apt-get install -y nodejs \
#     && apt-get clean \
#     && rm -rf /var/lib/apt/lists/*

# # Set working directory
# WORKDIR /app

# # Copy backend package files first for better caching
# COPY backend/package*.json ./backend/
# COPY backend/requirements.txt ./backend/

# # Install backend dependencies
# WORKDIR /app/backend
# RUN npm ci 
# RUN pip install --no-cache-dir -r requirements.txt
# RUN python -m spacy download en_core_web_sm

# # Copy backend source code
# COPY backend/ ./

# # Copy built frontend from the previous stage
# COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# # Create uploads directory and set permissions
# RUN mkdir -p uploads && chmod 755 uploads

# # Create a non-root user for security
# RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /app
# USER appuser

# # Expose the port
# EXPOSE 5000

# # Health check
# HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
#   CMD curl -f http://localhost:5000/api/health || exit 1

# # Start the backend server
# CMD ["node", "server.js"]



# # Backend-only Dockerfile for Synergy World Press Application
# FROM python:3.10-slim AS backend

# # Install system dependencies
# RUN apt-get update && apt-get install -y \
#     curl \
#     gnupg \
#     build-essential \
#     libreoffice \
#     && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
#     && apt-get install -y nodejs \
#     && apt-get clean \
#     && rm -rf /var/lib/apt/lists/*

# # Set working directory
# WORKDIR /app/backend

# # Copy backend package files and requirements
# COPY backend/package*.json ./
# COPY backend/requirements.txt ./

# # Install backend dependencies
# RUN npm ci
# RUN pip install --no-cache-dir -r requirements.txt
# RUN python -m spacy download en_core_web_sm

# # Copy backend source code
# COPY backend/ ./

# # Create uploads directory and set permissions
# RUN mkdir -p uploads && chmod 755 uploads

# # Create a non-root user for security
# RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /app
# USER appuser

# # Expose backend port
# EXPOSE 5000

# # Health check
# HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
#   CMD curl -f http://localhost:5000/api/health || exit 1

# # Start the backend server
# CMD ["node", "server.js"]







# Backend-only Dockerfile for Synergy World Press Application
FROM python:3.10-slim AS backend# Multi-stage: Build backend + frontend using official LibreOffice image
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

