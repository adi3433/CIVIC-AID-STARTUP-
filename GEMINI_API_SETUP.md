# LeadGen AI - Gemini API Configuration Guide

## 🔑 How to Configure Your Google Gemini API Key

You have **two options** for using the LeadGen AI feature:

### Option 1: Direct Configuration (Easiest - Recommended)

1. **Get your API key:**
   - Visit: https://aistudio.google.com/app/apikey
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the API key (starts with `AIza...`)

2. **Configure in the app:**
   - Open http://localhost:8000/leadgen.html
   - Click the **"⚙️ Configure API"** button in the header
   - Paste your API key
   - Click "Save & Activate"

3. **You're all set!**
   - The status will change from "Demo Mode" to "Live AI"
   - Your key is stored securely in your browser's local storage
   - Now you can analyze any text with real AI

### Option 2: Environment Variables (For Developers)

If you're working with the React component (`modules/leadgen/LeadPrediction.jsx`):

1. **Create a `.env` file** in the project root:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` and add your API key:**
   ```env
   # Google Gemini API Key
   GOOGLE_API_KEY=your_actual_api_key_here
   NEXT_PUBLIC_GOOGLE_API_KEY=your_actual_api_key_here
   ```

3. **The React component will automatically use the key**

## 🎯 How It Works

### Demo Mode (No API Key)
- ✅ Three pre-configured investigation workflows
- ✅ Deepfake fraud, phishing, and crypto scam analysis
- ❌ Cannot analyze custom text

### Live AI Mode (With API Key)
- ✅ All demo features
- ✅ **Real-time analysis of any text**
- ✅ Custom investigation workflows
- ✅ Adaptive responses based on your input

## 📊 Current Implementation

### HTML Version (`web/leadgen.html`)
- **Uses:** Direct API calls to Google Gemini REST API
- **Storage:** Browser localStorage
- **Configuration:** In-app UI (⚙️ Configure API button)
- **Best for:** Quick demos and testing

### React Version (`modules/leadgen/LeadPrediction.jsx`)
- **Uses:** @langchain/google-genai package
- **Storage:** Environment variables
- **Configuration:** `.env` file
- **Best for:** Production deployments

## 🔒 Security Notes

1. **API keys in localStorage** (HTML version):
   - Stored only in your browser
   - Not sent to any external servers
   - Cleared when you clear browser data

2. **API keys in .env** (React version):
   - Never committed to git (`.env` is in `.gitignore`)
   - Only accessible server-side
   - More secure for production

## 💡 Getting Started - Quick Test

1. **Without API key (Demo Mode):**
   ```
   http://localhost:8000/leadgen.html
   → Click any quick prompt card
   → See pre-configured responses
   ```

2. **With API key (Live AI):**
   ```
   http://localhost:8000/leadgen.html
   → Click "⚙️ Configure API"
   → Paste your key
   → Try any custom text analysis
   ```

## 🆓 Free Tier Information

Google Gemini API offers a generous free tier:
- **60 requests per minute**
- **1,500 requests per day**
- More than enough for testing and demos

Get your key: https://aistudio.google.com/app/apikey

## ❓ Troubleshooting

**Problem:** "API error: 400"
- **Solution:** Check if your API key is correct

**Problem:** "API error: 403"
- **Solution:** Your API key might be invalid or restricted

**Problem:** "API error: 429"
- **Solution:** You've hit the rate limit. Wait a minute.

**Problem:** Still in Demo Mode after saving key
- **Solution:** Refresh the page or check browser console for errors

## 📝 Files Modified

- ✅ `.env.example` - Added GOOGLE_API_KEY and NEXT_PUBLIC_GOOGLE_API_KEY
- ✅ `web/leadgen.html` - Added in-app API configuration
- ✅ This documentation file

## 🚀 Next Steps

1. Get your free API key from Google
2. Configure it using the in-app button
3. Try analyzing suspicious text with real AI
4. Explore the three pre-configured investigation workflows
