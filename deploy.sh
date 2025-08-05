#!/bin/bash

# Script de déploiement pour WhatsApp NestJS API
set -e

echo "🚀 Démarrage du déploiement WhatsApp API..."

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction de log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    error "Docker n'est pas installé. Veuillez installer Docker first."
fi

if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose n'est pas installé. Veuillez installer Docker Compose first."
fi

# Arrêter les conteneurs existants
log "Arrêt des conteneurs existants..."
docker-compose down || warn "Aucun conteneur à arrêter"

# Nettoyer les images anciennes (optionnel)
if [[ "$1" == "--clean" ]]; then
    log "Nettoyage des images Docker anciennes..."
    docker system prune -f
    docker image prune -f
fi

# Construire les images
log "Construction des images Docker..."
docker-compose build --no-cache

# Démarrer les services
log "Démarrage des services..."
docker-compose up -d

# Attendre que l'API soit prête
log "Attente du démarrage de l'API..."
sleep 10

# Vérifier la santé de l'API
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -f http://localhost:4500/whatsapp/health &> /dev/null; then
        log "✅ API WhatsApp démarrée avec succès!"
        break
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    echo "Tentative $ATTEMPT/$MAX_ATTEMPTS..."
    sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    error "❌ L'API n'a pas pu démarrer correctement"
fi

# Afficher les informations de déploiement
log "📊 Informations de déploiement:"
echo "🌐 API URL: http://localhost:4500"
echo "📚 Swagger: http://localhost:4500/api-docs"
echo "🔍 Statut: http://localhost:4500/whatsapp/status"
echo "📱 QR Code: http://localhost:4500/whatsapp/qr"

# Afficher les logs en temps réel (optionnel)
if [[ "$1" == "--logs" ]]; then
    log "📋 Affichage des logs en temps réel..."
    docker-compose logs -f
fi

log "✅ Déploiement terminé avec succès!"
echo ""
echo "Pour voir les logs: docker-compose logs -f"
echo "Pour arrêter: docker-compose down"
echo "Pour redémarrer: docker-compose restart"