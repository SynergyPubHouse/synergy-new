#!/bin/bash
# Build and push LibreOffice base image to Docker Hub
# Usage: bash build-docker-image.sh yourdockerusername

DOCKER_USERNAME=${1:-synergyworldpress}
IMAGE_NAME="synergy-base"
TAG="latest"
FULL_IMAGE="${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}"

echo "🐳 Building Docker base image: $FULL_IMAGE"
docker build -t $FULL_IMAGE -f Dockerfile.base .

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"
echo ""
echo "🚀 To push to Docker Hub, run:"
echo "   docker login"
echo "   docker push $FULL_IMAGE"
echo ""
echo "📝 Then update Dockerfile and render.yaml to use:"
echo "   FROM $FULL_IMAGE"
