# Hackathon Chatbot

A modern, intuitive one-page Next.js chatbot application integrated with LM Studio for hackathon participants.

## Features

- 🎨 Modern, light-themed UI with smooth animations
- 💬 Real-time chat interface with typing indicators
- 🤖 Integration with LM Studio for local AI inference
- 📱 Responsive design for mobile and desktop
- ⚡ Fast and lightweight with minimal file structure

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start LM Studio:**
   - Download and install [LM Studio](https://lmstudio.ai/)
   - Load any chat model (e.g., Llama 2, Code Llama, Mistral)
   - Start the local server (typically runs on `localhost:1234`)

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Configuration

The app automatically connects to LM Studio running on `localhost:1234`. If your LM Studio runs on a different port, set the environment variable:

```bash
LM_STUDIO_URL=http://localhost:YOUR_PORT/v1/chat/completions
```

## File Structure

```
decode/
├── app/
│   ├── api/chat/route.ts    # LM Studio API integration
│   ├── globals.css          # Tailwind styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main chatbot interface
├── package.json             # Dependencies
├── tailwind.config.js       # Styling configuration
├── tsconfig.json            # TypeScript configuration
├── next.config.js           # Next.js configuration
└── postcss.config.js        # PostCSS configuration
```

## Troubleshooting

- **"Connection error"**: Ensure LM Studio is running and has a model loaded
- **"Port 1234 not available"**: Check if LM Studio is using a different port
- **Slow responses**: Consider using a smaller/faster model in LM Studio

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI Backend**: LM Studio (local inference)
- **Language**: TypeScript
