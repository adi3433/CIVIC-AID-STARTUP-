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
        # Add User-Agent to avoid being blocked by GCS and CDNs
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/*,*/*;q=0.8'
        }
        
        # Fetch image from external URL (Server-Side bypasses CORS)
        resp = requests.get(image_url, headers=headers, timeout=30)
        resp.raise_for_status()  # Raise exception for 4xx/5xx
        
        # Build response with explicit CORS headers
        response = Response(resp.content, resp.status_code)
        response.headers['Content-Type'] = resp.headers.get('Content-Type', 'image/png')
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Cache-Control'] = 'public, max-age=3600'
        
        return response
    except requests.exceptions.Timeout:
        print(f"Proxy Timeout for: {image_url}")
        return "Proxy Timeout - image took too long to fetch", 504
    except requests.exceptions.HTTPError as e:
        print(f"Proxy HTTP Error for {image_url}: {e.response.status_code}")
        return f"Upstream Error: {e.response.status_code}", 502
    except Exception as e:
        print(f"Proxy Error for {image_url}: {str(e)}")
        return f"Proxy Error: {str(e)}", 500


@app.route('/health')
def health():
    return {"status": "healthy", "service": "civicaid-api"}, 200


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
