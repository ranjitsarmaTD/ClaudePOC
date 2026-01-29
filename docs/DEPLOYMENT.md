# Deployment Guide

This guide covers deploying the HR Admin System to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Deployment Options](#deployment-options)
- [Production Checklist](#production-checklist)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Infrastructure Requirements

- **Server**: Linux (Ubuntu 20.04+ or similar)
- **Node.js**: v18.x or higher
- **PostgreSQL**: v14+ with SSL support
- **Memory**: Minimum 2GB RAM (4GB+ recommended)
- **Storage**: Minimum 20GB (with backup strategy)
- **Network**: HTTPS certificate (Let's Encrypt or commercial)

### Required Accounts

- GitHub (for CI/CD)
- Cloud provider (AWS, GCP, Azure, or DigitalOcean)
- Domain name and DNS management
- SSL certificate provider

## Environment Setup

### 1. Production Environment Variables

Create `.env.production`:

```env
# Server Configuration
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1

# Database Configuration (Use production credentials)
DB_HOST=your-production-db-host.com
DB_PORT=5432
DB_NAME=hr_admin_db_prod
DB_USER=hr_admin_user
DB_PASSWORD=<strong-production-password>
DB_SYNCHRONIZE=false  # NEVER true in production
DB_LOGGING=false      # Disable in production for performance
DB_SSL=true           # ALWAYS true in production

# JWT Configuration (CRITICAL: Use strong secrets)
JWT_SECRET=<generate-secure-random-string-min-64-chars>
JWT_EXPIRES_IN=1h
JWT_ISSUER=hr-admin-api-prod

# Logging Configuration
LOG_LEVEL=info  # Use 'info' or 'warn' in production
LOG_FORMAT=json # JSON for log aggregation

# CORS Configuration
CORS_ORIGIN=https://yourapp.com,https://admin.yourapp.com
CORS_CREDENTIALS=true

# Rate Limiting (Adjust based on traffic)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Bcrypt Rounds (Higher = more secure, slower)
BCRYPT_ROUNDS=12
```

### 2. Generate Secure Secrets

```bash
# Generate JWT secret (64+ characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate database password
openssl rand -base64 32
```

## Deployment Options

### Option 1: Traditional Server (VPS/Dedicated)

#### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

#### Step 2: Database Setup

```bash
# Create database user
sudo -u postgres psql -c "CREATE USER hr_admin_user WITH PASSWORD 'your-secure-password';"

# Create database
sudo -u postgres psql -c "CREATE DATABASE hr_admin_db_prod OWNER hr_admin_user;"

# Enable UUID extension
sudo -u postgres psql -d hr_admin_db_prod -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'

# Configure PostgreSQL for remote connections (if needed)
sudo nano /etc/postgresql/14/main/pg_hba.conf
# Add: hostssl all all 0.0.0.0/0 md5

sudo systemctl restart postgresql
```

#### Step 3: Application Deployment

```bash
# Create application directory
sudo mkdir -p /var/www/hr-admin-api
sudo chown $USER:$USER /var/www/hr-admin-api

# Clone repository
cd /var/www/hr-admin-api
git clone https://github.com/ranjitsarmaTD/ClaudePOC.git .

# Install dependencies
npm ci --production

# Create production environment file
cp .env.example .env.production
nano .env.production  # Edit with production values

# Build application
npm run build

# Run database migrations
npm run migration:run
```

#### Step 4: PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'hr-admin-api',
    script: './dist/server.js',
    instances: 'max',  // Use all CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    autorestart: true,
    restart_delay: 4000
  }]
};
```

Start application:

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Run the command PM2 provides

# Check status
pm2 status
pm2 logs hr-admin-api
```

#### Step 5: Nginx Configuration

Create `/etc/nginx/sites-available/hr-admin-api`:

```nginx
server {
    listen 80;
    server_name api.yourapp.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourapp.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.yourapp.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourapp.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    # Access and error logs
    access_log /var/log/nginx/hr-admin-api-access.log;
    error_log /var/log/nginx/hr-admin-api-error.log;
}
```

Enable site and restart Nginx:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/hr-admin-api /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### Step 6: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.yourapp.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Option 2: Docker Deployment

#### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --production

