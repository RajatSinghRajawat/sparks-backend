# 🚀 Deployment Guide for `api.sparks-learning.com`

This guide explains how to upload, configure, and host the **EduSpark Backend API** on your Linux VPS (Ubuntu/Debian, DigitalOcean, AWS EC2, Hostinger, Vultr, etc.).

---

## 📋 Table of Contents
1. [Prerequisites & DNS Setup](#1-prerequisites--dns-setup)
2. [Option A: Deployment via PM2 + Nginx (Recommended)](#option-a-deployment-via-pm2--nginx-recommended)
3. [Option B: Deployment via Docker & Docker Compose](#option-b-deployment-via-docker--docker-compose)
4. [Setting Up Free SSL Certificate (HTTPS)](#setting-up-free-ssl-certificate-https)
5. [Setting Up Automated CI/CD (GitHub Actions)](#setting-up-automated-cicd-github-actions)
6. [Useful Server Commands](#useful-server-commands)

---

## 1. Prerequisites & DNS Setup

Before deploying, ensure your domain `api.sparks-learning.com` is pointing to your server's public IP address.

1. Go to your domain DNS Provider (Cloudflare, GoDaddy, Namecheap, etc.).
2. Add an **A Record**:
   - **Type**: `A`
   - **Name / Host**: `api` (or `api.sparks-learning.com`)
   - **IPv4 Address**: `YOUR_SERVER_PUBLIC_IP`
   - **TTL**: Auto or 3600

---

## Option A: Deployment via PM2 + Nginx (Recommended)

### Step 1: Install Node.js, PM2 & Nginx on Server
SSH into your server and run:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git build-essential nginx certbot python3-certbot-nginx

# Install PM2 globally
sudo npm install -g pm2
```

### Step 2: Upload / Clone Project on Server
Clone your repository into `/var/www/backend-spark` (or your preferred directory):
```bash
sudo mkdir -p /var/www/backend-spark
sudo chown -R $USER:$USER /var/www/backend-spark
cd /var/www/backend-spark

# Install production dependencies
npm ci --only=production
mkdir -p uploads
```

### Step 3: Configure `.env` File
Create your production `.env` file:
```bash
cp .env.example .env
nano .env
```
Fill in your database URI, AWS credentials, JWT secrets, and SMTP settings.

### Step 4: Configure Nginx Virtual Host
Copy `nginx.conf` to Nginx sites configuration:
```bash
sudo cp nginx.conf /etc/nginx/sites-available/api.sparks-learning.com
sudo ln -sf /etc/nginx/sites-available/api.sparks-learning.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration & reload
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5: Setup Free SSL (HTTPS) with Certbot
```bash
sudo certbot --nginx -d api.sparks-learning.com
```

### Step 6: Start Backend Application with PM2
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

---

## Option B: Deployment via Docker & Docker Compose

If you prefer containerized deployment with Docker:

1. **Install Docker & Docker Compose**:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```
2. **Start Containers**:
   ```bash
   docker-compose up -d --build
   ```
3. **Check Container Status**:
   ```bash
   docker-compose ps
   docker-compose logs -f api
   ```

---

## Setting Up Automated CI/CD (GitHub Actions)

We included [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) for auto-deploying on `git push main`.

1. In your GitHub Repository, go to **Settings -> Secrets and variables -> Actions**.
2. Add the following repository secrets:
   - `SERVER_HOST`: Your server IP (e.g. `123.45.67.89`)
   - `SERVER_USER`: `root` or `ubuntu`
   - `SERVER_SSH_KEY`: Your private SSH key
   - `SERVER_PORT`: `22` (default)

Whenever you push code to the `main` branch, GitHub Actions will automatically update and restart your backend on `api.sparks-learning.com`!

---

## Useful Server Commands

- **Check PM2 status**: `pm2 status`
- **View Live Logs**: `pm2 logs`
- **Restart Backend**: `pm2 restart api.sparks-learning.com`
- **Nginx status**: `sudo systemctl status nginx`
- **Restart Nginx**: `sudo systemctl restart nginx`
- **Test Nginx Config**: `sudo nginx -t`

---

## API Verification
Once deployed, test your API endpoints:
- Healthcheck: `https://api.sparks-learning.com/api/health`
- Swagger Docs: `https://api.sparks-learning.com/api-docs`
