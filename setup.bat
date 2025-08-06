@echo off
REM Synergy World Press - Windows Setup Script
REM This script will set up the development environment for the Synergy World Press application

echo ========================================
echo   Synergy World Press Setup Script     
echo ========================================

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    echo Visit: https://docs.docker.com/desktop/install/windows/
    pause
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    docker compose version >nul 2>&1
    if errorlevel 1 (
        echo ❌ Docker Compose is not available. Please install Docker Desktop with Compose.
        pause
        exit /b 1
    )
)

echo ✅ Docker and Docker Compose are installed

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist "backend\uploads" mkdir backend\uploads
if not exist "ssl" mkdir ssl

REM Check if .env files exist, if not create templates
if not exist "backend\.env" (
    echo 📝 Creating backend .env file...
    (
        echo MONGO_URI=mongodb://admin:password123@mongodb:27017/synergy-world-press?authSource=admin
        echo JWT_SECRET=86aa472c0f95b28de7e9c700c170c74ac1019baaf1be82c6cfeced4788eaaddd8649edcb1934e1562c823b402643cf533b84a59c72ec9230c843c5f0d4a26724
        echo GOOGLE_CLIENT_ID=535987113890-a29juotrj2v2c5lj56ot6cqe4kge4sam.apps.googleusercontent.com
        echo ORCID_CLIENT_ID=APP-5755KPXN4H7PWAYU
        echo ORCID_CLIENT_SECRET=fd757db3-47d8-44f4-ba97-2045bb8c46ff
        echo USE_GOOGLE_DRIVE=false
        echo BASE_URL=http://localhost:5000
        echo GOOGLE_DRIVE_FOLDER_ID=1FxiUnrnUn6HfaiB0s-ch6ChaEiDnj1E4
        echo GOOGLE_DRIVE_MANUSCRIPTS_FOLDER=1FxiUnrnUn6HfaiB0s-ch6ChaEiDnj1E4
        echo GOOGLE_DRIVE_COVERLETTERS_FOLDER=1FxiUnrnUn6HfaiB0s-ch6ChaEiDnj1E4
        echo GOOGLE_DRIVE_DECLARATIONS_FOLDER=1FxiUnrnUn6HfaiB0s-ch6ChaEiDnj1E4
        echo GOOGLE_DRIVE_MERGED_FOLDER=1FxiUnrnUn6HfaiB0s-ch6ChaEiDnj1E4
        echo CLOUDINARY_CLOUD_NAME=di6piyfu8
        echo CLOUDINARY_API_KEY=922369985173375
        echo CLOUDINARY_API_SECRET=6_fECoSBG4pAA7I0BVnJD8VzwCk
    ) > backend\.env
)

if not exist "frontend\.env" (
    echo 📝 Creating frontend .env file...
    (
        echo VITE_BACKEND_URL=http://localhost:5000
        echo VITE_GOOGLE_CLIENT_ID=535987113890-a29juotrj2v2c5lj56ot6cqe4kge4sam.apps.googleusercontent.com
        echo VITE_ORCID_CLIENT_ID=APP-5755KPXN4H7PWAYU
    ) > frontend\.env
)

REM Main menu
echo Choose setup option:
echo 1) Development environment (with hot reload)
echo 2) Production environment
echo 3) Install local dependencies only
echo 4) Clean up Docker containers and images

set /p choice=Enter your choice (1-4): 

if "%choice%"=="1" (
    echo 🚀 Setting up development environment...
    docker-compose --profile dev up --build -d
    echo ✅ Development environment is ready!
    echo Frontend: http://localhost:5173
    echo Backend: http://localhost:5000
    echo MongoDB: localhost:27017
) else if "%choice%"=="2" (
    echo 🚀 Setting up production environment...
    docker-compose --profile prod up --build -d
    echo ✅ Production environment is ready!
    echo Application: http://localhost:5000
    echo MongoDB: localhost:27017
) else if "%choice%"=="3" (
    echo 📦 Installing local dependencies...
    if exist "backend" (
        echo Installing backend dependencies...
        cd backend
        npm install
        cd ..
    )
    if exist "frontend" (
        echo Installing frontend dependencies...
        cd frontend
        npm install
        cd ..
    )
    echo ✅ Local dependencies installed!
) else if "%choice%"=="4" (
    echo 🧹 Cleaning up Docker containers and images...
    docker-compose down --volumes --rmi all
    docker system prune -f
    echo ✅ Cleanup completed!
) else (
    echo ❌ Invalid choice. Please run the script again.
    pause
    exit /b 1
)

echo 🎉 Setup completed successfully!
echo 📚 Useful commands:
echo   - View logs: docker-compose logs -f
echo   - Stop services: docker-compose down
echo   - Restart services: docker-compose restart
echo   - Access MongoDB: docker exec -it synergy-mongodb mongosh

pause
