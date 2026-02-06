from flask import Blueprint, request, jsonify
import os

education_bp = Blueprint('education', __name__)

@education_bp.route('/api/education/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "module": "education"})

@education_bp.route('/api/education/generate', methods=['POST'])
def generate_presentation():
    """
    Generate a presentation from structured content.
    """
    data = request.get_json()
    
    # Validate required fields
    if not data:
        return jsonify({
            "error": "bad_request",
            "message": "Request body must be JSON"
        }), 400
    
    title = data.get('title')
    if not title:
        return jsonify({
            "error": "missing_field",
            "message": "title is required"
        }), 400
    
    slides = data.get('slides')
    if not slides or not isinstance(slides, list):
        return jsonify({
            "error": "missing_field",
            "message": "slides array is required"
        }), 400
    
    # Mock generation for demo
    return jsonify({
        "status": "success",
        "message": "Presentation content generated",
        "artifact": f"{title.replace(' ', '_').lower()}.pptx",
        "slide_count": len(slides),
        "note": "Presentation generation is mocked in this Vercel deployment.",
        "content_preview": {
            "title": title,
            "slides": [s.get('heading', 'Untitled') for s in slides]
        }
    })
