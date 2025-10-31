from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from config import Config

# Inizializza le estensioni globalmente ma senza un'app specifica
db = SQLAlchemy()

def create_app(config_class=Config):
    """
    Crea e configura un'istanza dell'applicazione Flask.
    Questo è il pattern "Application Factory".
    """
    app = Flask(__name__)
    
    # Carica la configurazione dall'oggetto Config
    app.config.from_object(config_class)

    # Abilita CORS per tutte le rotte
    CORS(app)
    
    # Collega l'istanza del database all'applicazione
    db.init_app(app)

    # --- Registrazione dei Blueprints ---
    # Importa i blueprint dalle loro rispettive route
    from app.routes.pazienti_routes import bp as pazienti_bp
    from app.routes.pagamenti_routes import bp as pagamenti_bp
    from app.routes.rate_routes import bp as rate_bp

    # Registra ogni blueprint con un prefisso URL comune per l'API
    app.register_blueprint(pazienti_bp, url_prefix='/api')
    app.register_blueprint(pagamenti_bp, url_prefix='/api')
    app.register_blueprint(rate_bp, url_prefix='/api')

    # --- Registrazione Comandi CLI ---
    @app.cli.command("init-db")
    def init_db_command():
        """Crea le tabelle del database."""
        with app.app_context():
            db.create_all()
        print("Database inizializzato.")

    return app