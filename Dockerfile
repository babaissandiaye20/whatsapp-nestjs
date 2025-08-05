# Dockerfile optimisé pour WhatsApp NestJS
FROM node:20-bullseye-slim

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=4500
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Installer les dépendances système minimales
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    chromium \
    fonts-liberation \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copier les fichiers de package
COPY package*.json ./

# Installer les dépendances
RUN npm ci --omit=dev && npm cache clean --force

# Copier le code source
COPY . .

# Builder l'application
RUN npm run build

# Créer un utilisateur non-root
RUN groupadd -r whatsapp && useradd -r -g whatsapp whatsapp

# Créer les dossiers nécessaires
RUN mkdir -p /app/.wwebjs_auth /app/.wwebjs_cache && \
    chown -R whatsapp:whatsapp /app

# Variables d'environnement pour Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Exposer le port
EXPOSE 4500

# Healthcheck simple
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4500/whatsapp/health || exit 1

# Changer vers l'utilisateur non-root
USER whatsapp

# Commande de démarrage
CMD ["node", "dist/main.js"]