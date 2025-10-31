# Dockerfile

# --- STAGE 1: Build della React App ---
FROM node:20-alpine as builder

WORKDIR /app

# Copia package.json e installa le dipendenze
COPY package.json .
RUN npm install

# Copia il resto del codice sorgente
COPY . .

# Esegui il build di produzione
RUN npm run build

# --- STAGE 2: Servi l'applicazione con Nginx ---
FROM nginx:stable-alpine

# Copia i file statici generati dalla fase di build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia la configurazione personalizzata di Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Esponi la porta 80, quella di default per Nginx
EXPOSE 80

# Comando per avviare Nginx
CMD ["nginx", "-g", "daemon off;"]