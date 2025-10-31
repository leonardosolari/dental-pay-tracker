# backend/Dockerfile

# --- Fase 1: Build ---
# Usa un'immagine Python ufficiale come base
FROM python:3.11-slim as builder

# Imposta la directory di lavoro nel container
WORKDIR /app

# Installa le dipendenze di sistema necessarie per alcune librerie Python
RUN apt-get update && apt-get install -y --no-install-recommends gcc

# Copia il file dei requisiti e installa le dipendenze Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir gunicorn

# Copia il resto dell'applicazione
COPY . .

# --- Fase 2: Run ---
# Usa un'immagine più leggera per l'esecuzione
FROM python:3.11-slim

WORKDIR /app

# Copia le dipendenze installate e l'app dalla fase di build
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
# ---> QUESTA È LA RIGA AGGIUNTA CHE RISOLVE IL PROBLEMA <---
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /app .

# Script per inizializzare il DB e avviare Gunicorn
COPY ./entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Esponi la porta su cui Gunicorn sarà in ascolto
EXPOSE 5000

# Comando per avviare l'applicazione
CMD ["/entrypoint.sh"]