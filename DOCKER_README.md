# Synergy World Press - Docker Setup Guide

This guide will help you set up the Synergy World Press application using Docker and Docker Compose.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose
- Git

## Quick Start

### Option 1: Automated Setup (Recommended)

**Windows:**
```bash
./setup.bat
```

**Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

### Option 2: Manual Setup

1. **Clone the repository:**
```bash
git clone <repository-url>
cd Synergy-World-Press
```

2. **Create environment files:**
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. **Edit the environment files with your configurations**

4. **Start the development environment:**
```bash
docker-compose --profile dev up --build -d
```

## Available Environments

### Development Environment
- **Frontend**: http://localhost:5173 (Vite dev server with hot reload)
- **Backend**: http://localhost:5000 (Nodemon for auto-restart)
- **MongoDB**: localhost:27017

```bash
docker-compose --profile dev up --build -d
```

### Production Environment
- **Application**: http://localhost:5000 (Combined frontend + backend)
- **MongoDB**: localhost:27017

```bash
docker-compose --profile prod up --build -d
```

## Services Overview

### MongoDB
- **Image**: mongo:6.0
- **Port**: 27017
- **Database**: synergy-world-press
- **Credentials**: admin/password123

### Backend (Development)
- **Base Image**: python:3.10-slim
- **Port**: 5000
- **Features**: Node.js, Python, LibreOffice, Nodemon
- **Volume Mounts**: Source code, uploads

### Frontend (Development)
- **Base Image**: node:18-alpine  
- **Port**: 5173
- **Features**: Vite dev server, hot reload
- **Volume Mounts**: Source code

### Production App
- **Multi-stage build**: Frontend build + Backend runtime
- **Port**: 5000
- **Features**: Optimized production build

## Useful Commands

### Container Management
```bash
# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend-dev

# Stop all services
docker-compose down

# Stop and remove everything including volumes
docker-compose down --volumes

# Restart services
docker-compose restart

# Rebuild and start
docker-compose up --build -d
```

### Database Access
```bash
# Access MongoDB shell
docker exec -it synergy-mongodb mongosh

# Connect to the application database
docker exec -it synergy-mongodb mongosh synergy-world-press
```

### File Management
```bash
# Copy files to/from containers
docker cp file.txt synergy-backend-dev:/app/backend/
docker cp synergy-backend-dev:/app/backend/uploads/file.pdf ./
```

## Environment Variables

### Backend (.env)
```env
MONGO_URI=mongodb://admin:password123@mongodb:27017/synergy-world-press?authSource=admin
JWT_SECRET=your-jwt-secret
GOOGLE_CLIENT_ID=your-google-client-id
ORCID_CLIENT_ID=your-orcid-client-id
ORCID_CLIENT_SECRET=your-orcid-client-secret
USE_GOOGLE_DRIVE=false
BASE_URL=http://localhost:5000
GOOGLE_DRIVE_FOLDER_ID=your-folder-id
```

### Frontend (.env)
```env
VITE_BACKEND_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_ORCID_CLIENT_ID=your-orcid-client-id
```

## File Structure
```
Synergy-World-Press/
├── backend/
│   ├── Dockerfile.dev          # Development backend image
│   ├── .env                    # Backend environment variables
│   ├── .env.example           # Backend environment template
│   └── ...
├── frontend/
│   ├── Dockerfile.dev          # Development frontend image
│   ├── .env                    # Frontend environment variables  
│   ├── .env.example           # Frontend environment template
│   └── ...
├── Dockerfile                  # Production multi-stage build
├── docker-compose.yml          # Services orchestration
├── mongo-init.js              # MongoDB initialization script
├── setup.sh                   # Linux/Mac setup script
├── setup.bat                  # Windows setup script
└── DOCKER_README.md           # This file
```

## Troubleshooting

### Port Conflicts
If you get port conflicts, you can change the ports in `docker-compose.yml`:
```yaml
ports:
  - "3000:5173"  # Change first number to available port
```

### Permission Issues (Linux)
```bash
sudo chown -R $USER:$USER backend/uploads
sudo chmod 755 backend/uploads
```

### Clear Everything and Start Fresh
```bash
docker-compose down --volumes --rmi all
docker system prune -a -f
./setup.sh  # or setup.bat on Windows
```

### Database Connection Issues
Make sure the MongoDB container is running:
```bash
docker-compose ps
docker-compose logs mongodb
```

### View Container Status
```bash
docker-compose ps
docker-compose top
```

## Production Deployment

For production deployment, consider:

1. **Use external MongoDB** (MongoDB Atlas, etc.)
2. **Set up proper SSL certificates**
3. **Configure Nginx reverse proxy**
4. **Set up proper logging and monitoring**
5. **Use Docker secrets for sensitive data**
6. **Set up backup strategies**

Example production command:
```bash
docker-compose --profile prod up -d
```

## Security Considerations

1. **Change default passwords** in production
2. **Use environment variables** for secrets
3. **Enable authentication** on MongoDB
4. **Use HTTPS** in production
5. **Regularly update** Docker images
6. **Scan images** for vulnerabilities

## Support

If you encounter issues:
1. Check the logs: `docker-compose logs -f`
2. Verify environment variables are set correctly
3. Ensure Docker has enough resources allocated
4. Check firewall settings for port access

For more help, consult the main project README or open an issue.
