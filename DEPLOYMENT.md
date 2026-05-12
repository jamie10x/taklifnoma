# 🚀 Deployment Guide (VPS)

This guide provides step-by-step instructions on how to deploy the **Taklifnoma** application to a Virtual Private Server (VPS) running Ubuntu/Debian.

## 📋 Prerequisites

- A VPS with Ubuntu 22.04 or later.
- A domain name pointing to your VPS IP address.
- Node.js (v18+) or [Bun](https://bun.sh/) (recommended).

---

## 🛠 1. Environment Setup

### Install Bun (Recommended)
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

### Install PM2 (Process Manager)
PM2 will keep your application running in the background.
```bash
bun add -g pm2
# or
npm install -g pm2
```

### Install Nginx
```bash
sudo apt update
sudo apt install nginx -y
```

---

## 📦 2. Clone and Prepare

### Clone the Repository
```bash
git clone <your-repo-url>
cd taklifnoma
```

### Install Dependencies
```bash
bun install
```

### Configure Environment Variables
Create a `.env.local` file with your production credentials:
```bash
nano .env.local
```
Add the following:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
CHAT_ID=your_telegram_chat_id_here
```

---

## 🏗 3. Build and Start

### Build the Application
```bash
bun run build
```

### Start with PM2
```bash
pm2 start bun --name "taklifnoma" -- run start
```
*Note: If using npm, use `pm2 start npm --name "taklifnoma" -- start`*

### Enable Startup Script
To ensure the app starts automatically after a server reboot:
```bash
pm2 save
pm2 startup
```
Follow the instructions provided by the `pm2 startup` command.

---

## 🌐 4. Nginx Reverse Proxy

### Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/taklifnoma
```

### Add the Configuration
Replace `yourdomain.com` with your actual domain:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Enable the Configuration
```bash
sudo ln -s /etc/nginx/sites-available/taklifnoma /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 5. SSL with Certbot

Secure your site with HTTPS using Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

---

## 🔄 Updates
To deploy updates in the future:
```bash
git pull
bun install
bun run build
pm2 restart taklifnoma
```
