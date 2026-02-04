---
description: CivicAid module status and workflow guide for team collaboration
---

# CivicAid - Module Status & Workflow

## Current Module Status

| Module | Owner | Status | Port | Implementation |
|--------|-------|--------|------|----------------|
| **WhatsApp** | Adithyan | ✅ **CANONICAL** | 5001 | Production-ready demo |
| **Dispatch** | Lestlin | 🔶 STUB | 5002 | Needs Twilio integration |
| **LeadGen** | Lestlin | 🔶 STUB | 5003 | Needs RAG/LLM integration |
| **Education** | Basil | 🔶 STUB | 5004 | Needs python-pptx integration |
| **Web UI** | Amal & Anita | 🔶 STUB | - | Static HTML demos |

---

## Adithyan's WhatsApp Module - How It Works

### Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    WhatsApp Bot Generator                    │
├─────────────────────────────────────────────────────────────┤
│  POST /whatsapp/generate                                     │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────────┐  │
│  │  Request    │ -> │  Template    │ -> │  Bot Flow +    │  │
│  │  template_id│    │  Processor   │    │  Simulation    │  │
│  │  overrides  │    │              │    │                │  │
│  │  dry_run    │    └──────────────┘    └────────────────┘  │
│  └─────────────┘           │                     │          │
│                            v                     v          │
│                   config_templates.json    Deterministic    │
│                   (phone_repair_basic,     Response JSON    │
│                    complaint_basic,                         │
│                    emergency_basic)                         │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow
1. **Client sends POST** to `/whatsapp/generate` with:
   - `template_id`: Which bot template to use
   - `overrides`: Custom text replacements (optional)
   - `dry_run`: If true, simulate only (default)

2. **Server processes**:
   - Loads template from `config_templates.json`
   - Applies any overrides
   - Generates deterministic `bot_flow` structure
   - Creates `simulation` conversation preview

3. **Response returned**:
   - `bot_flow`: Complete bot configuration with steps
   - `simulation`: Sample conversation for preview

### Available Templates
- `phone_repair_basic` - Phone repair service bot
- `complaint_basic` - Civic complaints portal
- `emergency_basic` - Emergency response routing

### Running the Module
```bash
# Start server
python -m modules.whatsapp.app

# Test endpoint
curl -X POST http://localhost:5001/whatsapp/generate \
  -H "Content-Type: application/json" \
  -d '{"template_id": "phone_repair_basic", "dry_run": true}'
```

### Files You Own
```
modules/whatsapp/
├── app.py              # Main Flask server (YOUR CODE)
├── adapters.py         # WhatsApp Business API interfaces (TODOs)
├── config_templates.json  # Bot templates (EXTEND THIS)
├── demo.sh             # Demo script
└── tests/
    └── test_generate.py   # Unit tests
```

### Next Steps for Production
1. Implement `adapters.send_message()` with WhatsApp Business API
2. Add more templates to `config_templates.json`
3. Implement conversation state management
4. Add webhook handler for incoming messages

---

## How Other Modules Work (Stubs)

### Dispatch (Lestlin)
**Purpose**: Route incoming calls with failover to AI when agents are busy
```
POST /dispatch/webhook
  Input:  { call_id, from, primary_busy, metadata }
  Output: { action: "connect_primary" | "fallback_ai", ... }
```
**TODO**: Integrate with Twilio Voice API

### LeadGen (Lestlin)
**Purpose**: Analyze case text and generate investigation recommendations
```
POST /leadgen/analyze
  Input:  { case_text, case_id }
  Output: { case_id, recommendations: [{step, confidence}...] }
```
**TODO**: Implement RAG pipeline with LangChain + OpenAI

### Education (Basil)
**Purpose**: Generate educational presentations from structured content
```
POST /education/generate
  Input:  { title, slides: [{heading, bullets}...] }
  Output: { artifact: "filename.pptx", note: "..." }
```
**TODO**: Use python-pptx for actual PPTX generation

---

## Team Workflow

### Branch Naming
```
feature/{your-name}-{short-description}
```
Examples:
- `feature/adithyan-whatsapp-generator`
- `feature/lestlin-dispatch-twilio`

### Before PR
1. Update `contracts/openapi.yaml` if changing API
2. Add/update tests in `modules/<module>/tests/`
3. Run `pytest modules/<module>/tests/ -v`
4. Fill out `.github/PULL_REQUEST_TEMPLATE.md`

### Running All Demos
```bash
bash scripts/run_all_demos.sh
```

### Validating Contracts
```bash
bash scripts/check_contracts.sh
```
