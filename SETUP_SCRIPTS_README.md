# Synergy World Press - Setup Scripts

This directory contains Windows batch scripts to help you quickly set up and run the Synergy World Press application.

## Scripts Overview

### 1. `setup-full.bat` - Complete Setup (Recommended for first time)
**Use this for initial setup or when you need to reinstall everything.**

**What it does:**
- ✅ Checks all prerequisites (Docker, Node.js, Python)
- ✅ Creates sample environment files (.env)
- ✅ Builds and starts Docker services (MongoDB)
- ✅ Installs all Node.js dependencies (backend & frontend)
- ✅ Installs Python dependencies (backend)
- ✅ Verifies database connection
- ✅ Starts both backend and frontend servers
- ✅ Opens application in browser

**Usage:**
```bash
./setup-full.bat
```

### 2. `start-dev.bat` - Quick Development Start
**Use this for daily development after initial setup.**

**What it does:**
- ✅ Starts Docker services
- ✅ Starts backend server (npm run dev)
- ✅ Starts frontend server (npm run dev)

**Usage:**
```bash
./start-dev.bat
```

### 3. `setup-and-run.bat` - Simple Setup & Run
**Basic setup script with essential functionality.**

**What it does:**
- ✅ Checks prerequisites
- ✅ Starts Docker services
- ✅ Installs dependencies
- ✅ Starts both servers

**Usage:**
```bash
./setup-and-run.bat
```

### 4. `cleanup.bat` - Clean Environment
**Use this to clean up your development environment.**

**What it does:**
- ✅ Stops all Docker containers
- ✅ Stops Node.js processes
- ✅ Cleans Docker system
- ✅ Cleans npm cache

**Usage:**
```bash
./cleanup.bat
```

## Prerequisites

Before running any script, make sure you have:

1. **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
2. **Node.js (v16+)** - [Download here](https://nodejs.org/)
3. **Python (v3.8+)** - [Download here](https://python.org/)

## First Time Setup

1. Clone the repository
2. Run `setup-full.bat`
3. Configure your environment files (see below)
4. Access the application at http://localhost:3000

## Environment Configuration

### Backend (.env)
After running the setup script, configure `backend/.env`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/synergy-world-press

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Server
PORT=5000
NODE_ENV=development

# Cloudinary (required for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (.env)
Configure `frontend/.env`:

```env
VITE_BACKEND_URL=http://localhost:5000/api
VITE_APP_NAME=Synergy World Press
```

## Service URLs

After running the scripts:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **MongoDB:** mongodb://localhost:27017

## Troubleshooting

### Docker Issues
```bash
# Check if Docker is running
docker --version

# Restart Docker Desktop
# Stop all containers
docker-compose down

# Remove all containers and start fresh
./cleanup.bat
./setup-full.bat
```

### Port Conflicts
If ports 3000, 5000, or 27017 are already in use:

1. Stop the processes using those ports
2. Or modify the ports in:
   - `docker-compose.yml` (for MongoDB)
   - `backend/package.json` (for backend)
   - `frontend/vite.config.js` (for frontend)

### Node.js Issues
```bash
# Clear npm cache and reinstall
./cleanup.bat

# Delete node_modules folders
rmdir /s backend\node_modules
rmdir /s frontend\node_modules

# Run setup again
./setup-full.bat
```

### Python Dependencies Issues
```bash
# Update pip
python -m pip install --upgrade pip

# Install requirements manually
cd backend
pip install -r requirements.txt
```

## Development Workflow

### Daily Development
```bash
# Start everything
./start-dev.bat

# Your work here...

# Stop everything (close the command windows or Ctrl+C)
```

### Making Changes
- Backend changes: Server auto-restarts (nodemon)
- Frontend changes: Hot reload in browser
- Database changes: Use MongoDB Compass or command line

### Deploying Updates
```bash
# Stop everything
./cleanup.bat

# Update dependencies and restart
./setup-full.bat
```

## Manual Commands

If you prefer running commands manually:

```bash
# Start MongoDB
docker-compose up -d

# Backend
cd backend
npm install
npm run dev

# Frontend (in new terminal)
cd frontend
npm install
npm run dev
```

## Support

If you encounter issues:

1. Check the error messages in the command windows
2. Verify all prerequisites are installed
3. Check the environment files
4. Try running `cleanup.bat` and then `setup-full.bat`
5. Check Docker Desktop is running and has enough resources

## Script Details

All scripts are designed to:
- ✅ Check prerequisites before starting
- ✅ Provide clear error messages
- ✅ Handle common failure scenarios
- ✅ Open servers in separate windows for easy monitoring
- ✅ Work on Windows 10/11

The scripts will create two command windows:
- "Backend - Synergy World Press" - Shows backend logs
- "Frontend - Synergy World Press" - Shows frontend logs

Close these windows to stop the respective servers.
