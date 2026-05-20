# Taklifnoma

An elegant digital wedding invitation and RSVP system built with Next.js. This application allows guests to view event details, RSVP for the wedding, preview their personalized invitation, and download/share a personalized PDF.

## 🌟 Overview

- **Interactive UI**: Luxurious, animated envelope opening sequence using `framer-motion`.
- **Personalized Invitations**: Shows a personalized invitation preview and generates PDF documents with the guest's name.
- **RSVP System**: Integrated RSVP form with automated notifications.
- **Real-time Notifications**: Sends RSVP details to a Telegram chat via a bot.
- **Telegram Delivery**: Sends each guest their personalized PDF through a Telegram bot deep link.
- **Countdown Timer**: Displays the time remaining until the main event.

## 🛠 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **PDF Generation**: [pdf-lib](https://pdf-lib.js.org/)
- **Package Manager**: [Bun](https://bun.sh/) (indicated by `bun.lock`)

## 📋 Requirements

- Node.js 18.x or later
- Bun (recommended) or npm/yarn

## 🚀 Getting Started

For detailed deployment instructions on a VPS, please see [DEPLOYMENT.md](./DEPLOYMENT.md).

### 1. Clone the repository
```bash
git clone <repository-url>
cd taklifnoma
```

### 2. Install dependencies
```bash
bun install
# or
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory and add the following:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot_username_without_at_symbol
TELEGRAM_ADMIN_CHAT_ID=your_telegram_group_or_admin_chat_id
```

After deploying to a public HTTPS domain, register the Telegram webhook:

```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook?url=https://your-domain.com/api/webhook/telegram"
```

### 4. Run the development server
```bash
bun dev
# or
npm run dev
```
Open [http://localhost:3009](http://localhost:3009) with your browser to see the result.

## 🚀 Production Deployment

For Ubuntu server deployment, use the full guide in [DEPLOYMENT.md](./DEPLOYMENT.md).

Quick summary of the production setup:

- Build with `bun run build`
- Run with PM2 using `ecosystem.config.cjs`
- Put Nginx in front of the app and point your domain to `127.0.0.1:3009`
- Use `deploy/deploy.sh` for repeat one-command deploys on the server

Example PM2 command:

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Deploy helper files included in this repo:

- `deploy/deploy.sh` — pull, install, build, and reload PM2 in one command
- `deploy/nginx/taklifnoma.nginx.conf` — Nginx server block template
- `deploy/systemd/taklifnoma.service` — optional systemd fallback service

## 📜 Available Scripts

- `bun dev`: Starts the development server.
- `bun build`: Builds the application for production.
- `bun start`: Starts the production server.
- `bun lint`: Runs ESLint to check for code quality issues.
- `node create-dummy-pdf.mjs`: Utility script to create a placeholder PDF template in `public/`.
- `pm2 start ecosystem.config.cjs`: Starts the production app process.

## 📂 Project Structure

```text
├── public/                # Static assets (images, PDF templates)
│   ├── taklifnoma.svg     # Sharp image template for website preview
│   ├── taklifnoma.jpg     # Fallback raster invitation asset
│   └── taklifnoma.pdf     # PDF template for document generation
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/rsvp/      # RSVP submission and PDF generation endpoint
│   │   ├── globals.css    # Global styles and Tailwind imports
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Main invitation page
│   ├── lib/               # Shared PDF and Telegram helpers
│   └── components/        # Reusable React components
│       └── GlassCard.tsx  # Styled container component
├── next.config.mjs        # Next.js configuration
├── ecosystem.config.cjs   # PM2 production process file
├── deploy/                # Deployment helper files
│   ├── deploy.sh          # One-command deployment script
│   ├── nginx/             # Nginx sample config
│   └── systemd/           # Optional systemd service file
├── tailwind.config.ts     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## 📝 TODOs

- [x] Add interactive map for the wedding venue.
- [x] Refine schedule and address layout.
- [x] Adjust invitation template positioning.

## 📄 License

This project is private and for personal use. (Update this section if a specific license like MIT is adopted).
