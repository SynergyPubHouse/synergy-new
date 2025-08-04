#!/bin/bash

# Synergy World Press - Linux Setup Script
# This script sets up the development environment for the Synergy World Press app

echo "========================================"
echo "  Synergy World Press Setup Script      "
echo "========================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/engine/install/"
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available. Please ensure Docker is properly installed."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p backend/uploads
mkdir -p ssl

# Create backend .env if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend .env file..."
    cat <<EOF > backend/.env
MONGO_URI=mongodb://admin:password123@mongodb:27017/synergy-world-press?authSource=admin
JWT_SECRET=86aa472c0f95b28de7e9c700c170c74ac1019baaf1be82c6cfeced4788eaaddd8649edcb1934e1562c823b402643cf533b84a59c72ec9230c843c5f0d4a26724
GOOGLE_CLIENT_ID=535987113890-a29juotrj2v2c5lj56ot6cqe4kge4sam.apps.googleusercontent.com
ORCID_CLIENT_ID=APP-5755KPXN4H7PWAYU
ORCID_CLIENT_SECRET=fd757db3-47d8-44f4-ba97-2045bb8c46ff
USE_GOOGLE_DRIVE=false
BASE_URL=http://localhost:5000
GOOGLE_DRIVE_FOLDER_ID=1FxiUnrnUn6HfaiB0s-ch6ChaEiDnj1E4
GOOGLE_DRIVE_MANUSCRIPTS_FOLDER=1FxiUnrnUn6HfaiB0s-ch6ChaEiDnj1E4
GOOGLE_DRIVE_COVERLETTERS_FOLDER=1FxiUnrnUn6HfaiB0s-ch6ChaEiDnj1E4
GOOGLE_DRIVE_DECLARATIONS_FOLDER=1FxiUnrnUn6HfaiB0s-ch6ChaEiDnj1E4
GOOGLE_DRIVE_MERGED_FOLDER=1FxiUnrnUn6HfaiB0s-ch6ChaEiDnj1E4
EOF
fi

# Create frontend .env if it doesn't exist
if [ ! -f frontend/.env ]; then
    echo "📝 Creating frontend .env file..."
    cat <<EOF > frontend/.env
VITE_BACKEND_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=535987113890-a29juotrj2v2c5lj56ot6cqe4kge4sam.apps.googleusercontent.com
VITE_ORCID_CLIENT_ID=APP-5755KPXN4H7PWAYU
EOF
fi

# Main menu
echo ""
echo "Choose setup option:"
echo "1) Development environment (with hot reload)"
echo "2) Production environment"
echo "3) Install local dependencies only"
echo "4) Clean up Docker containers and images"

read -p "Enter your choice (1-4): " choice

if [[ "$choice" == "1" ]]; then
    echo "🚀 Setting up development environment..."
    docker compose --profile dev up --build -d
    echo "✅ Development environment is ready!"
    echo "Frontend: http://localhost:5173"
    echo "Backend: http://localhost:5000"
    echo "MongoDB: localhost:27017"
elif [[ "$choice" == "2" ]]; then
    echo "🚀 Setting up production environment..."
    docker compose --profile prod up --build -d
    echo "✅ Production environment is ready!"
    echo "Application: http://localhost:5000"
    echo "MongoDB: localhost:27017"
elif [[ "$choice" == "3" ]]; then
    echo "📦 Installing local dependencies..."
    if [ -d backend ]; then
        echo "Installing backend dependencies..."
        (cd backend && npm install)
    fi
    if [ -d frontend ]; then
        echo "Installing frontend dependencies..."
        (cd frontend && npm install)
    fi
    echo "✅ Local dependencies installed!"
elif [[ "$choice" == "4" ]]; then
    echo "🧹 Cleaning up Docker containers and images..."
    docker compose down --volumes --rmi all
    docker system prune -f
    echo "✅ Cleanup completed!"
else
    echo "❌ Invalid choice. Please run the script again."
    exit 1
fi

echo ""
echo "🎉 Setup completed successfully!"
echo "📚 Useful commands:"
echo "  - View logs: docker compose logs -f"
echo "  - Stop services: docker compose down"
echo "  - Restart services: docker compose restart"
echo "  - Access MongoDB: docker exec -it synergy-mongodb mongosh"
