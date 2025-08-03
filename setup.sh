#!/bin/bash

# Synergy World Press - Setup Script
# This script will set up the development environment for the Synergy World Press application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Synergy World Press Setup Script     ${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    echo -e "${YELLOW}Visit: https://docs.docker.com/get-docker/${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    echo -e "${YELLOW}Visit: https://docs.docker.com/compose/install/${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"

# Create necessary directories
echo -e "${YELLOW}📁 Creating necessary directories...${NC}"
mkdir -p backend/uploads
mkdir -p ssl
chmod 755 backend/uploads

# Check if .env files exist, if not create templates
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}📝 Creating backend .env file...${NC}"
    cp backend/.env.example backend/.env 2>/dev/null || cat > backend/.env << EOF
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

if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}📝 Creating frontend .env file...${NC}"
    cp frontend/.env.example frontend/.env 2>/dev/null || cat > frontend/.env << EOF
VITE_BACKEND_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=535987113890-a29juotrj2v2c5lj56ot6cqe4kge4sam.apps.googleusercontent.com
VITE_ORCID_CLIENT_ID=APP-5755KPXN4H7PWAYU
EOF
fi

# Function to install dependencies locally (optional)
install_local_deps() {
    echo -e "${YELLOW}📦 Installing local dependencies...${NC}"
    
    if [ -d "backend" ]; then
        echo -e "${BLUE}Installing backend dependencies...${NC}"
        cd backend
        npm install
        cd ..
    fi
    
    if [ -d "frontend" ]; then
        echo -e "${BLUE}Installing frontend dependencies...${NC}"
        cd frontend
        npm install
        cd ..
    fi
}

# Main menu
echo -e "${BLUE}Choose setup option:${NC}"
echo -e "${GREEN}1) Development environment (with hot reload)${NC}"
echo -e "${GREEN}2) Production environment${NC}"
echo -e "${GREEN}3) Install local dependencies only${NC}"
echo -e "${GREEN}4) Clean up Docker containers and images${NC}"

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo -e "${YELLOW}🚀 Setting up development environment...${NC}"
        docker-compose --profile dev up --build -d
        echo -e "${GREEN}✅ Development environment is ready!${NC}"
        echo -e "${BLUE}Frontend: http://localhost:5173${NC}"
        echo -e "${BLUE}Backend: http://localhost:5000${NC}"
        echo -e "${BLUE}MongoDB: localhost:27017${NC}"
        ;;
    2)
        echo -e "${YELLOW}🚀 Setting up production environment...${NC}"
        docker-compose --profile prod up --build -d
        echo -e "${GREEN}✅ Production environment is ready!${NC}"
        echo -e "${BLUE}Application: http://localhost:5000${NC}"
        echo -e "${BLUE}MongoDB: localhost:27017${NC}"
        ;;
    3)
        install_local_deps
        echo -e "${GREEN}✅ Local dependencies installed!${NC}"
        ;;
    4)
        echo -e "${YELLOW}🧹 Cleaning up Docker containers and images...${NC}"
        docker-compose down --volumes --rmi all
        docker system prune -f
        echo -e "${GREEN}✅ Cleanup completed!${NC}"
        ;;
    *)
        echo -e "${RED}❌ Invalid choice. Please run the script again.${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo -e "${YELLOW}📚 Useful commands:${NC}"
echo -e "${BLUE}  - View logs: docker-compose logs -f${NC}"
echo -e "${BLUE}  - Stop services: docker-compose down${NC}"
echo -e "${BLUE}  - Restart services: docker-compose restart${NC}"
echo -e "${BLUE}  - Access MongoDB: docker exec -it synergy-mongodb mongosh${NC}"
