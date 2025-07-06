# Use Python base image
FROM python:3.10-slim

# Install system tools and Node.js
RUN apt-get update && apt-get install -y \
    curl gnupg build-essential libreoffice \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory to /app/backend
WORKDIR /app

# Copy everything (including backend/)
COPY . .

# Change working directory to backend where code actually lives
WORKDIR /app/backend

# Install Node.js and Python dependencies
RUN npm install
RUN pip install -r requirements.txt && python -m spacy download en_core_web_sm

# Expose your server port
EXPOSE 10000

# Start backend
CMD ["node", "server.js"]
