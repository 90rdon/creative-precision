#!/bin/bash
set -e

# Configuration
PROJECT_ID=$(gcloud config get-value project)
SERVICE_NAME="expert-proxy"
CLOUD_IMAGE="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"

# 1. Sync Secrets from .env to Kubernetes
echo "Syncing secrets from .env to Kubernetes..."
if [ -f .env ]; then
    # We use the same secret for both or update it. Since nullclaw-secrets is shared, we patch it
    kubectl create secret generic nullclaw-secrets --namespace=nullclaw \
        --from-env-file=.env --dry-run=client -o yaml | kubectl apply -f -
else
    echo "Warning: .env file not found. Skipping secret sync."
fi

# 2. Build the image
echo "Building and pushing cloud image: $CLOUD_IMAGE"
# We'll use docker build instead of gcloud build to match the workflow in deploy-nullclaw.sh 
# but if needed user can use gcloud builds.
docker build -f Dockerfile -t $CLOUD_IMAGE .
docker push $CLOUD_IMAGE

# 3. Apply the Kubernetes manifest
echo "Deploying Proxy to Kubernetes..."
# Update the image in the proxy.yaml
sed -i '' "s|image: .*expert-proxy:.*|image: $CLOUD_IMAGE|g" website/src/backend/k8s/proxy.yaml

kubectl apply -f website/src/backend/k8s/proxy.yaml

echo "===================================================="
echo "Proxy Deployment Complete!"
echo "The Expert Proxy is now deployed to Kubernetes."
echo "===================================================="
