#!/bin/bash
# =============================================================================
# TaskSteer EC2 Bootstrap Script
# This script runs on EC2 instance launch (user data)
# =============================================================================

set -e

# Log all output
exec > >(tee /var/log/tasksteer-bootstrap.log) 2>&1

echo "=========================================="
echo "TaskSteer EC2 Bootstrap Script"
echo "Started at: $(date)"
echo "=========================================="

# Variables
APP_NAME="tasksteer"
APP_DIR="/home/ubuntu/${APP_NAME}"
GITHUB_REPO="https://github.com/YOUR_USERNAME/tasksteer.git"
NODE_VERSION="20"

# Update system packages
echo "==> Updating system packages..."
apt-get update -y
apt-get upgrade -y

# Install essential packages
echo "==> Installing essential packages..."
apt-get install -y \
    git \
    nginx \
    build-essential \
    unzip \
    curl \
    wget \
    htop \
    awscli \
    jq

# Install Node.js 20
echo "==> Installing Node.js ${NODE_VERSION}..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt-get install -y nodejs

# Verify Node.js installation
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

# Install PM2 globally
echo "==> Installing PM2..."
npm install -g pm2

# Configure PM2 to start on boot
pm2 startup systemd -u ubuntu --hp /home/ubuntu
systemctl enable pm2-ubuntu

# Install AWS CloudWatch Agent
echo "==> Installing CloudWatch Agent..."
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
dpkg -i -E ./amazon-cloudwatch-agent.deb
rm amazon-cloudwatch-agent.deb

# Configure Nginx
echo "==> Configuring Nginx..."
cat > /etc/nginx/sites-available/tasksteer << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/tasksteer /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t
systemctl enable nginx
systemctl restart nginx

# Create application directory
echo "==> Setting up application directory..."
mkdir -p ${APP_DIR}
chown -R ubuntu:ubuntu ${APP_DIR}

# Clone repository (initial setup)
echo "==> Cloning repository..."
sudo -u ubuntu git clone ${GITHUB_REPO} ${APP_DIR} || echo "Repository already exists or will be set up via CI/CD"

# Create environment file template
echo "==> Creating environment template..."
cat > ${APP_DIR}/pms-app/.env.example << 'EOF'
# Database
DATABASE_URL="file:./prisma/tasksteer.db"

# AWS Region (credentials come from EC2 instance role)
AWS_REGION="us-east-1"

# Application
NODE_ENV="production"
PORT=3000

# Email Configuration (if using)
# OUTLOOK_CLIENT_ID=""
# OUTLOOK_CLIENT_SECRET=""
# OUTLOOK_REDIRECT_URI=""
EOF

# Set up log directory
mkdir -p /var/log/tasksteer
chown ubuntu:ubuntu /var/log/tasksteer

# Configure logrotate for TaskSteer logs
cat > /etc/logrotate.d/tasksteer << 'EOF'
/var/log/tasksteer/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0644 ubuntu ubuntu
}
EOF

# Install SSM agent (should be pre-installed on Ubuntu 22.04)
echo "==> Verifying SSM Agent..."
snap install amazon-ssm-agent --classic || true
systemctl enable snap.amazon-ssm-agent.amazon-ssm-agent.service
systemctl start snap.amazon-ssm-agent.amazon-ssm-agent.service

# Final message
echo "=========================================="
echo "Bootstrap completed at: $(date)"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Set up GitHub secrets for CI/CD"
echo "2. Configure .env file in ${APP_DIR}/pms-app/"
echo "3. Run initial deployment via GitHub Actions"
echo ""
