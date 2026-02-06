from modules.whatsapp.bot_config_api import app
from modules.leadgen.routes import leadgen_bp

# Register Blueprints
app.register_blueprint(leadgen_bp)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)
