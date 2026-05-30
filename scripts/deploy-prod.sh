#!/bin/bash

# ==========================================
# Pitaya One (OpsCore) Production Deployment
# ==========================================

set -e

echo "[+] PRECHECKS"
# Verify Docker
if ! command -v docker &> /dev/null; then
    echo "Docker could not be found, please install it."
    exit 1
fi

# Verify Docker Compose
if ! docker compose version &> /dev/null; then
    echo "Docker Compose could not be found, please install it."
    exit 1
fi

# Verify Network
if ! docker network ls | grep -q "pitaya_net"; then
    echo "Creating network pitaya_net..."
    docker network create pitaya_net
fi

# Verify MySQL Container
if ! docker ps | grep -q "luxury-mysql-prod"; then
    echo "WARNING: luxury-mysql-prod container is not running!"
    exit 1
fi

echo "[+] DIRECTORY STRUCTURE"
mkdir -p /opt/pitaya/opscore/api

echo "[+] GIT DEPLOYMENT"
if [ ! -d "/opt/pitaya/opscore/.git" ]; then
    echo "Cloning repository..."
    git clone https://github.com/chessco/opscore /opt/pitaya/opscore
else
    echo "Pulling latest changes..."
    cd /opt/pitaya/opscore
    git fetch --all
    git reset --hard origin/main
    git clean -fd
fi

echo "[+] DATABASE CREATION"
echo "Ensuring opscore_db exists inside luxury-mysql-prod..."
docker exec luxury-mysql-prod mysql -u root -p"<DB_ROOT_PASSWORD>" -e "CREATE DATABASE IF NOT EXISTS opscore_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo "[+] DEPLOY"
cd /opt/pitaya/opscore/api
docker compose -f docker-compose.prod.yml up -d --build

echo "[+] VALIDATION"
echo "Checking API container status..."
docker ps | grep opscore-api-prod

echo "Checking logs (last 20 lines)..."
docker logs --tail 20 opscore-api-prod

echo "Done! The API should be accessible internally on port 3005."
echo "Please configure Nginx Proxy Manager to forward opscore-api.pitayacode.io to opscore-api-prod:3005."
