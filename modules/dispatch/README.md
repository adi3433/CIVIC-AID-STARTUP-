# Dispatch Module

**Owner:** Lestlin  
**Port:** 5002

## Overview

This module handles emergency call dispatch with AI-powered classification, voice recognition, and intelligent call routing. It consists of two components:

1. **dispatch-service** (Next.js) - Full-featured web UI with voice interaction
2. **dispatcher_stub.py** (Flask) - Lightweight webhook API for backend integration

## 🚀 Quick Start

### Option 1: Run Next.js Frontend (Recommended for Development)

```bash
cd dispatch-service
npm install
npm run dev
```

Open [http://localhost:5002](http://localhost:5002) to use the AI Dispatch interface.

### Option 2: Run Flask Backend Only

```bash
# From project root
python -m modules.dispatch.dispatcher_stub
```

The server runs on http://localhost:5002

## 🌐 Architecture

```
dispatch/
├── dispatch-service/       # Next.js Frontend Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── health/     # Health check endpoint
│   │   │   │   └── webhook/    # Dispatch webhook handler
│   │   │   ├── dispatch/       # Dispatch UI components
│   │   │   └── page.js         # Main entry point
│   │   └── utils/              # Helper utilities
│   │       ├── speechUtils.js  # Web Speech API integration
│   │       └── voiceConfig.js  # Voice settings persistence
│   └── package.json
├── dispatcher_stub.py      # Flask backend (Python)
├── mock_calls.json         # Test data
└── tests/                  # Test suite
```

## 🔌 API Endpoints

### Next.js API Routes

#### POST /api/webhook
Handle incoming call dispatch with AI classification.

**Request:**
```json
{
  "call_id": "call_12345",
  "from": "+919876543210",
  "primary_busy": true,
  "metadata": {
    "region": "kerala",
    "priority": "high",
    "emergency_type": "medical",
    "transcript": "Someone is having a heart attack"
  }
}
```

**Response (primary_busy=true):**
```json
{
  "action": "fallback_ai",
  "call_id": "call_12345",
  "classification": "medical",
  "priority": "high",
  "recommended_action": "Dispatch ambulance immediately",
  "forward_to": "102",
  "timestamp": "2026-02-05T23:00:00.000Z",
  "ai_powered": true
}
```

**Response (primary_busy=false):**
```json
{
  "action": "connect_primary",
  "call_id": "call_12345",
  "timestamp": "2026-02-05T23:00:00.000Z"
}
```

#### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "module": "dispatch",
  "service": "dispatch-service",
  "port": 5002,
  "features": {
    "ai_classification": true,
    "call_logging": false,
    "voice_synthesis": true,
    "speech_recognition": true
  }
}
```

### Flask Backend API

#### POST /dispatch/webhook
Same contract as Next.js webhook (for backend integration).

#### GET /health
Basic health check.

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in `dispatch-service/`:

```bash
# Required for AI-powered dispatch
NEXT_PUBLIC_GOOGLE_API_KEY=your_google_api_key

# Optional: Supabase for call logging
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend integration
FLASK_BACKEND_URL=http://localhost:5002
```

## 📱 Features

### Voice Interaction
- **Speech Recognition**: Real-time speech-to-text using Web Speech API
- **Voice Synthesis**: AI responses spoken aloud with customizable voice
- **Audio Recording**: Record audio for Gemini processing

### AI Classification
- Emergency type classification (police/medical/fire)
- Priority assessment
- Intelligent routing recommendations
- Powered by Google Gemini API

### UI Features
- Dark mode interface
- Real-time audio visualization
- Conversation history
- Voice settings panel (rate, pitch, volume)
- Text input fallback mode

## 🧪 Testing

```bash
# Run all tests
pytest tests/ -v

# Test webhook locally
curl -X POST http://localhost:5002/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"call_id": "test_001", "from": "+919876543210", "primary_busy": true}'
```

## 🔄 Integration with Main Project

The dispatch module integrates with the CivicAid platform:

1. **Port 5002**: Consistent with the module registry
2. **API Contract**: Follows `contracts/openapi.yaml`
3. **Health Checks**: Compatible with platform monitoring

### Running with Full Stack

```bash
# Terminal 1: Flask backend
python -m modules.dispatch.dispatcher_stub

# Terminal 2: Next.js frontend
cd modules/dispatch/dispatch-service
npm run dev
```

Or use the combined script:
```bash
cd modules/dispatch/dispatch-service
npm run start:with-backend
```

## 📋 TODO: Production Integration

- [ ] Integrate with Twilio Voice API
- [ ] Set up Twilio account and phone numbers
- [ ] Configure voice webhooks
- [ ] Implement real-time agent availability tracking
- [ ] Add call recording and transcription storage
- [ ] Set up monitoring and alerting
- [ ] Implement call queue management

## 📄 License

MIT License - CivicAid Team 2026
