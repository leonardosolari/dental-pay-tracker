import os

# Trova il percorso assoluto della directory del file config.py
basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    """Configurazioni di base per l'applicazione Flask."""
    
    # Imposta il percorso del database SQLite all'interno della directory 'app'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'app', 'dental_tracker.db')
    
    # Disabilita una feature di SQLAlchemy non necessaria che consuma risorse
    SQLALCHEMY_TRACK_MODIFICATIONS = False