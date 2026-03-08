#!/bin/bash
set -e

# Configuration
PROJECT_ID=$(gcloud config get-value project)
SERVICE_NAME="nullclaw"
REGION="us-central1"
CLOUD_IMAGE="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"

# 1. Clean up and set up build context
echo "Preparing build context..."
# We need to build from the directory where Dockerfile.nullclaw, nullclaw_data AND the source code are available
# Since we are in creative-precision, we'll build from here but reference the nullclaw source directory

# 2. Sync Secrets from .env to Kubernetes
echo "Syncing secrets from .env to Kubernetes..."
if [ -f .env ]; then
    # Delete old secret if it exists to refresh it
    kubectl delete secret nullclaw-secrets --namespace=nullclaw || true
    
    # Create new secret from .env keys
    kubectl create secret generic nullclaw-secrets --namespace=nullclaw \
        --from-env-file=.env
else
    echo "Warning: .env file not found. Skipping secret sync."
fi

# 3. Build the image (includes your CURRENT nullclaw_data for seeding)
echo "Building and pushing cloud image: $CLOUD_IMAGE"
# Note: This command assumes your nullclaw source is in a sibling directory called 'nullclaw'
# We'll use a local build for now but you can use gcloud builds submit
docker build -f Dockerfile.nullclaw --target release-root -t $CLOUD_IMAGE \
    --build-context nullclaw_src=website/src/backend/nullclaw .
    
# Push it
docker push $CLOUD_IMAGE

# 3. Apply the Kubernetes manifest
echo "Deploying to Kubernetes..."
# Update the image in the cloud.yaml if needed
sed -i '' "s|image: nullclaw:latest|image: $CLOUD_IMAGE|g" website/src/backend/k8s/nullclaw-cloud.yaml

kubectl apply -f website/src/backend/k8s/nullclaw-cloud.yaml

echo "===================================================="
echo "Deployment Complete!"
echo "NullClaw is now deploying. On the FIRST run, it is"
echo "automatically seeding your local data into the cloud PVC."
echo "===================================================="
