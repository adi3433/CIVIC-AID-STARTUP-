import sys
import os

# Add the parent directory (project root) to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from modules.whatsapp.bot_config_api import app
from modules.leadgen.routes import leadgen_bp
from modules.dispatch.routes import dispatch_bp
from modules.education.routes import education_bp


from flask import send_from_directory, request, Response
import os
import requests

# Register Blueprints
app.register_blueprint(leadgen_bp)
app.register_blueprint(dispatch_bp)
app.register_blueprint(education_bp)

@app.route('/api/proxy_image')
def proxy_image():
    image_url = request.args.get('url')
    if not image_url:
        return "Missing URL", 400
    
    try:
        # Fetch image from external URL (Server-Side bypasses CORS)
        resp = requests.get(image_url, stream=True, timeout=10)
        
        # Return image directly to client
        excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
        headers = [(name, value) for (name, value) in resp.raw.headers.items()
                   if name.lower() not in excluded_headers]
        
        return Response(resp.content, resp.status_code, headers)
    except Exception as e:
        return f"Proxy Error: {str(e)}", 500


@app.route('/')
def index():
    return send_from_directory('../web', 'landing.html')

@app.route('/<path:path>')
def serve_web_files(path):
    # Try serving the exact path
    if os.path.exists(os.path.join('../web', path)):
        return send_from_directory('../web', path)
    
    # Try appending .html (clean URL support)
    if os.path.exists(os.path.join('../web', f"{path}.html")):
        return send_from_directory('../web', f"{path}.html")
    
    # Return 404 if nothing found
    return "File not found", 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)
