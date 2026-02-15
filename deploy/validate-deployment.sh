#!/bin/bash
# =============================================================================
# TaskSteer Production Validation Script
# Run via SSM: aws ssm send-command --document-name "AWS-RunShellScript" ...
# Or directly on EC2: sudo bash /home/ubuntu/tasksteer/deploy/validate-deployment.sh
# =============================================================================

set -euo pipefail

echo "=========================================="
echo "TaskSteer Deployment Validation"
echo "Timestamp: $(date -Iseconds)"
echo "=========================================="
echo ""

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

pass() {
    echo "✓ PASS: $1"
    ((PASS_COUNT++))
}

fail() {
    echo "✗ FAIL: $1"
    ((FAIL_COUNT++))
}

warn() {
    echo "⚠ WARN: $1"
    ((WARN_COUNT++))
}

# =============================================================================
# 1. SYSTEM SERVICES
# =============================================================================
echo "--- System Services ---"

if systemctl is-active --quiet nginx; then
    pass "Nginx is running"
else
    fail "Nginx is not running"
fi

if systemctl is-active --quiet snap.amazon-ssm-agent.amazon-ssm-agent.service; then
    pass "SSM Agent is running"
else
    fail "SSM Agent is not running"
fi

# =============================================================================
# 2. NODE.JS & PM2
# =============================================================================
echo ""
echo "--- Node.js & PM2 ---"

if command -v node &> /dev/null; then
    NODE_VER=$(node --version)
    if [[ $NODE_VER == v20* ]]; then
        pass "Node.js $NODE_VER (correct version)"
    else
        warn "Node.js $NODE_VER (expected v20.x)"
    fi
else
    fail "Node.js not installed"
fi

if command -v pm2 &> /dev/null; then
    pass "PM2 is installed"
    
    if pm2 list | grep -q "tasksteer"; then
        PM2_STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="tasksteer") | .pm2_env.status')
        if [[ "$PM2_STATUS" == "online" ]]; then
            pass "TaskSteer app is running in PM2"
        else
            fail "TaskSteer app status: $PM2_STATUS"
        fi
    else
        warn "TaskSteer not found in PM2 (first deployment pending?)"
    fi
else
    fail "PM2 not installed"
fi

# =============================================================================
# 3. NETWORK & CONNECTIVITY
# =============================================================================
echo ""
echo "--- Network & Connectivity ---"

# Check Nginx health endpoint
if curl -sf http://localhost/health > /dev/null 2>&1; then
    pass "Nginx health endpoint responding"
else
    fail "Nginx health endpoint not responding"
fi

# Check if app is responding through Nginx
if curl -sf http://localhost -o /dev/null 2>&1; then
    pass "Application responding on port 80 (via Nginx)"
else
    warn "Application not responding on port 80 (deployment may be pending)"
fi

# Check direct app connection
if curl -sf http://localhost:3000 -o /dev/null 2>&1; then
    pass "Application responding directly on port 3000"
else
    warn "Application not responding on port 3000"
fi

# Check outbound connectivity (for npm, git)
if curl -sf https://registry.npmjs.org -o /dev/null 2>&1; then
    pass "Outbound HTTPS connectivity OK"
else
    fail "Cannot reach npm registry"
fi

# =============================================================================
# 4. AWS INTEGRATION
# =============================================================================
echo ""
echo "--- AWS Integration ---"

# Check AWS CLI
if command -v aws &> /dev/null; then
    pass "AWS CLI installed"
    
    # Check IAM role credentials
    if aws sts get-caller-identity &> /dev/null; then
        ROLE_ARN=$(aws sts get-caller-identity --query 'Arn' --output text)
        pass "EC2 instance role active: $ROLE_ARN"
    else
        fail "Cannot assume EC2 instance role"
    fi
    
    # Test Comprehend access
    if aws comprehend detect-sentiment --text "test" --language-code en &> /dev/null; then
        pass "AWS Comprehend access verified"
    else
        fail "AWS Comprehend access denied (check IAM policy)"
    fi
else
    fail "AWS CLI not installed"
fi

# =============================================================================
# 5. APPLICATION FILES
# =============================================================================
echo ""
echo "--- Application Files ---"

APP_DIR="/home/ubuntu/tasksteer"

if [ -d "$APP_DIR/.git" ]; then
    pass "Git repository present"
    BRANCH=$(cd $APP_DIR && git rev-parse --abbrev-ref HEAD)
    COMMIT=$(cd $APP_DIR && git rev-parse --short HEAD)
    echo "    Branch: $BRANCH, Commit: $COMMIT"
else
    warn "Git repository not found (first deployment pending?)"
fi

if [ -f "$APP_DIR/pms-app/.env" ]; then
    pass ".env file exists"
else
    fail ".env file missing"
fi

if [ -f "$APP_DIR/ecosystem.config.js" ]; then
    pass "PM2 ecosystem config exists"
else
    fail "ecosystem.config.js missing"
fi

if [ -d "$APP_DIR/pms-app/.next" ]; then
    pass "Next.js build exists"
else
    warn "Next.js build not found (first deployment pending?)"
fi

if [ -d "$APP_DIR/pms-app/node_modules" ]; then
    pass "node_modules installed"
else
    warn "node_modules not found (first deployment pending?)"
fi

# =============================================================================
# 6. DISK & MEMORY
# =============================================================================
echo ""
echo "--- Resources ---"

DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
if [ "$DISK_USAGE" -lt 80 ]; then
    pass "Disk usage: ${DISK_USAGE}%"
else
    warn "Disk usage: ${DISK_USAGE}% (consider cleanup)"
fi

MEM_AVAILABLE=$(free -m | awk 'NR==2 {print $7}')
if [ "$MEM_AVAILABLE" -gt 500 ]; then
    pass "Available memory: ${MEM_AVAILABLE}MB"
else
    warn "Low available memory: ${MEM_AVAILABLE}MB"
fi

# =============================================================================
# 7. SECURITY
# =============================================================================
echo ""
echo "--- Security ---"

# Check if .env is not world-readable
if [ -f "$APP_DIR/pms-app/.env" ]; then
    ENV_PERMS=$(stat -c %a "$APP_DIR/pms-app/.env" 2>/dev/null || echo "unknown")
    if [ "$ENV_PERMS" == "600" ]; then
        pass ".env has correct permissions (600)"
    else
        warn ".env permissions: $ENV_PERMS (should be 600)"
    fi
fi

# Check SSH config
if grep -q "^PermitRootLogin no" /etc/ssh/sshd_config 2>/dev/null; then
    pass "Root SSH login disabled"
else
    warn "Root SSH login may be enabled"
fi

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo "=========================================="
echo "VALIDATION SUMMARY"
echo "=========================================="
echo "PASS: $PASS_COUNT"
echo "WARN: $WARN_COUNT"
echo "FAIL: $FAIL_COUNT"
echo ""

if [ "$FAIL_COUNT" -eq 0 ]; then
    if [ "$WARN_COUNT" -eq 0 ]; then
        echo "STATUS: ALL CHECKS PASSED ✓"
        exit 0
    else
        echo "STATUS: PASSED WITH WARNINGS ⚠"
        exit 0
    fi
else
    echo "STATUS: VALIDATION FAILED ✗"
    exit 1
fi
