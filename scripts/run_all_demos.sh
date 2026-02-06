#!/bin/bash
# CivicAid - Run All Demos Script
# 
# This script starts the main unified server and runs demo curl commands.

set -e

echo "=========================================="
echo "CivicAid - Running Unified Platform Demo"
echo "=========================================="
echo ""

# Change to project root
cd "$(dirname "$0")/.."

# Array to store PIDs
declare -a PIDS

cleanup() {
    echo ""
    echo "Shutting down server..."
    for pid in "${PIDS[@]}"; do
        kill $pid 2>/dev/null || true
    done
    echo "Server stopped."
}

trap cleanup EXIT

# Start unified server
echo "🚀 Starting Unified Server (api/index.py) on port 5002..."
python api/index.py &
PIDS+=($!)

# Wait for server to start
echo "Waiting for server to start..."
sleep 5

echo ""
echo "=========================================="
echo "Running Demo Commands (Port 5002)"
echo "=========================================="

# Demo 1: WhatsApp Bot Generator (via bot_config_api)
echo ""
echo "📱 DEMO 1: WhatsApp Bot Generator"
echo "----------------------------------------"
echo "Response:"
curl -s -X POST http://localhost:5002/api/bots/generate \
    -H "Content-Type: application/json" \
    -d '{"description": "A pizza delivery bot that takes orders and tracks delivery"}' | python -m json.tool || echo "Failed"

# Demo 2: Dispatch
echo ""
echo ""
echo "📞 DEMO 2: Dispatch Webhook"
echo "----------------------------------------"
echo "Response:"
curl -s -X POST http://localhost:5002/api/dispatch/webhook \
    -H "Content-Type: application/json" \
    -d @mock_data/dispatch_sample_call.json | python -m json.tool || echo "Failed"

# Demo 3: LeadGen
echo ""
echo ""
echo "🔍 DEMO 3: LeadGen Case Analysis"
echo "----------------------------------------"
echo "Response:"
curl -s -X POST http://localhost:5002/api/leadgen/analyze \
    -H "Content-Type: application/json" \
    -d @mock_data/leadgen_sample_case.json | python -m json.tool || echo "Failed"

# Demo 4: Education
echo ""
echo ""
echo "📚 DEMO 4: Education Presentation Generator"
echo "----------------------------------------"
echo "Response:"
curl -s -X POST http://localhost:5002/api/education/generate \
    -H "Content-Type: application/json" \
    -d '{"title":"Civic Duties","slides":[{"heading":"Introduction","bullets":["What is civic duty","Why it matters"]}]}' | python -m json.tool || echo "Failed"

echo ""
echo ""
echo "=========================================="
echo "All Demos Complete!"
echo "=========================================="
echo ""
