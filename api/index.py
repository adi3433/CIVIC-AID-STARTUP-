from modules.whatsapp.bot_config_api import app

# This is required for Vercel to find the Flask app instance
# Vercel looks for 'app' by default in the entry point
if __name__ == '__main__':
    app.run()
