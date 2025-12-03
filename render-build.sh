#!/bin/bash
set -e

echo "🚀 Starting Render build process..."

# Install LibreOffice and dependencies
echo "📦 Installing LibreOffice and system dependencies..."
apt-get update
apt-get install -y --no-install-recommends \
    libreoffice \
    fonts-dejavu-core \
    fonts-liberation \
    fontconfig \
    python3 \
    python3-pip
fc-cache -f -v

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
pip install --no-cache-dir -r backend/requirements.txt
python3 -m spacy download en_core_web_sm

# Install Node dependencies
echo "📚 Installing Node dependencies..."
npm --prefix backend install --omit=dev

echo "✅ Build process completed successfully!"