# Copy built application
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=hr_admin_db_prod
      - DB_USER=hr_admin_user
      - DB_PASSWORD=${DB_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
    restart: unless-stopped
    networks:
      - hr-admin-network

  postgres:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=hr_admin_db_prod
      - POSTGRES_USER=hr_admin_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - hr-admin-network

volumes:
  postgres-data:

networks:
  hr-admin-network:
    driver: bridge
```

Deploy with Docker:

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Run migrations
docker-compose exec api npm run migration:run

# Stop
docker-compose down
```

### Option 3: Cloud Platform (AWS/GCP/Azure)

See platform-specific guides:
- [AWS Deployment](./guides/AWS_DEPLOYMENT.md)
- [GCP Deployment](./guides/GCP_DEPLOYMENT.md)
- [Azure Deployment](./guides/AZURE_DEPLOYMENT.md)

## Production Checklist

### Pre-Deployment

- [ ] All tests passing (`npm test`)
- [ ] Build successful (`npm run build`)
- [ ] Security audit clean (`npm audit`)
- [ ] Environment variables configured
- [ ] Database backup created
- [ ] SSL certificate obtained
- [ ] Domain DNS configured
- [ ] Monitoring setup complete

### Deployment

- [ ] Database migrations run successfully
- [ ] Application starts without errors
- [ ] Health check endpoint responding
- [ ] API endpoints accessible
- [ ] Authentication working
- [ ] HTTPS redirect working
- [ ] CORS configuration correct

### Post-Deployment

- [ ] Application logs monitored
- [ ] Performance metrics reviewed
- [ ] Error tracking verified
- [ ] Backup strategy tested
- [ ] Rollback plan documented
- [ ] Team notified

## Monitoring

### Application Monitoring

Use PM2 for basic monitoring:

```bash
# Real-time monitoring
pm2 monit

# Detailed logs
pm2 logs hr-admin-api

# Restart application
pm2 restart hr-admin-api

# Memory usage
pm2 describe hr-admin-api
```

### Database Monitoring

```bash
# Connection count
psql -U hr_admin_user -d hr_admin_db_prod -c "SELECT count(*) FROM pg_stat_activity;"

# Slow queries
psql -U hr_admin_user -d hr_admin_db_prod -c "SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

### Logs

```bash
# Application logs
tail -f /var/www/hr-admin-api/logs/out.log

# Nginx access logs
tail -f /var/log/nginx/hr-admin-api-access.log

# Nginx error logs
tail -f /var/log/nginx/hr-admin-api-error.log

# System logs
journalctl -u hr-admin-api -f
```

## Backup Strategy

### Database Backups

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/var/backups/hr-admin-db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/hr_admin_db_$TIMESTAMP.sql.gz"

# Create backup
pg_dump -U hr_admin_user -h localhost hr_admin_db_prod | gzip > $BACKUP_FILE

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_FILE s3://your-backup-bucket/db-backups/
```

Add to crontab:

```bash
# Daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-db.sh
```

## Rollback Procedure

If deployment fails:

```bash
# 1. Stop current version
pm2 stop hr-admin-api

# 2. Checkout previous version
cd /var/www/hr-admin-api
git checkout <previous-version-tag>

# 3. Reinstall dependencies
npm ci --production

# 4. Rebuild
npm run build

# 5. Revert migrations (if needed)
npm run migration:revert

# 6. Restart application
pm2 start hr-admin-api

# 7. Verify
curl https://api.yourapp.com/api/v1/health
```

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs hr-admin-api --err

# Check environment
pm2 env hr-admin-api

# Test direct start
node dist/server.js
```

### Database Connection Issues

```bash
# Test connection
psql -U hr_admin_user -h localhost -d hr_admin_db_prod

# Check PostgreSQL status
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### High Memory Usage

```bash
# Check process memory
pm2 describe hr-admin-api

# Restart application
pm2 restart hr-admin-api

# Adjust max memory in ecosystem.config.js
max_memory_restart: '1G'
```

## Additional Resources

- [Security Guide](./guides/SECURITY.md)
- [Performance Tuning](./guides/PERFORMANCE.md)
- [Monitoring Guide](./guides/MONITORING.md)

---

**Last Updated**: 2026-01-29
