# TaskSteer AWS Deployment Guide

This guide walks you through deploying TaskSteer to AWS using EC2 with GitHub Actions CI/CD.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: AWS Account & IAM Setup](#step-1-aws-account--iam-setup)
3. [Step 2: Network & Security](#step-2-network--security)
4. [Step 3: EC2 Instance Deployment](#step-3-ec2-instance-deployment)
5. [Step 4: GitHub Actions Setup](#step-4-github-actions-setup)
6. [Step 5: Domain & SSL Setup](#step-5-domain--ssl-setup)
7. [Step 6: Post-Deployment Verification](#step-6-post-deployment-verification)
8. [Troubleshooting](#troubleshooting)
9. [Future Scalability](#future-scalability)

---

## Prerequisites

- AWS Account with administrative access
- GitHub repository (this repo should be named `tasksteer`)
- A domain name (optional but recommended for SSL)
- Basic familiarity with AWS Console

---

## Step 1: AWS Account & IAM Setup

### 1.1 Secure Your Root Account

1. Log in to AWS Console with root credentials
2. Go to **IAM** → **Security credentials**
3. Enable **MFA** on the root account
4. **Never use root for daily operations**

### 1.2 Create an Admin IAM User

1. Go to **IAM** → **Users** → **Create user**
2. Username: `tasksteer-admin`
3. Enable **Console access** and **Programmatic access**
4. Attach policy: `AdministratorAccess`
5. Save credentials securely

### 1.3 Create EC2 IAM Role

Create an IAM role that will be attached to the EC2 instance:

1. Go to **IAM** → **Roles** → **Create role**
2. **Trusted entity**: AWS service → EC2
3. Role name: `tasksteer-ec2-role`
4. Attach these **managed policies**:
   - `AmazonSSMManagedInstanceCore` (for SSM Session Manager)
   - `CloudWatchAgentServerPolicy` (for logging)

5. Create a **custom policy** for AWS Comprehend:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "ComprehendAccess",
            "Effect": "Allow",
            "Action": [
                "comprehend:DetectEntities",
                "comprehend:DetectKeyPhrases",
                "comprehend:DetectSentiment",
                "comprehend:DetectSyntax",
                "comprehend:DetectDominantLanguage",
                "comprehend:BatchDetectEntities",
                "comprehend:BatchDetectKeyPhrases",
                "comprehend:BatchDetectSentiment"
            ],
            "Resource": "*"
        }
    ]
}
```

Name this policy: `tasksteer-comprehend-policy` and attach it to the role.

---

## Step 2: Network & Security

### 2.1 Choose Your Region

Default: **us-east-1** (N. Virginia)

Considerations:
- Lower latency for North American users
- Most services available
- Generally lower costs

### 2.2 Create EC2 Key Pair

1. Go to **EC2** → **Key Pairs** → **Create key pair**
2. Name: `tasksteer-key`
3. Type: **RSA**
4. Format: **.pem** (for Linux/Mac) or **.ppk** (for Windows/PuTTY)
5. Download and store securely (you cannot download again!)

### 2.3 Create Security Group

1. Go to **EC2** → **Security Groups** → **Create security group**
2. Name: `tasksteer-sg`
3. Description: "TaskSteer application security group"
4. VPC: Default VPC

**Inbound Rules:**

| Type  | Port | Source           | Description               |
|-------|------|------------------|---------------------------|
| SSH   | 22   | Your IP/32       | Emergency SSH access      |
| HTTP  | 80   | 0.0.0.0/0        | Web traffic               |
| HTTPS | 443  | 0.0.0.0/0        | Secure web traffic        |

**Outbound Rules:**

| Type       | Port | Destination | Description        |
|------------|------|-------------|--------------------|
| All traffic| All  | 0.0.0.0/0   | Allow all outbound |

---

## Step 3: EC2 Instance Deployment

### 3.1 Launch EC2 Instance

1. Go to **EC2** → **Instances** → **Launch instances**

2. **Configuration:**
   - Name: `tasksteer-prod`
   - AMI: **Ubuntu Server 22.04 LTS** (64-bit x86)
   - Instance type: **t3.medium** (minimum recommended)
   - Key pair: `tasksteer-key`
   - Security group: `tasksteer-sg`
   - Storage: **30-50 GB gp3**

3. **Advanced details:**
   - IAM instance profile: `tasksteer-ec2-role`
   - User data: Copy contents from `deploy/ec2-bootstrap.sh`

4. Click **Launch instance**

### 3.2 Allocate Elastic IP (Recommended)

1. Go to **EC2** → **Elastic IPs** → **Allocate Elastic IP address**
2. Click **Allocate**
3. Select the new IP → **Actions** → **Associate Elastic IP address**
4. Select your `tasksteer-prod` instance
5. Click **Associate**

Note this IP address - you'll need it for GitHub secrets.

### 3.3 Verify Bootstrap Completion

Connect via SSM Session Manager (preferred) or SSH:

```bash
# Check bootstrap log
cat /var/log/tasksteer-bootstrap.log

# Verify Node.js
node --version

# Verify PM2
pm2 --version

# Verify Nginx
nginx -v
```

---

## Step 4: GitHub Actions Setup

### 4.1 Create GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:

| Secret Name            | Value                                    |
|------------------------|------------------------------------------|
| `AWS_ACCESS_KEY_ID`    | Your admin IAM user access key           |
| `AWS_SECRET_ACCESS_KEY`| Your admin IAM user secret key           |
| `AWS_REGION`           | `us-east-1` (or your chosen region)      |
| `EC2_HOST`             | Your Elastic IP address                   |
| `EC2_USER`             | `ubuntu`                                 |
| `EC2_SSH_KEY`          | Contents of `tasksteer-key.pem` file     |

### 4.2 Initial Repository Setup on EC2

SSH into your EC2 instance and set up the repository:

```bash
cd /home/ubuntu

# Clone your repository
git clone https://github.com/YOUR_USERNAME/tasksteer.git

# Navigate to app directory
cd tasksteer/pms-app

# Create environment file
cp .env.example .env
nano .env  # Edit with your actual values

# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build the application
npm run build

# Start with PM2
cd ..
pm2 start ecosystem.config.js --env production
pm2 save
```

### 4.3 Trigger First Deployment

1. Make any commit to the `main` branch
2. Go to **Actions** tab in GitHub
3. Watch the deployment workflow run
4. Verify success

---

## Step 5: Domain & SSL Setup

### 5.1 Point Domain to EC2

1. In your domain registrar, create an A record:
   - Type: `A`
   - Name: `@` or subdomain (e.g., `tasksteer`)
   - Value: Your Elastic IP

2. Wait for DNS propagation (may take up to 48 hours)

### 5.2 Install SSL Certificate (Let's Encrypt)

SSH into your EC2 instance:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d tasksteer.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 5.3 Update Nginx Configuration

Replace the default Nginx config with the production version:

```bash
sudo cp /home/ubuntu/tasksteer/deploy/nginx.conf /etc/nginx/sites-available/tasksteer
sudo nano /etc/nginx/sites-available/tasksteer  # Update domain names
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 6: Post-Deployment Verification

### 6.1 Health Checks

```bash
# Check application status
pm2 status

# Check application logs
pm2 logs tasksteer

# Check Nginx status
systemctl status nginx

# Test locally
curl http://localhost:3000

# Test through Nginx
curl http://localhost
```

### 6.2 Verify AWS Comprehend Integration

```bash
# Test Comprehend access (from EC2)
curl -X POST http://localhost:3000/api/ai/analyze-email \
  -H "Content-Type: application/json" \
  -d '{"email": {"subject": "Test Subject", "body": "This is a test email body.", "from": "test@example.com"}}'
```

---

## Troubleshooting

### Application Not Starting

```bash
# Check PM2 logs
pm2 logs tasksteer --lines 100

# Check for errors
pm2 show tasksteer

# Restart application
pm2 restart tasksteer
```

### Nginx Errors

```bash
# Test configuration
sudo nginx -t

# Check error log
sudo tail -f /var/log/nginx/error.log
```

### Database Issues

```bash
cd /home/ubuntu/tasksteer/pms-app

# Check database file
ls -la prisma/

# Reset database (WARNING: deletes all data)
npx prisma db push --force-reset
```

### AWS Comprehend Errors

1. Verify IAM role is attached to EC2:
   - EC2 → Instances → Select instance → Actions → Security → Modify IAM role
   
2. Check credentials are working:
   ```bash
   aws sts get-caller-identity
   aws comprehend detect-sentiment --text "Hello world" --language-code en
   ```

### GitHub Actions Failing

1. Check the workflow logs in GitHub Actions tab
2. Verify all secrets are correctly set
3. Ensure EC2 security group allows SSH from GitHub Actions IPs

---

## Future Scalability

**Note:** These improvements are documented for future iterations. Do NOT implement yet.

### Database Migration (SQLite → PostgreSQL)

When ready to scale:
- Provision AWS RDS PostgreSQL instance
- Update Prisma schema provider
- Run migration scripts
- Update `DATABASE_URL` in environment

### Background Job Processing

For heavy workloads:
- Set up AWS SQS for job queuing
- Create worker processes with PM2
- Move email sync to background workers

### AI Processing Optimization

For high-volume AI analysis:
- Move heavy Comprehend calls to Lambda functions
- Implement result caching with Redis/ElastiCache
- Use batch processing for bulk operations

### Logging & Monitoring

Production-grade observability:
- Configure CloudWatch Logs agent
- Set up CloudWatch Alarms for metrics
- Implement structured JSON logging
- Create CloudWatch Dashboard

### High Availability

For production traffic:
- Deploy to multiple Availability Zones
- Set up Application Load Balancer
- Configure Auto Scaling Group
- Use EFS for shared file storage (SQLite alternative)

---

## Support

For issues specific to this deployment:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review GitHub Actions logs
3. Check application logs via `pm2 logs`
4. Review AWS CloudTrail for IAM/permission issues
