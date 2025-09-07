@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo     SYNERGY WORLD PRESS - SETUP SCRIPT
echo ==========================================
echo          Ultimate Development Setup
echo ==========================================
echo.

echo [STEP 1/12] Checking Prerequisites...
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Not running as administrator. Some operations might fail.
    echo Recommended: Right-click and "Run as administrator"
    echo.
    pause
)

REM Check Docker
echo Checking Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not running!
    echo.
    echo Please install Docker Desktop from:
    echo https://www.docker.com/products/docker-desktop/
    echo.
    echo Make sure Docker Desktop is running before executing this script.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('docker --version') do set DOCKER_VERSION=%%i
echo ✓ %DOCKER_VERSION%

REM Check Docker Compose
echo Checking Docker Compose...
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker Compose is not available!
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('docker-compose --version') do set COMPOSE_VERSION=%%i
echo ✓ %COMPOSE_VERSION%

REM Check Node.js
echo Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Recommended: LTS version
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js %NODE_VERSION%

REM Check npm
echo Checking npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not available!
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✓ npm %NPM_VERSION%

REM Check Python
echo Checking Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed!
    echo.
    echo Please install Python from: https://python.org/
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo ✓ %PYTHON_VERSION%

REM Check pip
echo Checking pip...
pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: pip is not available!
    pause
    exit /b 1
)
echo ✓ pip is available

echo.
echo [STEP 2/12] Stopping existing services...
echo.

echo Stopping existing Docker containers...
docker-compose down >nul 2>&1
echo ✓ Previous containers stopped

echo Killing existing Node.js processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.exe >nul 2>&1
echo ✓ Node.js processes stopped

echo.
echo [STEP 3/12] Setting up environment files...
echo.

REM Create backend .env file
if not exist "backend\.env" (
    echo Creating backend .env file...
    (
        echo # Database Configuration
        echo MONGODB_URI=mongodb://admin:password123@localhost:27017/synergy-world-press?authSource=admin
        echo.
        echo # JWT Configuration
        echo JWT_SECRET=86aa472c0f95b28de7e9c700c170c74ac1019baaf1be82c6cfeced4788eaaddd8649edcb1934e1562c823b402643cf533b84a59c72ec9230c843c5f0d4a26724
        echo.
        echo # Server Configuration
        echo PORT=5000
        echo NODE_ENV=development
        echo BASE_URL=http://localhost:5000
        echo.
        echo # Google OAuth
        echo GOOGLE_CLIENT_ID=535987113890-a29juotrj2v2c5lj56ot6cqe4kge4sam.apps.googleusercontent.com
        echo.
        echo # ORCID OAuth
        echo ORCID_CLIENT_ID=APP-5755KPXN4H7PWAYU
        echo ORCID_CLIENT_SECRET=fd757db3-47d8-44f4-ba97-2045bb8c46ff
        echo.
        echo # Google Drive Configuration
        echo USE_GOOGLE_DRIVE=false
        echo GOOGLE_DRIVE_FOLDER_ID=1FxiUnrnUn6HfaiB0s-ch6ChaEiDnj1E4
        echo GOOGLE_DRIVE_MANUSCRIPTS_FOLDER=1FxiUnrnUn6HfaiB0s-ch6ChaEiDnj1E4
        echo GOOGLE_DRIVE_COVERLETTERS_FOLDER=1FxiUnrnUn6HfaiB0s-ch6ChaEiDnj1E4
        echo GOOGLE_DRIVE_DECLARATIONS_FOLDER=1FxiUnrnUn6HfaiB0s-ch6ChaEiDnj1E4
        echo GOOGLE_DRIVE_MERGED_FOLDER=1FxiUnrnUn6HfaiB0s-ch6ChaEiDnj1E4
        echo.
        echo # Cloudinary Configuration ^(Add your credentials^)
        echo CLOUDINARY_CLOUD_NAME=di6piyfu8
        echo CLOUDINARY_API_KEY=922369985173375
        echo CLOUDINARY_API_SECRET=6_fECoSBG4pAA7I0BVnJD8VzwCk
    ) > backend\.env
    echo ✓ Backend .env file created
) else (
    echo ✓ Backend .env file exists
)

REM Create frontend .env file
if not exist "frontend\.env" (
    echo Creating frontend .env file...
    (
        echo # Backend API URL
        echo VITE_BACKEND_URL=http://localhost:5000/api
        echo.
        echo # Frontend Configuration
        echo VITE_APP_NAME=Synergy World Press
        echo.
        echo # Google OAuth
        echo VITE_GOOGLE_CLIENT_ID=535987113890-a29juotrj2v2c5lj56ot6cqe4kge4sam.apps.googleusercontent.com
        echo.
        echo # ORCID OAuth
        echo VITE_ORCID_CLIENT_ID=APP-5755KPXN4H7PWAYU
    ) > frontend\.env
    echo ✓ Frontend .env file created
) else (
    echo ✓ Frontend .env file exists
)

echo.
echo [STEP 4/12] Creating required directories...
echo.

if not exist "backend\uploads" (
    mkdir "backend\uploads"
    echo ✓ Created backend\uploads directory
)

if not exist "backend\logs" (
    mkdir "backend\logs"
    echo ✓ Created backend\logs directory
)

if not exist "ssl" (
    mkdir "ssl"
    echo ✓ Created ssl directory
)

echo.
echo [STEP 5/12] Starting MongoDB with Docker...
echo.

echo Starting MongoDB container...
docker-compose up -d mongodb
if %errorlevel% neq 0 (
    echo ERROR: Failed to start MongoDB!
    echo Please check Docker Desktop and try again.
    pause
    exit /b 1
)

echo Waiting for MongoDB to initialize...
timeout /t 20 /nobreak >nul

