from modules.whatsapp.bot_config_api import app
from modules.leadgen.routes import leadgen_bp
from modules.dispatch.routes import dispatch_bp
from modules.education.routes import education_bp

from flask import send_from_directory
import os

# Register Blueprints
app.register_blueprint(leadgen_bp)
app.register_blueprint(dispatch_bp)
app.register_blueprint(education_bp)

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
