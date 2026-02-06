from flask import Blueprint, request, jsonify
import os

dispatch_bp = Blueprint('dispatch', __name__)

# Deterministic responses for demos
DEMO_FALLBACK_RESPONSES = {
    "default": {
        "action": "fallback_ai",
        "classification": "police",
        "transcript": "User: I am being robbed",
        "forward_to": "101"
    },
    "medical": {
        "action": "fallback_ai",
        "classification": "medical",
        "transcript": "User: Someone is having a heart attack",
        "forward_to": "102"
    },
    "fire": {
        "action": "fallback_ai",
        "classification": "fire",
        "transcript": "User: There is a fire in my building",
        "forward_to": "101"
    }
}

@dispatch_bp.route('/api/dispatch/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy", 
        "module": "dispatch", 
        "features": {
            "ai_classification": True,
            "voice_synthesis": True
        }
    })

@dispatch_bp.route('/api/dispatch/webhook', methods=['POST'])
def dispatch_webhook():
    """
    Handle incoming call dispatch webhook.
    """
    data = request.get_json()
    
    # Validate required fields
    if not data:
        return jsonify({
            "error": "bad_request",
            "message": "Request body must be JSON"
        }), 400
    
    call_id = data.get('call_id')
    caller_from = data.get('from')
    primary_busy = data.get('primary_busy', False)
    
    if not call_id:
        return jsonify({
            "error": "missing_field",
            "message": "call_id is required"
        }), 400
    
    if not caller_from:
        return jsonify({
            "error": "missing_field",
            "message": "from is required"
        }), 400
    
    # Dispatch logic
    if not primary_busy:
        return jsonify({
            "action": "connect_primary",
            "call_id": call_id,
            "note": "STUB: Would connect to primary agent via Twilio"
        })
    
    # Fallback to AI - deterministic response for demos
    metadata = data.get('metadata', {})
    emergency_type = metadata.get('emergency_type', 'default')
    
    response = DEMO_FALLBACK_RESPONSES.get(
        emergency_type, 
        DEMO_FALLBACK_RESPONSES['default']
    ).copy()
    
    response['call_id'] = call_id
    response['note'] = "STUB: Replace with actual Twilio + AI integration"
    
    return jsonify(response)
