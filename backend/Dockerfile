# Use Python base image (slim to keep it small)
FROM python:3.10-slim

# Install system-level tools and Node.js
RUN apt-get update && apt-get install -y \
    curl gnupg build-essential libreoffice \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Create working directory
WORKDIR /app

# Copy everything into container
COPY . .

# Install backend Node.js dependencies
RUN npm install

# Install Python requirements and download spaCy model
RUN pip install -r requirements.txt && python -m spacy download en_core_web_sm

# Expose your server's port (based on server.js)
EXPOSE 10000

# Start the backend server
CMD ["node", "server.js"]
