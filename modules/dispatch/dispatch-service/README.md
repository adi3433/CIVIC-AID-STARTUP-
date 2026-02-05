# CivicAid Dispatch Service

A Next.js-powered emergency dispatch interface with AI-powered call classification, voice interaction, and intelligent routing.

## Features

- 🎙️ **Voice Recognition**: Real-time speech-to-text
- 🔊 **Voice Synthesis**: AI responses spoken with customizable voice
- 🤖 **AI Classification**: Emergency categorization using Google Gemini
- 📞 **Dispatch Simulation**: Full call flow simulation
- 🌙 **Dark Mode**: Premium dark interface

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Google Gemini API key (optional, for AI features)

### Installation

```bash
npm install
```

### Configuration

Create a `.env.local` file:

```bash
# Required for AI features
NEXT_PUBLIC_GOOGLE_API_KEY=your_api_key_here

# Optional: Supabase for logging
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development

```bash
npm run dev
```

Open [http://localhost:5002](http://localhost:5002)

### Production Build

```bash
npm run build
npm run start
```

## API Routes

- `POST /api/webhook` - Handle call dispatch
- `GET /api/health` - Health check

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server on port 5002 |
| `npm run build` | Build for production |
| `npm run start` | Start production server on port 5002 |
| `npm run start:with-backend` | Run with Flask backend |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── health/route.js    # Health check
│   │   └── webhook/route.js   # Dispatch webhook
│   ├── dispatch/
│   │   ├── components/        # UI components
│   │   ├── hooks/             # React hooks
│   │   └── page.jsx           # Main dispatch UI
│   ├── globals.css            # Global styles
│   ├── layout.js              # Root layout
│   └── page.js                # Entry point
└── utils/
    ├── speechUtils.js         # Speech API helpers
    └── voiceConfig.js         # Voice settings
```

## Integration

This service is part of the CivicAid platform dispatch module. It replaces/extends the Flask backend (`dispatcher_stub.py`) with a full-featured web interface.

## License

MIT License - CivicAid Team 2026
