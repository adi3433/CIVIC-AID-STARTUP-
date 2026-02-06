import requests
import time

# Direct n8n Test URL (Bypassing Vercel/Flask for direct workflow testing)
URL = "https://whiteknight001.app.n8n.cloud/webhook-test/dispatch-webhook"

payload = {
    "call_id": "test_call_999",
    "from": "+919876543210",
    "primary_busy": True,
    "metadata": {
        "transcript": "Help! There is a huge fire in the school near MG Road!",
        "emergency_type": "default",
        "region": "Kerala"
    }
}

print(f"Sending test request to {URL}...")
try:
    start_time = time.time()
    response = requests.post(URL, json=payload, timeout=20)
    elapsed = time.time() - start_time
    
    print(f"Status Code: {response.status_code}")
    print(f"Time Taken: {elapsed:.2f}s")
    
    if response.status_code == 200:
        data = response.json()
        print("\nResponse Data:")
        print(data)
        
        # Validation
        if "ai_response" in data:
            print("\n✅ SUCCESS: 'ai_response' field found! Integration is working.")
        elif "note" in data and "STUB" in data.get("note", ""):
             print("\n⚠️ WARNING: Received STUB response. Check if server was restarted to load .env variable.")
        else:
             print("\n❓ UNKNOWN: Received response but format is unexpected.")
    else:
        print(f"\n❌ FAILED: Server returned error {response.text}")

except Exception as e:
    print(f"\n❌ ERROR: Could not connect to server. Is it running on port 5002? Error: {e}")
