# =============================================================================
# Makefile for Dental Pay Tracker
# =============================================================================

# Definiamo le variabili per i comandi di docker-compose per evitare ripetizioni.
# Questo rende il file più facile da mantenere.
COMPOSE_PROD = docker compose -f docker-compose.yml
COMPOSE_DEV  = docker compose -f docker-compose.dev.yml

# Nomi dei servizi Docker per i comandi 'exec'
BACKEND_SERVICE_NAME = dental_pay_tracker_backend_dev
FRONTEND_SERVICE_NAME = dental_pay_tracker_frontend_dev

# .PHONY dice a 'make' che questi non sono file reali.
# Evita problemi se crei una cartella chiamata 'build' e migliora le performance.
.PHONY: help dev up build logs stop down clean rebuild shell-backend shell-frontend lint

# Target di default: eseguendo solo 'make', mostra questo aiuto.
help:
	@echo "------------------------------------------------------------------------"
	@echo " Dental Pay Tracker - Comandi disponibili:"
	@echo "------------------------------------------------------------------------"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# --- Ambiente di Sviluppo ---
dev: ## Avvia l'ambiente di sviluppo con hot-reloading.
	@echo "🚀 Avvio dell'ambiente di sviluppo..."
	$(COMPOSE_DEV) up --build

stop-dev: ## Ferma l'ambiente di sviluppo.
	@echo "🛑 Arresto dell'ambiente di sviluppo..."
	$(COMPOSE_DEV) down

logs-dev: ## Mostra i log dei container di sviluppo in tempo reale.
	@echo "📜 Visualizzazione dei log di sviluppo..."
	$(COMPOSE_DEV) logs -f

# --- Ambiente di Produzione ---
up: ## Avvia l'ambiente di produzione in background.
	@echo "🚀 Avvio dell'ambiente di produzione..."
	$(COMPOSE_PROD) up -d --build

down: ## Ferma l'ambiente di produzione.
	@echo "🛑 Arresto dell'ambiente di produzione..."
	$(COMPOSE_PROD) down

logs: ## Mostra i log dei container di produzione in tempo reale.
	@echo "📜 Visualizzazione dei log di produzione..."
	$(COMPOSE_PROD) logs -f

# --- Comandi di Utilità ---
build: ## Costruisce le immagini Docker per la produzione.
	@echo "🛠️  Costruzione delle immagini di produzione..."
	$(COMPOSE_PROD) build

rebuild: ## Forza la ricostruzione delle immagini di produzione senza usare la cache.
	@echo "🛠️  Forzatura della ricostruzione delle immagini (no-cache)..."
	$(COMPOSE_PROD) build --no-cache

clean: ## Arresta e rimuove tutti i container, reti e volumi di produzione. ATTENZIONE: i dati del DB verranno persi.
	@echo "🧹 Pulizia completa dell'ambiente di produzione..."
	$(COMPOSE_PROD) down -v --remove-orphans

lint: ## Esegue il linter sul codice del frontend.
	@echo "🔎 Esecuzione del linter sul frontend..."
	$(COMPOSE_DEV) exec $(FRONTEND_SERVICE_NAME) npm run lint

shell-backend: ## Apre una shell nel container del backend (ambiente dev).
	@echo "💻 Accesso alla shell del container backend..."
	$(COMPOSE_DEV) exec $(BACKEND_SERVICE_NAME) /bin/sh

shell-frontend: ## Apre una shell nel container del frontend (ambiente dev).
	@echo "💻 Accesso alla shell del container frontend..."
	$(COMPOSE_DEV) exec $(FRONTEND_SERVICE_NAME) /bin/sh