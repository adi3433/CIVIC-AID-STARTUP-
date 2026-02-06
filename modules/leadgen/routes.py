import os
from flask import Blueprint, request, jsonify
import google.generativeai as genai

leadgen_bp = Blueprint('leadgen', __name__)

# Configure Gemini if API key is present
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY') or os.getenv('NEXT_PUBLIC_GOOGLE_API_KEY')
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
    # Using the latest model as per original code logic
    model = genai.GenerativeModel('gemini-2.0-flash-lite')
else:
    model = None

# Deterministic recommendations for fallback (Demo Mode)
DEMO_RECOMMENDATIONS = {
    "default": "## Next Steps\n- Check CCTV footage from nearby cameras\n- Interview witness for detailed description\n- Alert nearby patrol units\n- Check similar cases in the database\n- Coordinate with traffic control for vehicle tracking",
    "theft": "## Analysis\nVehicle theft requires immediate containment.\n\n## Next Steps\n- Check CCTV footage from nearby cameras\n- Interview witness for vehicle/suspect description\n- Alert nearby patrol units with description\n- Check pawn shops and second-hand dealers\n- Review similar recent theft cases",
    "assault": "## Analysis\nPhysical assault cases prioritize victim safety.\n\n## Next Steps\n- Secure medical attention for victim\n- Document injuries and collect evidence\n- Interview witnesses and collect statements\n- Check CCTV for suspect identification",
    "fraud": "## Analysis\nFinancial fraud leaves digital trails.\n\n## Next Steps\n- Collect all financial transaction records\n- Trace money flow through banking channels\n- Check for similar fraud patterns in database\n- Coordinate with cyber cell for digital evidence"
}

def classify_case_type(case_text: str) -> str:
    """Simple keyword-based classification for demo purposes."""
    text_lower = case_text.lower()
    if any(word in text_lower for word in ['theft', 'stolen', 'steal', 'robbed']):
        return 'theft'
    elif any(word in text_lower for word in ['assault', 'attack', 'beaten', 'fight']):
        return 'assault'
    elif any(word in text_lower for word in ['fraud', 'scam', 'cheated', 'money']):
        return 'fraud'
    else:
        return 'default'

@leadgen_bp.route('/api/leadgen/analyze', methods=['POST'])
def analyze_case():
    """
    Analyze case text and generate recommendations.
    Uses Gemini API if key is available, else falls back to deterministic responses.
    """
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "bad_request", "message": "Request body must be JSON"}), 400
    
    case_text = data.get('case_text', '').strip()
    conversation_history = data.get('history', [])
    
    if not case_text:
        return jsonify({"error": "missing_field", "message": "case_text is required"}), 400

    # Try using Gemini API first
    if model:
        try:
            # Construct a prompt with history
            chat = model.start_chat(history=[
                {"role": "user" if msg["role"] == "user" else "model", "parts": [msg["content"]]}
                for msg in conversation_history
            ])
            
            # Add specific system instruction via the message if possible, 
            # or rely on the prompt context.
            # Since 'system_instruction' is model-level, we guide it in the prompt.
            system_context = """
            You are an AI assistant for Law Enforcement and Civic Aid. 
            Your goal is to analyze reports (theft, assault, fraud, etc.) and provide structured recommendations.
            Use Markdown formatting. Use headings like '## Analysis', '## Next Steps', '## Key Findings'.
            If appropriate, provide a Mermaid diagram for the workflow using ```mermaid ... ``` syntax.
            """
            
            # If no history, prepend system context
            if not conversation_history:
                full_prompt = f"{system_context}\n\nCase Report: {case_text}"
            else:
                full_prompt = case_text

            response = chat.send_message(full_prompt)
            return jsonify({
                "response": response.text,
                "source": "ai"
            })
            
        except Exception as e:
            print(f"Gemini API Error: {e}")
            # Fallback will handle it
            pass

    # Fallback to deterministic logic
    case_type = classify_case_type(case_text)
    response_text = DEMO_RECOMMENDATIONS.get(case_type, DEMO_RECOMMENDATIONS['default'])
    
    # Add a note about demo mode if AI failed or keys missing
    if not model:
        response_text += "\n\n*(Analysis provided by deterministic demo engine - Configure GOOGLE_API_KEY for live AI)*"

    return jsonify({
        "response": response_text,
        "source": "local_fallback",
        "case_type": case_type
    })

@leadgen_bp.route('/api/leadgen/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "module": "leadgen",
        "ai_enabled": bool(model)
    })
