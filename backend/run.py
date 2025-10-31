from app import create_app

# Crea l'istanza dell'applicazione usando la factory
app = create_app()

if __name__ == '__main__':
    # Esegui l'applicazione
    # Per avviare: esegui `python run.py` dalla directory 'backend'
    app.run(debug=True)