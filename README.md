# Taklifnoma

An elegant digital wedding invitation and RSVP system built with Next.js. This application allows guests to view event details, RSVP for the wedding, and download/share a personalized invitation in both PNG and PDF formats.

## 🌟 Overview

- **Interactive UI**: Luxurious, animated envelope opening sequence using `framer-motion`.
- **Personalized Invitations**: Automatically generates custom invitation images (PNG) and documents (PDF) with the guest's name.
- **RSVP System**: Integrated RSVP form with automated notifications.
- **Real-time Notifications**: Sends RSVP details to a Telegram chat via a bot.
- **Countdown Timer**: Displays the time remaining until the main event.

## 🛠 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **PDF Generation**: [pdf-lib](https://pdf-lib.js.org/)
- **Image Generation**: [html-to-image](https://github.com/bubkoo/html-to-image)
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
CHAT_ID=your_telegram_chat_id_here
```

### 4. Run the development server
```bash
bun dev
# or
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🚀 Production Deployment

For Ubuntu server deployment, use the full guide in [DEPLOYMENT.md](./DEPLOYMENT.md).

Quick summary of the production setup:

- Build with `bun run build`
- Run with PM2 using `ecosystem.config.cjs`
- Put Nginx in front of the app and point your domain to `127.0.0.1:3000`

Example PM2 command:

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

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
│   ├── taklifnoma.jpg     # Image template for PNG generation
│   └── taklifnoma.pdf     # PDF template for document generation
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/rsvp/      # RSVP submission and PDF generation endpoint
│   │   ├── globals.css    # Global styles and Tailwind imports
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Main invitation page
│   └── components/        # Reusable React components
│       └── GlassCard.tsx  # Styled container component
├── next.config.mjs        # Next.js configuration
├── ecosystem.config.cjs   # PM2 production process file
├── tailwind.config.ts     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## 📝 TODOs

- [x] Add interactive map for the wedding venue.
- [x] Refine schedule and address layout.
- [x] Adjust invitation template positioning.

## 📄 License

This project is private and for personal use. (Update this section if a specific license like MIT is adopted).
