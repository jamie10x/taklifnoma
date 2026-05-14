# 🚀 Ubuntu Deployment Guide

This guide deploys the **Taklifnoma** wedding invitation website to an Ubuntu server using:

- **Bun** for dependency installation and build steps
- **PM2** to keep the frontend process running
- **Nginx** as the reverse proxy for your domain
- **Certbot** for HTTPS

It is written for Ubuntu 22.04 / 24.04 LTS.

---

## 1) Prerequisites

Before you start, make sure you have:

- An Ubuntu server with sudo access
- A domain name pointing to the server IP address
- Ports `22`, `80`, and `443` open
- Your project repository URL

Recommended runtime:

- **Node.js 20 LTS** for PM2 and Next.js runtime compatibility
- **Bun** for fast installs and builds

---

## 2) Prepare the server

Update the server and install base packages:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx ufw
```

Enable the firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

Install Node.js 20 LTS:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

Install Bun:

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
bun --version
```

Install PM2 globally:

```bash
sudo npm install -g pm2
pm2 -v
```

---

## 3) Clone the project

Create a clean deploy directory and clone the app:

```bash
sudo mkdir -p /var/www/taklifnoma
sudo chown -R $USER:$USER /var/www/taklifnoma
git clone <your-repository-url> /var/www/taklifnoma
cd /var/www/taklifnoma
```

If you already cloned the repo somewhere else, just `cd` into that folder.

---

## 4) Configure environment variables

Create `.env.local` in the project root:

```bash
cat > .env.local <<'EOF'
TELEGRAM_BOT_TOKEN=your_bot_token_here
CHAT_ID=your_telegram_chat_id_here
EOF
chmod 600 .env.local
```

Environment variables used by the app:

- `TELEGRAM_BOT_TOKEN` — sends RSVP notifications to Telegram
- `CHAT_ID` — target Telegram chat or channel ID

If you add more variables later, keep them here as well.

---

## 5) Install dependencies and build

Install the project dependencies:

```bash
bun install
```

Build the production app:

```bash
bun run build
```

Optional checks:

```bash
bun run lint
```

If the build fails, fix the issue before continuing.

---

## 6) Run the app with PM2

Because you are using PM2 for frontend process management, the cleanest approach is to run Bun through PM2 using an ecosystem file.

Create `ecosystem.config.cjs` in the project root:

```js
module.exports = {
  apps: [
    {
      name: 'taklifnoma',
      script: 'bun',
      args: 'run start -- --hostname 127.0.0.1 --port 3000',
      interpreter: 'none',
      cwd: '/var/www/taklifnoma',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

Start the app:

```bash
pm2 start ecosystem.config.cjs
pm2 status
```

Save the PM2 process list and enable auto-start on reboot:

```bash
pm2 save
pm2 startup
```

PM2 will print one extra command after `pm2 startup`. Copy and run that command exactly.

Useful PM2 commands:

```bash
pm2 logs taklifnoma
pm2 restart taklifnoma
pm2 stop taklifnoma
pm2 delete taklifnoma
```

---

## 7) Configure Nginx as a reverse proxy

Create a new Nginx site configuration:

```bash
sudo nano /etc/nginx/sites-available/taklifnoma
```

Paste this config and replace `yourdomain.com` with your real domain:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 10m;

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
    }
}
```

Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/taklifnoma /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

If you have the default site enabled and it conflicts, remove it first:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8) Enable HTTPS with Certbot

Install Certbot and the Nginx plugin:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Request and install the certificate:

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot will automatically update Nginx and redirect HTTP to HTTPS if you choose that option.

Test automatic renewal:

```bash
sudo certbot renew --dry-run
```

---

## 9) Verify the deployment

Check that PM2 is running:

```bash
pm2 status
```

Check the app locally on the server:

```bash
curl -I http://127.0.0.1:3000
```

Check Nginx:

```bash
sudo systemctl status nginx
sudo nginx -t
```

Open your domain in the browser and verify:

- the invitation page loads
- the envelope animation works
- RSVP form submits successfully
- Telegram notifications arrive
- PDF / PNG generation works

---

## 10) Update workflow

When you need to deploy a new version:

```bash
cd /var/www/taklifnoma
git pull
bun install
bun run build
pm2 restart taklifnoma
```

If you changed environment variables:

```bash
pm2 restart taklifnoma --update-env
```

---

## 11) Troubleshooting

### 502 Bad Gateway

Usually means the app is not running or PM2 is using the wrong port.

Check:

```bash
pm2 status
pm2 logs taklifnoma
```

### Nginx config error

Run:

```bash
sudo nginx -t
```

### Build failure

Re-run the build and inspect the error:

```bash
bun run build
```

### PM2 does not start after reboot

Make sure you ran:

```bash
pm2 save
pm2 startup
```

and executed the command printed by `pm2 startup`.

### Telegram notifications are not sending

Check that the environment variables are correct:

```bash
cat .env.local
```

Also verify the bot token and chat ID in Telegram.

---

## 12) Suggested server layout

```text
/var/www/taklifnoma
├── .env.local
├── ecosystem.config.cjs
├── public/
├── src/
└── ...
```

---

## 13) Notes

- Keep the app bound to `127.0.0.1` and let Nginx expose it publicly.
- Use HTTPS only in production.
- Keep your `.env.local` private and never commit it.
- If you later move to a different process manager, the Nginx part stays the same.

