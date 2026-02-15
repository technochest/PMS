#!/bin/bash
# =============================================================================
# TaskSteer EC2 Bootstrap Script - Production Ready (v2.0)
# =============================================================================
# Run as: User Data on EC2 launch OR via SSM for existing instances
# Idempotent: Safe to run multiple times
# =============================================================================

set -euo pipefail

# Log all output with timestamps
exec > >(tee -a /var/log/tasksteer-bootstrap.log) 2>&1
echo ""
echo "=========================================="
echo "TaskSteer EC2 Bootstrap Script v2.0"
echo "Started at: $(date -Iseconds)"
echo "=========================================="

# =============================================================================
# CONFIGURATION - Update these values
# =============================================================================
APP_NAME="tasksteer"
APP_USER="ubuntu"
APP_DIR="/home/${APP_USER}/${APP_NAME}"
GITHUB_REPO="https://github.com/technochest/PMS.git"
NODE_VERSION="20"
LOG_DIR="/var/log/tasksteer"

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================
log_step() {
    echo ""
    echo "==> $1"
    echo "-------------------------------------------"
}

check_command() {
    if command -v "$1" &> /dev/null; then
        echo "✓ $1 is installed: $($1 --version 2>&1 | head -1)"
        return 0
    else
        echo "✗ $1 is not installed"
        return 1
    fi
}

# =============================================================================
# STEP 1: SYSTEM PACKAGES
# =============================================================================
log_step "Updating system packages"

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"

log_step "Installing essential packages"

apt-get install -y --no-install-recommends \
    git \
    nginx \
    build-essential \
    unzip \
    curl \
    wget \
    htop \
    jq \
    ca-certificates \
    gnupg \
    lsb-release

# =============================================================================
# STEP 2: AWS CLI v2 (if not installed)
# =============================================================================
log_step "Installing/Verifying AWS CLI v2"

if ! check_command aws || [[ $(aws --version 2>&1) != *"aws-cli/2"* ]]; then
    echo "Installing AWS CLI v2..."
    curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip"
    unzip -q -o /tmp/awscliv2.zip -d /tmp
    /tmp/aws/install --update
    rm -rf /tmp/awscliv2.zip /tmp/aws
fi
aws --version

# =============================================================================
# STEP 3: NODE.JS 20 (via NodeSource)
# =============================================================================
log_step "Installing/Verifying Node.js ${NODE_VERSION}"

if ! check_command node || [[ $(node --version) != v${NODE_VERSION}* ]]; then
    echo "Installing Node.js ${NODE_VERSION}..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs
fi

echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

# =============================================================================
# STEP 4: PM2 PROCESS MANAGER
# =============================================================================
log_step "Installing/Verifying PM2"

if ! check_command pm2; then
    npm install -g pm2
fi

# Configure PM2 startup (idempotent)
pm2 startup systemd -u ${APP_USER} --hp /home/${APP_USER} 2>/dev/null || true

# Ensure PM2 service is enabled
systemctl enable pm2-${APP_USER} 2>/dev/null || true

# =============================================================================
# STEP 5: CLOUDWATCH AGENT
# =============================================================================
log_step "Installing AWS CloudWatch Agent"

if ! dpkg -l | grep -q amazon-cloudwatch-agent; then
    wget -q https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb -O /tmp/amazon-cloudwatch-agent.deb
    dpkg -i -E /tmp/amazon-cloudwatch-agent.deb
    rm -f /tmp/amazon-cloudwatch-agent.deb
fi

# =============================================================================
# STEP 6: SSM AGENT (verify)
# =============================================================================
log_step "Verifying SSM Agent"

# SSM Agent should be pre-installed on Ubuntu 22.04 AMIs
if systemctl is-active --quiet snap.amazon-ssm-agent.amazon-ssm-agent.service; then
    echo "✓ SSM Agent is running"
else
    echo "Installing SSM Agent..."
    snap install amazon-ssm-agent --classic 2>/dev/null || true
    systemctl enable snap.amazon-ssm-agent.amazon-ssm-agent.service
    systemctl start snap.amazon-ssm-agent.amazon-ssm-agent.service
fi

# =============================================================================
# STEP 7: APPLICATION DIRECTORY STRUCTURE
# =============================================================================
log_step "Setting up application directories"

mkdir -p ${APP_DIR}
mkdir -p ${LOG_DIR}
chown -R ${APP_USER}:${APP_USER} ${APP_DIR}
chown -R ${APP_USER}:${APP_USER} ${LOG_DIR}

# =============================================================================
# STEP 8: NGINX CONFIGURATION
# =============================================================================
log_step "Configuring Nginx"

cat > /etc/nginx/sites-available/tasksteer << 'NGINX_EOF'
# TaskSteer Nginx Configuration
# Rate limiting
limit_req_zone $binary_remote_addr zone=tasksteer_api:10m rate=10r/s;

