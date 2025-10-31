#!/bin/sh

# Naviga nella directory dell'app
cd /app

# Inizializza il database se non esiste
if [ ! -f "app/dental_tracker.db" ]; then
    echo "Database non trovato, lo inizializzo..."
    flask init-db
    echo "Database inizializzato."
else
    echo "Database già esistente."
fi

# Avvia il server Gunicorn
echo "Avvio Gunicorn..."
exec gunicorn --bind 0.0.0.0:5000 --workers 4 "app:create_app()"