# Dockerfile optimisé pour WhatsApp NestJS
FROM node:20-bullseye-slim

# Variables d'environnement
ENV PORT=4500
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Installer les dépendances système minimales en une seule couche
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget=1.21-1+deb11u2 \
    gnupg=2.2.27-2+deb11u2 \
    chromium=120.0.6099.224-1~deb11u1 \
    fonts-liberation=1:1.07.4-11 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

WORKDIR /app

# Copier les fichiers de package et installer TOUTES les dépendances
COPY package*.json ./
RUN npm install && npm cache clean --force

# Copier le code source et builder
COPY . .
RUN npm run build

# Supprimer les devDependencies après le build et définir NODE_ENV
RUN npm prune --omit=dev
ENV NODE_ENV=production

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