upstream tasksteer_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name _;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # Client body size for uploads
    client_max_body_size 50M;

    # Health check endpoint (no logging)
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Next.js static assets (immutable cache)
    location /_next/static {
        proxy_pass http://tasksteer_backend;
        proxy_http_version 1.1;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # API routes with rate limiting
    location /api {
        limit_req zone=tasksteer_api burst=20 nodelay;
        
        proxy_pass http://tasksteer_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 60;
        proxy_send_timeout 300;
    }

    # Main application
    location / {
        proxy_pass http://tasksteer_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60;
        proxy_connect_timeout 60;
        proxy_send_timeout 60;
    }
}
NGINX_EOF

# Enable site and disable default
ln -sf /etc/nginx/sites-available/tasksteer /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and apply
nginx -t
systemctl enable nginx
systemctl reload nginx || systemctl restart nginx

echo "✓ Nginx configured and running"

# =============================================================================
# STEP 9: LOG ROTATION
# =============================================================================
log_step "Configuring log rotation"

cat > /etc/logrotate.d/tasksteer << 'LOGROTATE_EOF'
/var/log/tasksteer/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0644 ubuntu ubuntu
    sharedscripts
    postrotate
        pm2 reloadLogs 2>/dev/null || true
    endscript
}
LOGROTATE_EOF

# =============================================================================
# STEP 10: CLONE/UPDATE REPOSITORY
# =============================================================================
log_step "Setting up application repository"

if [ -d "${APP_DIR}/.git" ]; then
    echo "Repository exists, skipping clone (CI/CD will update)"
else
    echo "Cloning repository..."
    sudo -u ${APP_USER} git clone ${GITHUB_REPO} ${APP_DIR} || {
        echo "Clone failed - CI/CD will handle initial deployment"
    }
fi

# =============================================================================
# STEP 11: ENVIRONMENT FILE TEMPLATE
# =============================================================================
log_step "Creating environment template"

if [ ! -f "${APP_DIR}/pms-app/.env" ]; then
    mkdir -p ${APP_DIR}/pms-app
    cat > ${APP_DIR}/pms-app/.env << 'ENV_EOF'
# TaskSteer Production Environment
# Created by bootstrap script

# Database (SQLite)
DATABASE_URL="file:./prisma/tasksteer.db"

# AWS Configuration (credentials from EC2 instance role)
AWS_REGION="us-east-1"

# Application
NODE_ENV="production"
PORT=3000

# Telemetry
NEXT_TELEMETRY_DISABLED=1

# AI Analysis
ENABLE_AI_ANALYSIS="true"
ENV_EOF
    chown ${APP_USER}:${APP_USER} ${APP_DIR}/pms-app/.env
    chmod 600 ${APP_DIR}/pms-app/.env
    echo "✓ Environment file created"
else
    echo "✓ Environment file already exists"
fi

# =============================================================================
# STEP 12: SYSTEM HARDENING (Basic)
# =============================================================================
log_step "Applying basic security hardening"

# Disable root SSH login (should already be disabled on Ubuntu AMI)
sed -i 's/^PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config 2>/dev/null || true

# Set proper permissions on sensitive directories
chmod 700 /home/${APP_USER}/.ssh 2>/dev/null || true
chmod 600 /home/${APP_USER}/.ssh/authorized_keys 2>/dev/null || true

# =============================================================================
# STEP 13: VERIFY INSTALLATION
# =============================================================================
log_step "Verification Summary"

echo ""
echo "Component Status:"
echo "-------------------------------------------"
check_command node || true
check_command npm || true
check_command pm2 || true
check_command nginx || true
check_command aws || true
check_command git || true

echo ""
echo "Service Status:"
echo "-------------------------------------------"
systemctl is-active --quiet nginx && echo "✓ Nginx: active" || echo "✗ Nginx: inactive"
systemctl is-active --quiet snap.amazon-ssm-agent.amazon-ssm-agent.service && echo "✓ SSM Agent: active" || echo "✗ SSM Agent: inactive"

echo ""
echo "Directory Structure:"
echo "-------------------------------------------"
ls -la ${APP_DIR} 2>/dev/null || echo "App directory not yet populated"
ls -la ${LOG_DIR} 2>/dev/null || echo "Log directory ready"

# =============================================================================
# COMPLETE
# =============================================================================
echo ""
echo "=========================================="
echo "TaskSteer Bootstrap Complete"
echo "Finished at: $(date -Iseconds)"
echo "=========================================="
echo ""
echo "NEXT STEPS:"
echo "1. Verify GitHub Actions secrets are configured"
echo "2. Push to 'main' branch to trigger deployment"
echo "3. Monitor: pm2 logs tasksteer"
echo "4. Health: curl http://localhost/health"
echo ""
