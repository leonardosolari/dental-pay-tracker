#!/bin/sh
# update.sh

# Termina lo script se un comando fallisce
set -e

echo "▶️  Inizio aggiornamento..."

# 1. Scarica le ultime modifiche dalla branch 'main'
echo "📥 Eseguo git pull..."
git pull origin main

# 2. Ricostruisce e riavvia i container in background
# 'make up' dovrebbe già includere --build e -d
echo "🚀 Ricostruisco e avvio i container..."
make up

# 3. (Opzionale ma consigliato) Pulisce le vecchie immagini non più utilizzate
echo "🧹 Pulisco le vecchie immagini Docker..."
docker image prune -f

echo "✅ Aggiornamento completato con successo!"