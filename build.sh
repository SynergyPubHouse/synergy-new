#!/bin/bash
set -e  # Exit on error

echo "🚀 Starting production build process..."

# Check for required environment variables
check_env_vars() {
    local required_vars=("MONGODB_URI" "JWT_SECRET" "FRONTEND_URL")
    local missing_vars=()

    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
done

    if [ ${#missing_vars[@]} -ne 0 ]; then
        echo "❌ Error: The following required environment variables are not set:"
        printf ' - %s\n' "${missing_vars[@]}"
        echo "Please set these variables and try again."
        exit 1
    fi
}

# Install dependencies
install_deps() {
    echo "📦 Installing backend dependencies..."
    cd backend
    npm ci --only=production
    cd ..

    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm ci --only=production
    cd ..
}

# Build frontend
build_frontend() {
    echo "🔨 Building frontend..."
    cd frontend
    npm run build
    
    # Verify build output
    if [ ! -d "dist" ]; then
        echo "❌ Frontend build failed: dist directory not found"
        exit 1
    fi
    
    echo "✅ Frontend built successfully"
    cd ..
}

# Verify backend
verify_backend() {
    echo "🔍 Verifying backend..."
    cd backend
    
    # Check for common issues
    if ! node -e "require('mongoose')" &>/dev/null; then
        echo "❌ Error: Mongoose not found in backend dependencies"
        exit 1
    fi
    
    # Test database connection
    if ! node -e "
    const mongoose = require('mongoose');
    mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
        .then(() => {
            console.log('✅ Database connection successful');
            process.exit(0);
        })
        .catch(err => {
            console.error('❌ Database connection failed:', err.message);
            process.exit(1);
        });
    "; then
        echo "❌ Backend verification failed"
        exit 1
    fi
    
    cd ..
    echo "✅ Backend verified successfully"
}

# Main build process
main() {
    # Check environment variables
    check_env_vars
    
    # Install dependencies
    install_deps
    
    # Build frontend
    build_frontend
    
    # Verify backend
    verify_backend
    
    echo "✨ Build completed successfully!"
    echo "To start the production server, run:"
    echo "  cd backend && npm start"
}

# Run the main function
main "$@"
