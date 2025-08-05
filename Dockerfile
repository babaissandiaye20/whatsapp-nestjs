# Multi-stage build pour optimiser la taille
FROM node:20-slim AS builder

# Installer les dépendances système pour Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    libgconf-2-4 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxtst6 \
    libdrm2 \
    libxss1 \
    libnss3 \
    fonts-liberation \
    libappindicator3-1 \
    chromium \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production && npm cache clean --force

# Copier le code source
COPY . .

# Builder l'application
RUN npm run build

# Stage de production
FROM node:20-slim AS production

# Installer les dépendances système pour Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Créer un utilisateur non-root
RUN groupadd -r whatsapp && useradd -r -g whatsapp -s /bin/false whatsapp

# Copier les fichiers de build et node_modules
COPY --from=builder --chown=whatsapp:whatsapp /app/dist ./dist
COPY --from=builder --chown=whatsapp:whatsapp /app/node_modules ./node_modules
COPY --from=builder --chown=whatsapp:whatsapp /app/package*.json ./

# Créer les dossiers nécessaires
RUN mkdir -p /app/.wwebjs_auth /app/.wwebjs_cache && \
    chown -R whatsapp:whatsapp /app

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=4500
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Exposer le port
EXPOSE 4500

# Changer vers l'utilisateur non-root
USER whatsapp

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:4500/whatsapp/health || exit 1

# Commande de démarrage
CMD ["node", "dist/main.js"]