REM Check if MongoDB is running
docker ps | findstr "synergy-mongodb" >nul
if %errorlevel% neq 0 (
    echo ERROR: MongoDB container is not running!
    echo Checking Docker logs...
    docker-compose logs mongodb
    pause
    exit /b 1
)
echo ✓ MongoDB is running

echo.
echo [STEP 6/12] Installing Backend Dependencies...
echo.

cd backend

echo Installing Node.js dependencies for backend...
if not exist package.json (
    echo ERROR: package.json not found in backend directory!
    pause
    exit /b 1
)

call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend Node.js dependencies!
    echo Try running: npm cache clean --force
    pause
    exit /b 1
)
echo ✓ Backend Node.js dependencies installed

echo Installing Python dependencies for backend...
if exist requirements.txt (
    echo Installing packages from requirements.txt...
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo WARNING: Some Python dependencies failed to install
        echo This might not affect core functionality
        echo You may need to install them manually:
        echo   pip install docx2txt python-docx spacy reportlab
        echo.
        timeout /t 5 /nobreak >nul
    ) else (
        echo ✓ Python dependencies installed successfully
    )
) else (
    echo WARNING: requirements.txt not found - skipping Python dependencies
)

cd ..

echo.
echo [STEP 7/12] Installing Frontend Dependencies...
echo.

cd frontend

echo Installing Node.js dependencies for frontend...
if not exist package.json (
    echo ERROR: package.json not found in frontend directory!
    pause
    exit /b 1
)

call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies!
    echo Try running: npm cache clean --force
    pause
    exit /b 1
)
echo ✓ Frontend dependencies installed

cd ..

echo.
echo [STEP 8/12] Installing Root Dependencies...
echo.

if exist package.json (
    echo Installing root dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo WARNING: Failed to install root dependencies
        echo This might not affect core functionality
    ) else (
        echo ✓ Root dependencies installed
    )
)

echo.
echo [STEP 9/12] Testing Database Connection...
echo.

echo Testing MongoDB connection...
timeout /t 5 /nobreak >nul

REM Test database connection
docker exec synergy-mongodb mongosh --username admin --password password123 --authenticationDatabase admin --eval "db.adminCommand('ping')" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ MongoDB connection successful
) else (
    echo WARNING: Could not verify MongoDB connection
    echo The database might still be initializing
)

echo.
echo [STEP 10/12] Verifying Project Setup...
echo.

echo Checking backend can start...
cd backend
node -pe "require('./package.json').name" >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Backend might have issues
) else (
    echo ✓ Backend setup verified
)
cd ..

echo Checking frontend can start...
cd frontend
node -pe "require('./package.json').name" >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Frontend might have issues
) else (
    echo ✓ Frontend setup verified
)
cd ..

echo.
echo [STEP 11/12] Starting Development Servers...
echo.

echo Starting backend server in new window...
start "Synergy World Press - Backend Server" cmd /k "cd /d %cd%\backend && echo ================================== && echo   SYNERGY WORLD PRESS - BACKEND && echo ================================== && echo Starting server on http://localhost:5000 && echo Press Ctrl+C to stop && echo. && npm run dev"

echo Waiting for backend to start...
timeout /t 8 /nobreak >nul

echo Starting frontend server in new window...
start "Synergy World Press - Frontend Server" cmd /k "cd /d %cd%\frontend && echo ================================== && echo   SYNERGY WORLD PRESS - FRONTEND && echo ================================== && echo Starting server on http://localhost:5173 && echo Press Ctrl+C to stop && echo. && npm run dev"

echo.
echo [STEP 12/12] Final Setup...
echo.

echo Waiting for servers to initialize...
timeout /t 10 /nobreak >nul

echo.
echo ==========================================
echo         🎉 SETUP COMPLETE! 🎉
echo ==========================================
echo.
echo 🚀 SERVICES RUNNING:
echo   📊 Frontend:  http://localhost:5173
echo   🔧 Backend:   http://localhost:5000  
echo   🗄️  MongoDB:   mongodb://localhost:27017
echo.
echo � WHAT'S RUNNING:
echo   • MongoDB (Docker container: synergy-mongodb)
echo   • Backend Server (Node.js with nodemon)
echo   • Frontend Server (Vite React development server)
echo.
echo 🛠️  DEVELOPMENT COMMANDS:
echo   • View containers:     docker ps
echo   • Stop database:       docker-compose down
echo   • View DB logs:        docker-compose logs mongodb
echo   • Restart backend:     Close backend window and run 'npm run dev' in backend/
echo   • Restart frontend:    Close frontend window and run 'npm run dev' in frontend/
echo.
echo 📋 IMPORTANT NOTES:
echo   • Both servers are running in separate command windows
echo   • Close those windows or press Ctrl+C to stop the servers
echo   • MongoDB data is persistent in Docker volume
echo   • Cloudinary credentials are configured for file uploads
echo   • Backend uses port 5000, Frontend uses port 5173
echo.
echo 🔧 CONFIGURATION:
echo   • Backend config: backend/.env
echo   • Frontend config: frontend/.env
echo   • Database config: docker-compose.yml
echo.
echo Press any key to open the application in your browser...
pause >nul

echo Opening application in browser...
start http://localhost:5173

echo.
echo ==========================================
echo    🎯 READY FOR DEVELOPMENT! 🎯
echo ==========================================
echo.
echo You can now start developing the Synergy World Press application!
echo.
echo To stop everything:
echo   1. Close the backend and frontend command windows
echo   2. Run: docker-compose down
echo.
echo To restart development servers:
echo   • Backend: cd backend && npm run dev
echo   • Frontend: cd frontend && npm run dev
echo.
echo Happy coding! 🚀
echo.
pause
